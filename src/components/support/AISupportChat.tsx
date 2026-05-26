'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, ChevronDown, ChevronUp, Ticket, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/contexts/LanguageContext'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AISupportChatProps {
  onCreateTicket: (context: string) => void
}

const MAX_MESSAGES = 10

export function AISupportChat({ onCreateTicket }: AISupportChatProps) {
  const { t } = useLanguage()
  const ts = t.dashboard.support
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading || messages.length >= MAX_MESSAGES) return

    const userMessage: ChatMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const history = updatedMessages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))

      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again or create a support ticket.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again or create a support ticket.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTicket = () => {
    const context = messages
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n\n')
    onCreateTicket(context)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Card className="border border-purple-200 dark:border-purple-800 shadow-sm">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setCollapsed(v => !v)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{ts.aiAssistant}</p>
              <p className="text-xs font-normal text-gray-500 dark:text-gray-400">{ts.aiAssistantDesc}</p>
            </div>
          </CardTitle>
          {collapsed
            ? <ChevronDown size={16} className="text-gray-400" />
            : <ChevronUp size={16} className="text-gray-400" />
          }
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-0">
          {/* Messages */}
          <div className="min-h-[120px] max-h-[360px] overflow-y-auto space-y-3 mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            {messages.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">
                {ts.typeQuestion}
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 text-gray-500 px-3 py-2 rounded-xl rounded-bl-sm border border-gray-200 dark:border-gray-700 text-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  {ts.aiThinking}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={ts.typeQuestion}
              disabled={loading || messages.length >= MAX_MESSAGES}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={sendMessage}
              disabled={!input.trim() || loading || messages.length >= MAX_MESSAGES}
              className="gap-1.5 px-3"
            >
              <Send size={14} />
            </Button>
          </div>

          {/* Create ticket button */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateTicket}
              className="w-full gap-2 text-gray-600 dark:text-gray-400"
            >
              <Ticket size={14} />
              {ts.createTicketInstead}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
