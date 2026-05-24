import prisma from '@/lib/prisma'

/**
 * Logs a candidate activity event. Wrapped in try/catch so it never
 * breaks the main flow — activity logging is best-effort.
 */
export async function logActivity(
  candidateId: string,
  type: string,
  description: string,
  metadata?: any
) {
  try {
    await prisma.candidateActivity.create({
      data: {
        candidateId,
        type,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
  } catch (err) {
    console.error('Failed to log activity:', err)
  }
}
