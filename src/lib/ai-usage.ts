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

  // 12 months ago — used to scope the monthly breakdown
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  twelveMonthsAgo.setDate(1)
  twelveMonthsAgo.setHours(0, 0, 0, 0)

  const [totalLogs, totals, last30d, byOperation, monthlyLogs] = await Promise.all([
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
    // Fetch the timestamps + cost/token for the last 12 months and bucket in JS.
    // Prisma's groupBy can't truncate dates portably, so JS-side bucketing is the
    // simplest cross-database approach. The dataset is small (one row per AI call).
    prisma.aiUsageLog.findMany({
      where: { ...where, createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true, totalTokens: true, costUsd: true },
    }),
  ])

  const monthlyMap = new Map<string, { month: string; calls: number; tokens: number; costUsd: number }>()
  for (const log of monthlyLogs) {
    const month = log.createdAt.toISOString().slice(0, 7) // YYYY-MM
    const entry = monthlyMap.get(month) || { month, calls: 0, tokens: 0, costUsd: 0 }
    entry.calls++
    entry.tokens += log.totalTokens
    entry.costUsd += log.costUsd
    monthlyMap.set(month, entry)
  }
  const byMonth = Array.from(monthlyMap.values())
    .map(m => ({ ...m, costUsd: Math.round(m.costUsd * 10000) / 10000 }))
    .sort((a, b) => a.month.localeCompare(b.month))

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
    byMonth,
  }
}
