import { NextResponse } from 'next/server';
import { hashPassword, createToken, createAuthCookie } from '../../../../lib/auth';
import { findUserByEmail, createUser } from '../../../../server/repositories/user';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = body;
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    const existing = await findUserByEmail(email.toLowerCase());
    if (existing) return NextResponse.json({ error: 'User exists' }, { status: 409 });

    const hashed = await hashPassword(password);
    const user = await createUser(email.toLowerCase(), name || null, hashed);
    const token = createToken(user.id);
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
    res.headers.append('Set-Cookie', createAuthCookie(token));
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
