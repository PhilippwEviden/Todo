'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Star, Flame } from 'lucide-react';

export default function Header() {
  const [dark, setDark] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);

  async function loadUser() {
    const r = await fetch('/api/auth/me');
    const d = await r.json();
    if (d.user) setUser(d.user);
    else setUser(null);
  }

  useEffect(() => {
    const local = window.localStorage.getItem('theme');
    const browserTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const initialDark = local ? local === 'dark' : browserTheme.matches;
    document.documentElement.classList.toggle('dark', initialDark);
    setDark(initialDark);

    const onBrowserThemeChange = (event: MediaQueryListEvent) => {
      if (!window.localStorage.getItem('theme')) {
        document.documentElement.classList.toggle('dark', event.matches);
        setDark(event.matches);
      }
    };
    browserTheme.addEventListener('change', onBrowserThemeChange);

    loadUser();
    const onUserUpdated = () => loadUser();
    window.addEventListener('user-updated', onUserUpdated);
    return () => {
      browserTheme.removeEventListener('change', onBrowserThemeChange);
      window.removeEventListener('user-updated', onUserUpdated);
    };
  }, []);

  function toggleTheme() {
    const toDark = !dark;
    setDark(toDark);
    if (toDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    window.localStorage.setItem('theme', toDark ? 'dark' : 'light');
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.reload();
  }

  return (
    <header className="w-full py-3 flex items-center justify-between container">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-brand-300 to-brand-600 flex items-center justify-center text-white font-semibold">TG</div>
        <div>
          <h1 className="text-lg font-semibold">TodoGreen</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div aria-live="polite" className="flex items-center gap-2">
          <Star className="text-amber-400" />
          <span className="font-semibold">{user?.stats?.starsTotal ?? 0} Sterne</span>
        </div>
        <div aria-live="polite" className="flex items-center gap-2">
          <Flame className="text-emerald-500" />
          <span className="text-sm">Streak: {user?.stats?.currentStreak ?? 0}</span>
        </div>
        <button aria-label="Toggle theme" onClick={toggleTheme} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
          {dark ? <Sun /> : <Moon />}
        </button>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">{user.name ?? user.email}</span>
            <button onClick={logout} className="text-sm px-3 py-1 rounded bg-slate-100 dark:bg-slate-800">Logout</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <a href="/auth/login" className="text-sm px-3 py-1 rounded bg-emerald-600 text-white">Login</a>
            <a href="/auth/register" className="text-sm px-3 py-1 rounded border">Register</a>
          </div>
        )}
      </div>
    </header>
  );
}
