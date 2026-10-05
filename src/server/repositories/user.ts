import prisma from '../../lib/prisma';

export async function createUser(email: string, name: string | null, passwordHash: string) {
  return prisma.user.create({
    data: { email, name, password: passwordHash, stats: { create: {} } }
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserWithStats(id: string) {
  return prisma.user.findUnique({ where: { id }, include: { stats: true } });
}
