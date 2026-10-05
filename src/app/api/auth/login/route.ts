import { NextResponse } from 'next/server';
import { verifyPassword, createToken, createAuthCookie } from '../../../../lib/auth';
import { findUserByEmail } from '../../../../server/repositories/user';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    const user = await findUserByEmail(email.toLowerCase());
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const ok = await verifyPassword(password, user.password);
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const token = createToken(user.id);
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
    res.headers.append('Set-Cookie', createAuthCookie(token));
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
