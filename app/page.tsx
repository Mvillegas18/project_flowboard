import { Workspace } from "@/components/kanban/workspace";
import { getBoards } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: { board?: string } }) {
  const boards = await getBoards();
  const activeBoard = boards.find((board) => board.id === searchParams.board) ?? boards[0] ?? null;
  return <Workspace boards={boards} activeBoard={activeBoard} />;
}
