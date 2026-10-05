'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trash2 } from 'lucide-react';

type Group = { id: string; name: string; color: string };
type Task = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'DONE';
  groupId?: string | null;
  completedAt?: string | null;
};

const priorityLabel: Record<string, string> = { LOW: 'Niedrig', MEDIUM: 'Mittel', HIGH: 'Hoch', CRITICAL: 'Kritisch' };
const priorityColor: Record<string, string> = {
   LOW: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100',
   MEDIUM: 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800/60 dark:text-emerald-50',
   HIGH: 'bg-emerald-500 text-white dark:bg-emerald-600',
   CRITICAL: 'bg-emerald-900 text-white dark:bg-emerald-950'
};
const groupColorFallback = '#10b981';
const groupColorMap: Record<string, string> = {
  'emerald-500': '#10b981',
  'blue-500': '#3b82f6',
  'amber-500': '#f59e0b',
  'rose-500': '#f43f5e',
  'violet-500': '#8b5cf6'
};

function getGroupColor(color: string) {
  return color.startsWith('#') ? color : groupColorMap[color] || groupColorFallback;
}

function formatDueDate(value?: string | null) {
   if (!value) return '';
   const date = new Date(value);
   if (Number.isNaN(date.getTime())) return '';
   const hours = date.getHours();
   const minutes = date.getMinutes();
   const timeText = hours || minutes ? `, ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} Uhr` : '';
   return `${date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}${timeText}`;
}

