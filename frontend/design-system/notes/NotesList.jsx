import React, { useMemo, useState } from 'react';

export default function NotesList({ notes, onNew, activeNoteId, setActiveNoteId, updateNote, deleteNote }){
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('recent');

  const filtered = useMemo(()=>{
    let out = notes.filter(n=> n.title.toLowerCase().includes(q.toLowerCase()) || n.content.toLowerCase().includes(q.toLowerCase()));
    if (sort === 'recent') out = out.sort((a,b)=> b.updatedAt - a.updatedAt);
    if (sort === 'alpha') out = out.sort((a,b)=> a.title.localeCompare(b.title));
    if (sort === 'created') out = out.sort((a,b)=> b.createdAt - a.createdAt);
    return out;
  },[notes,q,sort]);

  return (
    <div className="bg-surface-secondary border border-surface-border rounded p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search notes" className="px-2 py-1 bg-transparent border rounded" />
        </div>
        <div className="flex items-center gap-2">
          <select value={sort} onChange={(e)=>setSort(e.target.value)} className="bg-transparent border px-2 py-1 rounded">
            <option value="recent">Recent</option>
            <option value="alpha">Alphabetical</option>
            <option value="created">Date created</option>
          </select>
          <button onClick={onNew} className="px-2 py-1 bg-indigo-600 rounded text-white">New Note</button>
        </div>
      </div>

      <div className="overflow-auto space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">No notes yet. Create your first note.</div>
        ) : filtered.map(n => (
          <div key={n.id} onClick={()=>setActiveNoteId(n.id)} className={`p-3 rounded cursor-pointer ${activeNoteId === n.id ? 'bg-indigo-700 text-white' : 'hover:bg-slate-800'}`}>
            <div className="flex items-center justify-between">
              <div className="font-medium truncate max-w-[180px]">{n.title}</div>
              <div className="text-xs text-gray-300">{new Date(n.updatedAt).toLocaleDateString()}</div>
            </div>
            <div className="text-sm text-gray-400 mt-1 line-clamp-1">{n.content.replace(/\n/g, ' ').slice(0,120)}</div>
            <div className="mt-2 flex gap-2">
              {n.tags?.map(t=> <div key={t} className="text-xs bg-slate-700 px-2 py-0.5 rounded">{t}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
