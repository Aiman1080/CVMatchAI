import { Header } from '@/components/layout/Header'
import { EmailClient } from '@/components/dashboard/EmailClient'

export default function EmailPage() {
  return (
    <div>
      <Header title="Email Inbox" description="Connect and scan recruitment email inboxes" />
      <div className="p-8"><EmailClient /></div>
    </div>
  )
}
