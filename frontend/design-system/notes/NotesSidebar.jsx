import React, { useState } from 'react';

function FolderRow({ name, count, active, onClick, onRename, onDelete }){
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)} className={`flex items-center justify-between px-2 py-2 rounded cursor-pointer ${active ? 'bg-indigo-600 text-white' : 'text-gray-200 hover:bg-slate-800'}`} onClick={onClick}>
      <div className="flex items-center gap-2">
        <span>📁</span>
        <span className="truncate">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs bg-slate-700 px-2 py-1 rounded">{count}</div>
        {hover && (
          <div className="flex items-center gap-1 text-xs opacity-80">
            <button onClick={(e)=>{ e.stopPropagation(); onRename(); }} className="px-2 py-1 rounded bg-slate-700">Rename</button>
            <button onClick={(e)=>{ e.stopPropagation(); onDelete(); }} className="px-2 py-1 rounded bg-red-600">Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotesSidebar({ folders, setFolders, activeFolder, setActiveFolder, notes }){
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  function createFolder(){
    if(!newName) return setShowNew(false);
    setFolders(f=>[...f, { id: 'f' + Date.now(), title: newName }]);
    setNewName(''); setShowNew(false);
  }

  function renameFolder(oldTitle){
    const name = prompt('Rename folder', oldTitle);
    if (!name) return;
    setFolders(f=> f.map(x=> x.title === oldTitle ? { ...x, title: name } : x));
    if (activeFolder === oldTitle) setActiveFolder(name);
  }

  function deleteFolder(title){
    if (!confirm('Delete folder and its notes?')) return;
    setFolders(f=> f.filter(x=> x.title !== title));
    // notes deletion not handled here; parent may handle
    if (activeFolder === title) setActiveFolder(folders[0]?.children?.[0] || folders[0]?.title || '');
  }

  function countFor(title){
    return notes.filter(n=> n.folder === title).length;
  }

  return (
    <div className="bg-surface-secondary border border-surface-border rounded p-3 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium">Folders</div>
        <div>
          <button onClick={()=>setShowNew(s=>!s)} className="px-2 py-1 bg-indigo-600 rounded text-sm">New Folder</button>
        </div>
      </div>

      {showNew && (
        <div className="mb-3 flex gap-2">
          <input value={newName} onChange={(e)=>setNewName(e.target.value)} placeholder="Folder name" className="flex-1 bg-transparent border px-2 py-1 rounded" />
          <button onClick={createFolder} className="px-2 py-1 bg-indigo-600 rounded">Create</button>
        </div>
      )}

      <div className="space-y-2 overflow-auto">
        {folders.map(folder => (
          <div key={folder.id}>
            <FolderRow name={folder.title} count={countFor(folder.title)} active={activeFolder === folder.title} onClick={()=>{
              // choose first child if exists
              const target = folder.children?.[0] || folder.title;
              setActiveFolder(target);
            }} onRename={()=>renameFolder(folder.title)} onDelete={()=>deleteFolder(folder.title)} />

            {folder.children && folder.children.map(ch => (
              <div key={ch} className={`pl-6 mt-1` }>
                <FolderRow name={ch} count={countFor(ch)} active={activeFolder === ch} onClick={()=>setActiveFolder(ch)} onRename={()=>renameFolder(ch)} onDelete={()=>deleteFolder(ch)} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
