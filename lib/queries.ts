import { prisma } from "@/lib/db";
import { ensureMockUser } from "@/lib/mock-user";
import type { BoardData } from "@/lib/kanban-types";

export async function getBoards(): Promise<BoardData[]> {
  const user = await ensureMockUser();
  const boards = await prisma.board.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      columns: {
        orderBy: { order: "asc" },
        include: { tasks: { orderBy: { order: "asc" } } },
      },
    },
  });

  return boards.map((board) => ({
    id: board.id,
    title: board.title,
    columns: board.columns.map((column) => ({
      id: column.id,
      title: column.title,
      order: column.order,
      tasks: column.tasks.map((task) => ({
        ...task,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      })),
    })),
  }));
}