function getDateTimeLocalMin() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function AppShell() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [groupWithTasksToDelete, setGroupWithTasksToDelete] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [selectedGroup, priorityFilter, statusFilter]);

  async function fetchGroups() {
    const r = await fetch('/api/groups');
    const d = await r.json();
    setGroups(d.groups || []);
  }

  async function fetchTasks() {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedGroup) params.set('groupId', selectedGroup);
    if (priorityFilter) params.set('priority', priorityFilter);
    if (statusFilter) params.set('status', statusFilter);
    const r = await fetch('/api/tasks?' + params.toString());
    const d = await r.json();
    setTasks(d.tasks || []);
    setLoading(false);
  }

  function smallConfetti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 }, colors: ['#A7F3D0', '#34D399', '#86EFAC', '#FBBF24'] });
  }

  async function toggleTaskStatus(id: string, currentStatus: 'OPEN' | 'DONE') {
    const action = currentStatus === 'DONE' ? 'reopen' : 'complete';
    const r = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    const d = await r.json();
    if (r.ok) {
      if (action === 'complete' && d.starsGained) {
        setMessage(`Fantastisch! +${d.starsGained} Sterne! Du bist unaufhaltsam! 🌟`);
        smallConfetti();
      } else if (action === 'reopen') {
        setMessage(`Task wieder geöffnet – ${d.starsRemoved} Sterne entfernt.`);
      }
      fetchTasks();
      window.dispatchEvent(new Event('user-updated'));
      setTimeout(() => setMessage(null), 3500);
    }
  }

  async function removeTask(id: string) {
    if (!confirm('Task löschen? Dies kann nicht rückgängig gemacht werden.')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  }

  async function saveTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body: any = { title: fd.get('title') as string, description: fd.get('description') as string || null, priority: fd.get('priority') as string, groupId: fd.get('groupId') as string || null };
    const due = fd.get('dueDate') as string;
    body.dueDate = due ? new Date(due).toISOString() : null;
    const r = await fetch(taskToEdit ? `/api/tasks/${taskToEdit.id}` : '/api/tasks', {
      method: taskToEdit ? 'PATCH' : 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });
    if (r.ok) {
      setShowForm(false);
      setTaskToEdit(null);
      fetchTasks();
    } else {
      const result = await r.json().catch(() => null);
      setMessage(result?.error || (taskToEdit ? 'Fehler beim Aktualisieren' : 'Fehler beim Erstellen'));
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function createGroup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const color = formData.get('color') as string;
    const r = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });
    if (r.ok) {
      setShowGroupForm(false);
      fetchGroups();
    } else {
      setMessage('Fehler beim Erstellen der Gruppe');
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function updateGroupColor(id: string, color: string) {
    const r = await fetch(`/api/groups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color })
    });
    if (r.ok) fetchGroups();
  }

  async function removeGroup(group: Group) {
    let r = await fetch(`/api/groups/${group.id}`, { method: 'DELETE', body: JSON.stringify({}) });
    if (r.status === 409) {
      setGroupWithTasksToDelete(group);
      return;
    }
    if (r.ok) {
      if (selectedGroup === group.id) setSelectedGroup(null);
      fetchGroups();
      fetchTasks();
    } else {
      setMessage('Gruppe konnte nicht gelöscht werden');
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function forceRemoveGroup(group: Group) {
    const r = await fetch(`/api/groups/${group.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: true })
    });
    if (r.ok) {
      if (selectedGroup === group.id) setSelectedGroup(null);
      fetchGroups();
      fetchTasks();
    } else {
      setMessage('Gruppe konnte nicht gelöscht werden');
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <aside className="w-full md:w-64">
        <div className="p-3 rounded-md shadow-card bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Gruppen</h2>
            <button type="button" aria-label="Gruppe hinzufügen" title="Gruppe hinzufügen" onClick={() => setShowGroupForm(true)} className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-lg leading-none text-white hover:bg-emerald-700">+</button>
          </div>
          <ul className="mt-3 space-y-2">
            <li>
              <button className={`w-full rounded px-2 py-2 text-left text-slate-800 dark:text-slate-100 ${!selectedGroup ? 'bg-emerald-50 dark:bg-emerald-950/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700/60'}`} onClick={() => setSelectedGroup(null)}>Alle Tasks</button>
            </li>
            {groups.map((g) => (
              <li key={g.id} className="flex items-center gap-1">
                <button className={`min-w-0 flex-1 text-left px-2 py-2 rounded ${selectedGroup === g.id ? 'bg-emerald-50 dark:bg-emerald-950/50' : ''}`} onClick={() => setSelectedGroup(g.id)}>
                  <span className="inline-block w-3 h-3 mr-2 rounded-full" style={{ backgroundColor: getGroupColor(g.color) }} aria-hidden></span>
                  {g.name}
                </button>
                <input type="color" aria-label={`Farbe von ${g.name} ändern`} title="Gruppenfarbe ändern" value={getGroupColor(g.color)} onChange={(e) => updateGroupColor(g.id, e.target.value)} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0" />
                <button type="button" aria-label={`${g.name} löschen`} title="Gruppe löschen" onClick={() => setGroupToDelete(g)} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700 dark:text-slate-300 dark:hover:bg-red-950/50 dark:hover:text-red-200">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <button className="w-full py-2 rounded bg-emerald-600 text-white" onClick={() => { setTaskToEdit(null); setShowForm(true); }}>+ Task hinzufügen</button>
          </div>
        </div>
      </aside>

      <section className="flex-1">
        <div className="p-3 rounded-md shadow-card bg-white dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Aufgaben {loading ? '…' : ''}</h2>
            <div className="flex items-center gap-2">
              <label className="sr-only">Priorität</label>
              <select value={priorityFilter ?? ''} onChange={(e) => setPriorityFilter(e.target.value || null)} className="rounded border border-emerald-800 bg-emerald-800 px-2 py-1 text-white shadow-sm dark:border-emerald-700 dark:bg-emerald-900">
                <option value="">Alle Prioritäten</option>
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
                <option value="CRITICAL">Kritisch</option>
              </select>

              <label className="sr-only">Status</label>
              <select value={statusFilter ?? ''} onChange={(e) => setStatusFilter(e.target.value || null)} className="rounded border border-emerald-800 bg-emerald-800 px-2 py-1 text-white shadow-sm dark:border-emerald-700 dark:bg-emerald-900">
                <option value="">Alle Status</option>
                <option value="OPEN">Offen</option>
                <option value="DONE">Erledigt</option>
              </select>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {tasks.length === 0 && <li className="text-slate-500 dark:text-slate-300">Noch keine Tasks – leg los!</li>}
            {tasks.map((t) => (
              <li key={t.id} className="p-3 rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/80 flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <input aria-label={t.status === 'DONE' ? `Task ${t.title} wieder öffnen` : `Markiere ${t.title} als erledigt`} type="checkbox" onChange={() => toggleTaskStatus(t.id, t.status)} checked={t.status === 'DONE'} className="w-6 h-6 mt-1 accent-emerald-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${t.status === 'DONE' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>{t.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${priorityColor[t.priority] || ''}`}>{priorityLabel[t.priority]}</span>
                    </div>
                    {t.description && <p className="text-sm text-slate-600 dark:text-slate-300">{t.description}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <button type="button" aria-label={`Bearbeite ${t.title}`} onClick={() => { setTaskToEdit(t); setShowForm(true); }} className="px-2 py-1 rounded border border-slate-200 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-100">Edit</button>
                    <button aria-label={`Lösche ${t.title}`} onClick={() => removeTask(t.id)} className="px-2 py-1 rounded bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-200">Löschen</button>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-300">{formatDueDate(t.dueDate)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {showForm && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/30 flex items-end md:items-center justify-center p-4">
          <form onSubmit={saveTask} className="w-full md:w-96 p-4 bg-white dark:bg-slate-800 rounded-t-lg md:rounded-lg" onKeyDown={(e) => { if (e.key === 'Escape') { setShowForm(false); setTaskToEdit(null); } }}>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{taskToEdit ? 'Task bearbeiten' : 'Neuen Task'}</h3>
            <label className="block mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">Titel <input name="title" required autoFocus defaultValue={taskToEdit?.title ?? ''} className="mt-1 w-full px-3 py-2.5 rounded border border-slate-300 bg-white text-base text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400" /></label>
            <label className="block mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">Beschreibung <textarea name="description" defaultValue={taskToEdit?.description ?? ''} className="mt-1 w-full px-3 py-2.5 rounded border border-slate-300 bg-white text-base text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400" /></label>
            <div className="flex gap-2 mt-2">
              <label className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">Fälligkeitsdatum <input name="dueDate" type="datetime-local" min={taskToEdit ? undefined : getDateTimeLocalMin()} defaultValue={toDateTimeLocalValue(taskToEdit?.dueDate)} className="mt-1 w-full px-3 py-2.5 rounded border border-slate-300 bg-white text-base text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" /></label>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Priorität <select name="priority" defaultValue={taskToEdit?.priority ?? 'MEDIUM'} className="mt-1 px-3 py-2.5 rounded border border-slate-300 bg-white text-base text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
                <option value="CRITICAL">Kritisch</option>
              </select></label>
            </div>
            <label className="block mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">Gruppe <select name="groupId" defaultValue={taskToEdit ? taskToEdit.groupId ?? '' : selectedGroup ?? ''} className="mt-1 w-full px-3 py-2.5 rounded border border-slate-300 bg-white text-base text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
              <option value="">Keine</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select></label>

            <div className="flex gap-2 mt-4">
              <button type="submit" className="px-4 py-2 rounded bg-emerald-600 text-white">{taskToEdit ? 'Speichern' : 'Erstellen'}</button>
              <button type="button" onClick={() => { setShowForm(false); setTaskToEdit(null); }} className="px-4 py-2 rounded border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-100">Abbrechen</button>
            </div>
          </form>
        </div>
      )}

      {showGroupForm && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
          <form onSubmit={createGroup} className="w-full max-w-sm rounded-lg bg-white p-4 dark:bg-slate-800" onKeyDown={(e) => { if (e.key === 'Escape') setShowGroupForm(false); }}>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Neue Gruppe</h3>
            <label className="mt-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Name
              <input name="name" required autoFocus className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" />
            </label>
            <label className="mt-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Farbe
              <input name="color" type="color" defaultValue="#10b981" className="mt-1 h-10 w-full cursor-pointer rounded border border-slate-300 bg-white p-1 dark:border-slate-600 dark:bg-slate-900" />
            </label>
            <div className="mt-4 flex gap-2">
              <button type="submit" className="rounded bg-emerald-600 px-4 py-2 text-white">Erstellen</button>
              <button type="button" onClick={() => setShowGroupForm(false)} className="rounded border border-slate-300 px-4 py-2 text-slate-700 dark:border-slate-600 dark:text-slate-100">Abbrechen</button>
            </div>
          </form>
        </div>
      )}

      {groupToDelete && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Gruppe löschen</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Willst du die Gruppe "{groupToDelete.name}" löschen?</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setGroupToDelete(null)} className="rounded border border-slate-300 px-4 py-2 text-slate-700 dark:border-slate-600 dark:text-slate-100">Abbrechen</button>
              <button type="button" onClick={() => { const group = groupToDelete; setGroupToDelete(null); removeGroup(group); }} className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">Löschen</button>
            </div>
          </div>
        </div>
      )}

      {groupWithTasksToDelete && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Gruppe enthält Tasks</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Willst du die Gruppe {groupWithTasksToDelete.name} löschen? Die Tasks bleiben erhalten.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setGroupWithTasksToDelete(null)} className="rounded border border-slate-300 px-4 py-2 text-slate-700 dark:border-slate-600 dark:text-slate-100">Abbrechen</button>
              <button type="button" onClick={() => { const group = groupWithTasksToDelete; setGroupWithTasksToDelete(null); forceRemoveGroup(group); }} className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700">Trotzdem löschen</button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div role="status" aria-live="polite" className="fixed left-1/2 -translate-x-1/2 bottom-6 bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-md">
          {message}
        </div>
      )}
    </div>
  );
}
