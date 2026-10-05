import prisma from '../../lib/prisma';

const thresholds = [0, 20, 60, 150, 350, 800];

export function starsForLevel(level: number) {
  return thresholds[level - 1] ?? thresholds[thresholds.length - 1];
}

export function nextLevelThreshold(level: number) {
  return thresholds[level] ?? thresholds[thresholds.length - 1];
}

export async function getUserStats(userId: string) {
  const stats = await prisma.userStats.findUnique({ where: { userId } });
  return stats;
}

export async function updateStars(userId: string, increment: number) {
  return prisma.userStats.update({ where: { userId }, data: { starsTotal: { increment } } });
}

export function computeLevelFromStars(stars: number) {
  let level = 1;
  for (let i = 0; i < thresholds.length; i++) {
    if (stars >= thresholds[i]) level = i + 1;
  }
  return level;
}
