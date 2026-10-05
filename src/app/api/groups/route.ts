import { NextResponse } from 'next/server';
import { getTokenFromCookie, verifyToken } from '../../../lib/auth';
import { getGroupsByUser, createGroup } from '../../../server/repositories/groups';

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const token = getTokenFromCookie(cookie);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const groups = await getGroupsByUser(payload.sub);
  return NextResponse.json({ groups });
}

export async function POST(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const token = getTokenFromCookie(cookie);
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, color } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
  const group = await createGroup(payload.sub, name, color || 'emerald-500');
  return NextResponse.json({ group });
}
