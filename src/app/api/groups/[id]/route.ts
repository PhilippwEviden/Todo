import { NextResponse } from 'next/server';
import { getTokenFromCookie, verifyToken } from '../../../../lib/auth';
import { updateGroup, deleteGroup } from '../../../../server/repositories/groups';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const cookie = req.headers.get('cookie') || '';
  const token = getTokenFromCookie(cookie);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await updateGroup(params.id, payload.sub, { name: body.name, color: body.color });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const cookie = req.headers.get('cookie') || '';
  const token = getTokenFromCookie(cookie);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { force } = await req.json();
  try {
    await deleteGroup(params.id, payload.sub, !!force);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e.message === 'GroupNotEmpty') return NextResponse.json({ error: 'Group not empty' }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
