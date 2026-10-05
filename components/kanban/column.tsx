"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import type { ColumnData } from "@/lib/kanban-types";
import { createTask, deleteColumn, updateColumnTitle } from "@/app/actions/kanban";
import { expectAction } from "@/lib/action-client";
import { InputDialog } from "./input-dialog";
import { TaskCard } from "./task-card";

export function Column({ column, boardId, columnCount }: { column: ColumnData; boardId: string; columnCount: number }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"task" | "rename" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { columnId: column.id } });

  async function submitDialog(values: { title: string; description: string; tags: string }) {
    if (dialog === "task") {
      await expectAction(createTask({ boardId, columnId: column.id, title: values.title, description: values.description, tags: parseTags(values.tags) }));
    } else if (dialog === "rename") {
      await expectAction(updateColumnTitle({ boardId, columnId: column.id, title: values.title }));
    }
    setDialog(null);
    router.refresh();
  }

  async function removeColumn() {
    if (!window.confirm(`Delete “${column.title}”? Its tasks will move to a neighboring column.`)) return;
    try {
      await expectAction(deleteColumn({ boardId, columnId: column.id }));
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not delete the column.");
    }
  }

  return (
    <>
      <section ref={setNodeRef} className={`flex w-[280px] min-w-[280px] flex-col rounded-xl border p-2 transition-colors duration-200 ${isOver ? "border-white/[0.18] bg-white/[0.035]" : "border-white/[0.065] bg-white/[0.015]"}`}>
        <header className="flex items-center justify-between px-2 pb-3 pt-1.5"><div className="flex items-center gap-2.5"><span className="h-1.5 w-1.5 rounded-full bg-zinc-500" /><h2 className="text-[12px] font-medium text-zinc-300">{column.title}</h2><span className="text-[10px] tabular-nums text-zinc-600">{column.tasks.length}</span></div>
          <div className="relative flex items-center"><button onClick={() => setDialog("task")} className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/[0.07] hover:text-zinc-200" aria-label={`Add task to ${column.title}`}><Plus size={14} /></button><button onClick={() => setMenuOpen((open) => !open)} className="rounded-md p-1.5 text-zinc-600 transition hover:bg-white/[0.07] hover:text-zinc-200" aria-label={`Options for ${column.title}`}><MoreHorizontal size={15} /></button>
            {menuOpen && <div className="absolute right-0 top-8 z-20 w-36 rounded-lg border border-white/[0.09] bg-[#19191c] p-1 shadow-xl"><button onClick={() => { setMenuOpen(false); setDialog("rename"); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[10px] text-zinc-300 hover:bg-white/[0.06]"><Pencil size={12} />Rename column</button><button disabled={columnCount <= 1} onClick={() => { setMenuOpen(false); void removeColumn(); }} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[10px] text-zinc-400 hover:bg-white/[0.05] hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={12} />Delete column</button></div>}
          </div>
        </header>
        <div className="scrollbar-thin flex min-h-[180px] flex-1 flex-col gap-2 overflow-y-auto px-0.5 pb-1"><SortableContext items={column.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}><AnimatePresence initial={false}>{column.tasks.map((task) => <motion.div layout key={task.id}><TaskCard task={task} boardId={boardId} /></motion.div>)}</AnimatePresence></SortableContext>
          {column.tasks.length === 0 && <button onClick={() => setDialog("task")} className="flex min-h-[92px] items-center justify-center rounded-lg border border-dashed border-white/[0.07] text-[11px] text-zinc-600 transition hover:border-white/[0.14] hover:text-zinc-400">No tasks yet <span className="mx-1">·</span> Add one</button>}
        </div>
        <button onClick={() => setDialog("task")} className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] font-medium text-zinc-600 transition hover:bg-white/[0.04] hover:text-zinc-300"><Plus size={13} />Add task</button>
      </section>
      <InputDialog open={dialog !== null} title={dialog === "task" ? `Add task to ${column.title}` : `Rename ${column.title}`} description={dialog === "task" ? "Capture the next piece of work." : "Choose a clear name for this workflow stage."} initialTitle={dialog === "rename" ? column.title : ""} showDescription={dialog === "task"} showTags={dialog === "task"} submitLabel={dialog === "task" ? "Create task" : "Save changes"} onClose={() => setDialog(null)} onSubmit={submitDialog} />
    </>
  );
}

function parseTags(value: string) { return value.split(",").map((tag) => tag.trim()).filter(Boolean); }
