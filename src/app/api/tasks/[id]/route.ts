import { NextResponse } from 'next/server';
import { getTokenFromCookie, verifyToken } from '../../../../lib/auth';
import { updateTask, deleteTask, toggleTaskStatus } from '../../../../server/repositories/tasks';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const token = getTokenFromCookie(cookie);
    const payload = token ? verifyToken(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const id = params.id;
    if (body.action === 'complete' || body.action === 'reopen') {
      const result = await toggleTaskStatus(id, payload.sub, body.action);
      if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ ok: true, ...result });
    }

    const updateData = { ...body };
    if (Object.prototype.hasOwnProperty.call(updateData, 'dueDate')) {
      if (updateData.dueDate === null || updateData.dueDate === '') {
        updateData.dueDate = null;
      } else {
        const dueDate = new Date(updateData.dueDate);
        if (Number.isNaN(dueDate.getTime())) {
          return NextResponse.json({ error: 'Invalid due date' }, { status: 400 });
        }
        updateData.dueDate = dueDate;
      }
    }

    await updateTask(id, payload.sub, updateData);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const token = getTokenFromCookie(cookie);
    const payload = token ? verifyToken(token) : null;
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = params.id;
    await deleteTask(id, payload.sub);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
