'use client';
import React from 'react';

export default function LoginPage() {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get('email');
    const password = fd.get('password');
    const r = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }), headers: { 'Content-Type': 'application/json' } });
    if (r.ok) {
      window.location.href = '/';
    } else {
      alert('Login fehlgeschlagen');
    }
  }

  return (
    <div className="container py-6">
      <div className="max-w-md mx-auto p-4 rounded bg-white dark:bg-slate-800">
        <h2 className="text-lg font-semibold">Login</h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <label className="block">Email <input name="email" type="email" required className="w-full px-2 py-2 rounded border" /></label>
          <label className="block">Passwort <input name="password" type="password" required className="w-full px-2 py-2 rounded border" /></label>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded bg-emerald-600 text-white">Einloggen</button>
            <a href="/auth/register" className="px-4 py-2 rounded border">Registrieren</a>
          </div>
        </form>
      </div>
    </div>
  );
}
