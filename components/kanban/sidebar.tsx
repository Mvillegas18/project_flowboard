"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KanbanSquare, Plus, Settings2, Pencil, Trash2 } from "lucide-react";
import type { BoardData } from "@/lib/kanban-types";
import { createBoard, deleteBoard, updateBoardTitle } from "@/app/actions/kanban";
import { expectAction } from "@/lib/action-client";
import { InputDialog } from "./input-dialog";

export function Sidebar({ boards, activeBoardId }: { boards: BoardData[]; activeBoardId: string | null }) {
  const router = useRouter();
  const [dialogBoard, setDialogBoard] = useState<string | "new" | null>(null);
  const editingBoard = boards.find((board) => board.id === dialogBoard);

  async function submitBoard(values: { title: string }) {
    if (dialogBoard === "new") {
      const result = await expectAction(createBoard({ title: values.title }));
      setDialogBoard(null);
      router.push(`/?board=${encodeURIComponent(result.boardId)}`);
      router.refresh();
      return;
    }
    if (!dialogBoard) return;
    await expectAction(updateBoardTitle({ boardId: dialogBoard, title: values.title }));
    setDialogBoard(null);
    router.refresh();
  }

  async function removeBoard(boardId: string, title: string) {
    if (!window.confirm(`Delete “${title}” and all its tasks?`)) return;
    try {
      await expectAction(deleteBoard({ boardId }));
      if (boardId === activeBoardId) {
        const nextBoard = boards.find((board) => board.id !== boardId);
        router.push(nextBoard ? `/?board=${encodeURIComponent(nextBoard.id)}` : "/");
      }
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not delete the board.");
    }
  }

  function selectBoard(board: BoardData) {
    router.push(board.id === boards[0]?.id ? "/" : `/?board=${encodeURIComponent(board.id)}`);
  }

  return (
    <>
      <aside className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-4 md:h-screen md:w-[228px] md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-3 md:py-4">
        <div className="flex min-w-0 items-center gap-2.5 md:mb-9">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.09] bg-white/[0.04] text-zinc-300"><KanbanSquare size={16} /></span>
          <span className="min-w-0"><span className="block truncate text-[13px] font-semibold text-zinc-200">Flowboard</span><span className="hidden text-[10px] text-zinc-600 md:block">Personal workspace</span></span>
        </div>
        <div className="hidden flex-1 md:block">
          <div className="mb-2 flex items-center justify-between px-2"><span className="text-[10px] font-medium text-zinc-500">Boards</span><button onClick={() => setDialogBoard("new")} className="rounded-md p-1 text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-200" aria-label="Create board"><Plus size={14} /></button></div>
          <nav className="space-y-0.5">
            {boards.map((board) => <div key={board.id} className={`group flex items-center rounded-lg transition ${activeBoardId === board.id ? "bg-white/[0.07]" : "hover:bg-white/[0.035]"}`}>
              <button onClick={() => selectBoard(board)} className={`flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2 text-left text-[12px] ${activeBoardId === board.id ? "text-zinc-200" : "text-zinc-500 group-hover:text-zinc-300"}`}><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${activeBoardId === board.id ? "bg-zinc-300" : "bg-zinc-700"}`} /><span className="truncate">{board.title}</span></button>
              <div className="mr-1 flex opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"><button onClick={() => setDialogBoard(board.id)} className="rounded p-1 text-zinc-500 hover:text-zinc-200" aria-label={`Rename ${board.title}`}><Pencil size={11} /></button><button onClick={() => void removeBoard(board.id, board.title)} className="rounded p-1 text-zinc-500 hover:text-rose-300" aria-label={`Delete ${board.title}`}><Trash2 size={11} /></button></div>
            </div>)}
          </nav>
          <button onClick={() => setDialogBoard("new")} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-zinc-600 transition hover:bg-white/[0.035] hover:text-zinc-300"><Plus size={13} />New board</button>
        </div>
        <button className="hidden items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300 md:flex"><Settings2 size={14} />Settings</button>
        <button onClick={() => setDialogBoard("new")} className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] text-zinc-300 md:hidden"><Plus size={13} />Board</button>
      </aside>
      <InputDialog open={dialogBoard !== null} title={dialogBoard === "new" ? "Create board" : "Rename board"} description="Boards keep related work together." initialTitle={editingBoard?.title ?? ""} submitLabel={dialogBoard === "new" ? "Create board" : "Save changes"} onClose={() => setDialogBoard(null)} onSubmit={submitBoard} />
    </>
  );
}
