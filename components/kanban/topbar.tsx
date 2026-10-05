"use client";

import { Plus, Columns3 } from "lucide-react";

export function Topbar({ boardTitle }: { boardTitle: string | null }) {
  return (
    <header className="hidden min-h-[52px] items-center border-b border-white/[0.06] px-6 md:flex">
      <span className="text-[11px] text-zinc-600">Workspace</span><span className="mx-2 text-zinc-800">/</span><span className="truncate text-[11px] text-zinc-300">{boardTitle ?? "No board selected"}</span>
    </header>
  );
}

export function BoardToolbar({ onAddTask, onAddColumn }: { onAddTask: () => void; onAddColumn: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={onAddColumn} className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 py-2 text-[11px] text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-200"><Columns3 size={13} /><span className="hidden sm:inline">Add stage</span></button>
      <button onClick={onAddTask} className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-[11px] font-medium text-zinc-900 transition hover:bg-white"><Plus size={13} />Add task</button>
    </div>
  );
}
