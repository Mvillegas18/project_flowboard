import type { BoardData } from "@/lib/kanban-types";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Board } from "./board";

export function Workspace({ boards, activeBoard }: { boards: BoardData[]; activeBoard: BoardData | null }) {
  return <main className="flex h-screen overflow-hidden bg-[#0b0b0c]"><Sidebar boards={boards} activeBoardId={activeBoard?.id ?? null} /><div className="flex min-w-0 flex-1 flex-col"><Topbar boardTitle={activeBoard?.title ?? null} /><div className="flex min-h-0 flex-1 flex-col px-4 pb-5 pt-5 md:px-6 md:pt-6"><Board board={activeBoard} /></div></div></main>;
}
