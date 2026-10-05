import prisma from '../../lib/prisma';

export async function createGroup(userId: string, name: string, color = 'emerald-500') {
  return prisma.group.create({ data: { userId, name, color } });
}

export async function getGroupsByUser(userId: string) {
  return prisma.group.findMany({ where: { userId }, orderBy: { name: 'asc' } });
}

export async function updateGroup(id: string, userId: string, data: { name?: string; color?: string }) {
  return prisma.group.updateMany({ where: { id, userId }, data });
}

export async function deleteGroup(id: string, userId: string, force = false) {
  const count = await prisma.task.count({ where: { groupId: id, userId } });
  if (count > 0 && !force) {
    throw new Error('GroupNotEmpty');
  }
  // if force, unassign tasks then delete group
  return prisma.$transaction(async (tx) => {
    if (count > 0) {
      await tx.task.updateMany({ where: { groupId: id, userId }, data: { groupId: null } });
    }
    await tx.group.deleteMany({ where: { id, userId } });
    return true;
  });
}
