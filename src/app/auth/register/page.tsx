'use client';
import React from 'react';

export default function RegisterPage() {
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get('email');
    const password = fd.get('password');
    const name = fd.get('name');
    const r = await fetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }), headers: { 'Content-Type': 'application/json' } });
    if (r.ok) {
      window.location.href = '/';
    } else {
      alert('Registrierung fehlgeschlagen');
    }
  }

  return (
    <div className="container py-6">
      <div className="max-w-md mx-auto p-4 rounded bg-white dark:bg-slate-800">
        <h2 className="text-lg font-semibold">Registrieren</h2>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <label className="block">Name <input name="name" type="text" className="w-full px-2 py-2 rounded border" /></label>
          <label className="block">Email <input name="email" type="email" required className="w-full px-2 py-2 rounded border" /></label>
          <label className="block">Passwort <input name="password" type="password" required className="w-full px-2 py-2 rounded border" /></label>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded bg-emerald-600 text-white">Registrieren</button>
            <a href="/auth/login" className="px-4 py-2 rounded border">Zum Login</a>
          </div>
        </form>
      </div>
    </div>
  );
}
