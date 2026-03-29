import type { NotificationType, Prisma } from "@prisma/client";
import { ApiError } from "../utils/http";
import { prisma } from "../utils/prisma";

export async function emitUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null }
  });
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      metadata: input.metadata
    }
  });

  return notification;
}

export async function createNotificationForAdmins(input: {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true }
  });

  if (admins.length === 0) {
    return [];
  }

  return Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        metadata: input.metadata
      })
    )
  );
}

export async function listNotifications(userId: string, limit = 25) {
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: safeLimit
    }),
    prisma.notification.count({
      where: { userId, readAt: null }
    })
  ]);

  return { notifications, unreadCount };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const existing = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId
    }
  });

  if (!existing) {
    throw new ApiError(404, "Notification not found");
  }

  const notification =
    existing.readAt === null
      ? await prisma.notification.update({
          where: { id: notificationId },
          data: { readAt: new Date() }
        })
      : existing;

  const unreadCount = await emitUnreadCount(userId);
  return { notification, unreadCount };
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null
    },
    data: {
      readAt: new Date()
    }
  });

  const unreadCount = await emitUnreadCount(userId);
  return { unreadCount };
}

