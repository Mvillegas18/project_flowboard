"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, PointerSensor, closestCorners, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { arrayMove } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { BoardData, ColumnData, TaskData } from "@/lib/kanban-types";
import { createBoard, createColumn, createTask, moveTask, updateBoardTitle } from "@/app/actions/kanban";
import { expectAction } from "@/lib/action-client";
import { Column } from "./column";
import { TaskCardPreview } from "./task-card";
import { BoardToolbar } from "./topbar";
import { InputDialog } from "./input-dialog";

export function Board({ board }: { board: BoardData | null }) {
  const router = useRouter();
  const [displayColumns, setDisplayColumns] = useState<ColumnData[]>(board?.columns ?? []);
  const [activeTask, setActiveTask] = useState<TaskData | null>(null);
  const [dialog, setDialog] = useState<"task" | "column" | "board" | "new-board" | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => setDisplayColumns(board?.columns ?? []), [board]);

  function onDragStart(event: DragStartEvent) {
    setActiveTask(displayColumns.flatMap((column) => column.tasks).find((task) => task.id === event.active.id) ?? null);
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    if (!board || !event.over) return;
    const taskId = String(event.active.id);
    const overId = String(event.over.id);
    const source = displayColumns.find((column) => column.tasks.some((task) => task.id === taskId));
    const destination = displayColumns.find((column) => column.id === overId) ?? displayColumns.find((column) => column.tasks.some((task) => task.id === overId));
    if (!destination) return;
    const index = overId === destination.id ? destination.tasks.length : destination.tasks.findIndex((task) => task.id === overId);
    if (!source) return;
    const task = source.tasks.find((item) => item.id === taskId);
    if (!task) return;
    if (source.id === destination.id) {
      const fromIndex = source.tasks.findIndex((item) => item.id === taskId);
      if (fromIndex !== index) setDisplayColumns((current) => current.map((column) => column.id === source.id ? { ...column, tasks: arrayMove(column.tasks, fromIndex, index) } : column));
    } else {
      setDisplayColumns((current) => current.map((column) => {
        if (column.id === source.id) return { ...column, tasks: column.tasks.filter((item) => item.id !== taskId) };
        if (column.id === destination.id) {
          const tasks = [...column.tasks];
          tasks.splice(Math.min(index, tasks.length), 0, { ...task, columnId: column.id });
          return { ...column, tasks };
        }
        return column;
      }));
    }
    try {
      await expectAction(moveTask({ boardId: board.id, taskId, destinationColumnId: destination.id, index: Math.max(0, index) }));
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not move the task.");
      router.refresh();
    }
  }

  async function submitDialog(values: { title: string; description: string; tags: string }) {
    if (dialog === "new-board") {
      const result = await expectAction(createBoard({ title: values.title }));
      setDialog(null);
      router.push(`/?board=${encodeURIComponent(result.boardId)}`);
      router.refresh();
      return;
    }
    if (!board) return;
    if (dialog === "task") {
      const column = board.columns[0];
      if (!column) throw new Error("Create a column before adding tasks.");
      await expectAction(createTask({ boardId: board.id, columnId: column.id, title: values.title, description: values.description, tags: parseTags(values.tags) }));
    }
    if (dialog === "column") await expectAction(createColumn({ boardId: board.id, title: values.title }));
    if (dialog === "board") await expectAction(updateBoardTitle({ boardId: board.id, title: values.title }));
    setDialog(null);
    router.refresh();
  }

  if (!board) return <section className="flex min-h-0 flex-1 flex-col items-center justify-center text-center"><span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-zinc-500"><Plus size={17} /></span><h2 className="text-sm font-medium text-zinc-300">Your workspace is ready</h2><p className="mt-1 text-xs text-zinc-600">Create a board to organize your work.</p><button onClick={() => setDialog("new-board")} className="mt-4 rounded-lg bg-zinc-100 px-3.5 py-2 text-[11px] font-medium text-zinc-900 transition hover:bg-white">Create board</button><InputDialog open={dialog === "new-board"} title="Create board" description="Boards keep related work together." submitLabel="Create board" onClose={() => setDialog(null)} onSubmit={submitDialog} /></section>;

  const totalTasks = displayColumns.reduce((total, column) => total + column.tasks.length, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><button onClick={() => setDialog("board")} className="text-left text-[21px] font-semibold tracking-[-0.04em] text-zinc-100 transition hover:text-white">{board.title}</button><p className="mt-1 text-[11px] text-zinc-600">{totalTasks} {totalTasks === 1 ? "task" : "tasks"} · {displayColumns.length} {displayColumns.length === 1 ? "stage" : "stages"}</p></div><BoardToolbar onAddTask={() => setDialog("task")} onAddColumn={() => setDialog("column")} /></div>
      {displayColumns.length === 0 ? <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08]"><h2 className="text-sm font-medium text-zinc-300">This board has no columns</h2><button onClick={() => setDialog("column")} className="mt-3 flex items-center gap-1 rounded-lg bg-zinc-100 px-3 py-2 text-[11px] font-medium text-zinc-900 transition hover:bg-white"><Plus size={13} />Create a stage</button></div> : <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveTask(null)}>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="scrollbar-thin flex min-h-0 flex-1 items-start gap-3 overflow-x-auto pb-4 pr-1">{displayColumns.slice().sort((a, b) => a.order - b.order).map((column) => <Column key={column.id} column={column} boardId={board.id} columnCount={displayColumns.length} />)}<button onClick={() => setDialog("column")} className="flex h-10 w-10 min-w-[40px] items-center justify-center rounded-xl border border-dashed border-white/[0.09] text-zinc-600 transition hover:border-white/[0.18] hover:text-zinc-300" aria-label="Add column"><Plus size={15} /></button></motion.div>
        <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>{activeTask ? <TaskCardPreview task={activeTask} /> : null}</DragOverlay>
      </DndContext>}
      <footer className="border-t border-white/[0.055] pt-3 text-[10px] text-zinc-700"><span>Drag tasks between stages to update their status.</span></footer>
      <InputDialog open={dialog !== null} title={dialog === "task" ? "Add task" : dialog === "column" ? "Add column" : "Rename board"} description={dialog === "task" ? "Add a task to the first stage." : dialog === "column" ? "Add a stage to this workflow." : "Give this board a clear name."} initialTitle={dialog === "board" ? board.title : ""} showDescription={dialog === "task"} showTags={dialog === "task"} submitLabel={dialog === "task" ? "Create task" : dialog === "column" ? "Create column" : "Save changes"} onClose={() => setDialog(null)} onSubmit={submitDialog} />
    </div>
  );
}

function parseTags(value: string) { return value.split(",").map((tag) => tag.trim()).filter(Boolean); }
