import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { computeLevelFromStars } from './stats';

const priorityStars: Record<string, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 5
};

export async function createTask(data: Prisma.TaskCreateInput) {
  return prisma.task.create({ data });
}

export async function getTasksByUser(userId: string, opts?: { groupId?: string | null; priority?: string | null; status?: string | null }) {
  const where: any = { userId };
  if (opts?.groupId) where.groupId = opts.groupId;
  if (opts?.priority) where.priority = opts.priority;
  if (opts?.status) where.status = opts.status;
  return prisma.task.findMany({ where, orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }] });
}

export async function updateTask(id: string, userId: string, data: Partial<Prisma.TaskUpdateInput>) {
  return prisma.task.updateMany({ where: { id, userId }, data });
}

export async function deleteTask(id: string, userId: string) {
  return prisma.task.deleteMany({ where: { id, userId } });
}

export async function toggleTaskStatus(id: string, userId: string, action: 'complete' | 'reopen') {
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) return null;

  if (action === 'reopen') {
    if (task.status === 'OPEN') {
      return { task, starsGained: 0, action: 'reopen', changed: false };
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id },
        data: { status: 'OPEN', completedAt: null }
      });

      const stats = await tx.userStats.findUnique({ where: { userId } });
      const starsRemoved = priorityStars[task.priority];
      if (stats) {
        const starsTotal = Math.max(0, stats.starsTotal - starsRemoved);
        await tx.userStats.update({
          where: { userId },
          data: { starsTotal, level: computeLevelFromStars(starsTotal) }
        });
      }

      return { task: updated, starsGained: 0, starsRemoved, action: 'reopen', changed: true };
    });
  }

  if (task.status === 'DONE') {
    return { task, starsGained: 0, action: 'complete', changed: false };
  }

  const stars = priorityStars[task.priority];

  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.task.update({ where: { id }, data: { status: 'DONE', completedAt: now } });

    const stats = await tx.userStats.findUnique({ where: { userId } });
    if (!stats) {
      await tx.userStats.create({ data: { userId, starsTotal: stars, lastCompleted: now, currentStreak: 1, longestStreak: 1, level: 1 } });
    } else {
      let newStreak = 1;
      const last = stats.lastCompleted;
      if (last) {
        const lastDate = new Date(last);
        const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
        const yesterdayDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        if (lastDay.getTime() === yesterdayDay.getTime()) newStreak = stats.currentStreak + 1;
        else if (new Date(last).toDateString() === new Date().toDateString()) newStreak = stats.currentStreak;
      }
      const longest = Math.max(stats.longestStreak, newStreak);
      await tx.userStats.update({
        where: { userId },
        data: { starsTotal: { increment: stars }, lastCompleted: now, currentStreak: newStreak, longestStreak: longest }
      });
    }

    return { task: updated, starsGained: stars, action: 'complete', changed: true };
  });
}
