import prisma from './prisma'

const GEMINI_PRICING = {
  'gemini-2.5-flash': { inputPer1M: 0.15, outputPer1M: 0.60 },
  'gemini-1.5-flash': { inputPer1M: 0.075, outputPer1M: 0.30 },
}

export async function logAiUsage(
  userId: string,
  operation: string,
  inputTokens: number,
  outputTokens: number,
  model: string = 'gemini-2.5-flash',
  success: boolean = true,
) {
  const totalTokens = inputTokens + outputTokens
  const pricing = GEMINI_PRICING[model as keyof typeof GEMINI_PRICING] || GEMINI_PRICING['gemini-2.5-flash']
  const costUsd = (inputTokens / 1_000_000) * pricing.inputPer1M + (outputTokens / 1_000_000) * pricing.outputPer1M

  try {
    await prisma.aiUsageLog.create({
      data: { userId, operation, model, inputTokens, outputTokens, totalTokens, costUsd, success },
    })
  } catch (e) {
    console.error('[AI Usage] Failed to log:', e)
  }
}

export async function getAiUsageStats(userId?: string) {
  const where = userId ? { userId } : {}

  const [totalLogs, totals, last30d, byOperation] = await Promise.all([
    prisma.aiUsageLog.count({ where }),
    prisma.aiUsageLog.aggregate({
      where,
      _sum: { inputTokens: true, outputTokens: true, totalTokens: true, costUsd: true },
    }),
    prisma.aiUsageLog.aggregate({
      where: { ...where, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      _sum: { totalTokens: true, costUsd: true },
      _count: true,
    }),
    prisma.aiUsageLog.groupBy({
      by: ['operation'],
      where,
      _sum: { totalTokens: true, costUsd: true },
      _count: true,
    }),
  ])

  return {
    totalCalls: totalLogs,
    totalTokens: totals._sum.totalTokens || 0,
    totalInputTokens: totals._sum.inputTokens || 0,
    totalOutputTokens: totals._sum.outputTokens || 0,
    totalCostUsd: Math.round((totals._sum.costUsd || 0) * 10000) / 10000,
    last30d: {
      calls: last30d._count,
      tokens: last30d._sum.totalTokens || 0,
      costUsd: Math.round((last30d._sum.costUsd || 0) * 10000) / 10000,
    },
    byOperation: byOperation.map((op: any) => ({
      operation: op.operation,
      calls: op._count,
      tokens: op._sum.totalTokens || 0,
      costUsd: Math.round((op._sum.costUsd || 0) * 10000) / 10000,
    })),
  }
}
