"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Pencil, Signal, Trash2 } from "lucide-react";
import type { TaskData } from "@/lib/kanban-types";
import { updateTask, deleteTask } from "@/app/actions/kanban";
import { expectAction } from "@/lib/action-client";
import { InputDialog } from "./input-dialog";

const priorityColors: Record<string, string> = { Urgent: "text-zinc-300", High: "text-zinc-400", Medium: "text-zinc-500", Low: "text-zinc-600" };

export function TaskCard({ task, boardId }: { task: TaskData; boardId: string }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: task.id, data: { task } });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  async function saveTask(values: { title: string; description: string; tags: string }) {
    await expectAction(updateTask({ boardId, taskId: task.id, title: values.title, description: values.description, tags: parseTags(values.tags), priority: task.priority }));
    setDialogOpen(false);
    router.refresh();
  }

  async function removeTask() {
    try {
      await expectAction(deleteTask({ boardId, taskId: task.id }));
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not delete the task.");
    }
  }

  return (
    <>
      <motion.article ref={setNodeRef} style={style} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: isDragging ? 0.35 : 1, y: 0 }} transition={{ duration: 0.18 }} {...attributes} {...listeners} className="group relative cursor-grab rounded-lg border border-white/[0.07] bg-[#111113] p-3 transition-all duration-200 hover:-translate-y-px hover:border-white/[0.13] hover:bg-[#151517] hover:shadow-[0_8px_22px_rgba(0,0,0,0.2)] active:cursor-grabbing" aria-label={`Task: ${task.title}`}>
        <div className="mb-2.5 flex items-start justify-between gap-2"><h3 className="text-[13px] font-medium leading-[1.5] tracking-[-0.01em] text-zinc-200">{task.title}</h3><div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); setDialogOpen(true); }} className="rounded-md p-1 text-zinc-500 transition hover:bg-white/[0.07] hover:text-zinc-200" aria-label="Edit task"><Pencil size={13} /></button>
          <button onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); void removeTask(); }} className="rounded-md p-1 text-zinc-500 transition hover:bg-rose-400/10 hover:text-rose-300" aria-label="Delete task"><Trash2 size={13} /></button>
        </div></div>
        {task.description && <p className="mb-3 line-clamp-2 text-[11.5px] leading-[1.65] text-zinc-500">{task.description}</p>}
        {task.tags.length > 0 && <div className="mb-2.5 flex flex-wrap gap-1">{task.tags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded border border-white/[0.07] bg-white/[0.025] px-1.5 py-[3px] text-[9px] leading-none text-zinc-500">{tag}</span>)}</div>}
        {task.priority && <div className="flex items-center gap-1.5 border-t border-white/[0.05] pt-2 text-[10px] text-zinc-500"><Signal size={10} />{task.priority}</div>}
      </motion.article>
      <InputDialog open={dialogOpen} title="Edit task" description="Update the details and tags for this task." initialTitle={task.title} initialDescription={task.description ?? ""} initialTags={task.tags.join(", ")} showDescription showTags submitLabel="Save changes" onClose={() => setDialogOpen(false)} onSubmit={saveTask} />
    </>
  );
}

export function TaskCardPreview({ task }: { task: TaskData }) {
  return <motion.article layout className="w-[280px] rotate-[1deg] rounded-lg border border-white/[0.16] bg-[#141416] p-3 shadow-2xl shadow-black/30">
    <h3 className="text-[13px] font-medium leading-[1.5] tracking-[-0.01em] text-zinc-200">{task.title}</h3>
    {task.description && <p className="mt-2 line-clamp-2 text-[11.5px] leading-[1.65] text-zinc-500">{task.description}</p>}
    {task.tags.length > 0 && <div className="mb-2 mt-3 flex flex-wrap gap-1">{task.tags.map((tag, index) => <span key={`${tag}-${index}`} className="rounded border border-white/[0.07] bg-white/[0.025] px-1.5 py-[3px] text-[9px] text-zinc-500">{tag}</span>)}</div>}
    {task.priority && <div className="mt-2 flex items-center gap-1.5 border-t border-white/[0.055] pt-2 text-[10px] text-zinc-500"><Signal size={10} />{task.priority}</div>}
  </motion.article>;
}

function parseTags(value: string) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}
