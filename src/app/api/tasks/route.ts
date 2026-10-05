import { NextResponse } from 'next/server';
import { getTokenFromCookie, verifyToken } from '../../../lib/auth';
import { getTasksByUser, createTask } from '../../../server/repositories/tasks';

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const token = getTokenFromCookie(cookie);
    const payload = token ? verifyToken(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const groupId = url.searchParams.get('groupId');
    const priority = url.searchParams.get('priority');
    const status = url.searchParams.get('status');

    const tasks = await getTasksByUser(payload.sub, { groupId: groupId || undefined, priority: priority || undefined, status: status || undefined });
    return NextResponse.json({ tasks });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const token = getTokenFromCookie(cookie);
    const payload = token ? verifyToken(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, description, dueDate, priority, groupId } = body;
    if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

    if (dueDate) {
      const parsedDueDate = new Date(dueDate);
      if (Number.isNaN(parsedDueDate.getTime())) {
        return NextResponse.json({ error: 'Invalid due date' }, { status: 400 });
      }
      if (parsedDueDate.getTime() < Date.now()) {
        return NextResponse.json({ error: 'Due date cannot be in the past' }, { status: 400 });
      }
    }

    const data: any = { title, description: description || null, userId: payload.sub, priority: priority || 'MEDIUM' };
    if (dueDate) data.dueDate = new Date(dueDate);
    if (groupId) data.groupId = groupId;

    const task = await createTask(data);
    return NextResponse.json({ task });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
