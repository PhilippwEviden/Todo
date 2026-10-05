import { NextResponse } from 'next/server';
import { getTokenFromCookie, verifyToken } from '../../../../lib/auth';
import { getUserWithStats } from '../../../../server/repositories/user';

export async function GET(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const token = getTokenFromCookie(cookie);
  if (!token) return NextResponse.json({ user: null }, { status: 200 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ user: null }, { status: 200 });
  const user = await getUserWithStats(payload.sub);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, stats: user.stats } });
}
