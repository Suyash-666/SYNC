import React, { useMemo, useState } from 'react';

const resources = [
  { id: 'r1', type: 'PDF', name: 'Algorithms Cheat Sheet.pdf', subject: 'Algorithms', size: '1.2MB', date: Date.now()-86400000*10 },
  { id: 'r2', type: 'Link', name: 'Replit Project', subject: 'Web', size: '-', date: Date.now()-86400000*2, url: 'https://replit.com' },
  { id: 'r3', type: 'Image', name: 'Lecture Slide.png', subject: 'DBMS', size: '450KB', date: Date.now()-86400000*5 },
];

export default function ResourceLibrary(){
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('All');
  const [type, setType] = useState('All');

  const filtered = useMemo(()=> resources.filter(r=> (filter==='All' || r.subject === filter) && (type==='All' || r.type === type) && r.name.toLowerCase().includes(q.toLowerCase())), [q,filter,type]);

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search resources" className="px-2 py-1 bg-transparent border rounded" />
          <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="bg-transparent border px-2 py-1 rounded">
            <option>All</option>
            <option>Algorithms</option>
            <option>DBMS</option>
            <option>Web</option>
          </select>
          <select value={type} onChange={(e)=>setType(e.target.value)} className="bg-transparent border px-2 py-1 rounded">
            <option>All</option>
            <option>PDF</option>
            <option>Link</option>
            <option>Image</option>
          </select>
        </div>
        <div>
          <button className="px-3 py-1 bg-indigo-600 rounded text-white">Upload Resource</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filtered.map(r=> (
          <div key={r.id} className="bg-surface-secondary border border-surface-border rounded p-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{r.type === 'PDF' ? '📄' : r.type === 'Link' ? '🔗' : '🖼️'}</div>
              <div className="flex-1">
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-gray-400">{r.subject} • {r.size}</div>
              </div>
              <div className="text-xs text-gray-400">{new Date(r.date).toLocaleDateString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
