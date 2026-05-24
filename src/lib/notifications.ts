import prisma from '@/lib/prisma'

type NotificationType = 'cv_analyzed' | 'ticket_reply' | 'new_candidate' | 'scan_complete'

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string
) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message },
    })
  } catch (error) {
    // Log but don't throw — notifications should never break the main flow
    console.error('Failed to create notification:', error)
  }
}
