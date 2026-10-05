"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { ensureMockUser } from "@/lib/mock-user";
import {
  createBoardSchema, createColumnSchema, createTaskSchema, deleteBoardSchema,
  deleteColumnSchema, deleteTaskSchema, moveTaskSchema, updateBoardTitleSchema,
  updateColumnTitleSchema, updateTaskSchema,
} from "@/lib/validation";

type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string };
type ActionFailure = { ok: false; error: string };

function invalid(message: string): ActionFailure { return { ok: false, error: message }; }
function validationMessage(error: { issues: { message: string }[] }) { return error.issues[0]?.message ?? "Check the submitted values."; }
function failed(message: string): ActionFailure { return { ok: false, error: message }; }
function refresh() { revalidatePath("/"); }

export async function createBoard(input: unknown): Promise<ActionResult<{ boardId: string }>> {
  const parsed = createBoardSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: validationMessage(parsed.error) };
  try {
    const user = await ensureMockUser();
    const board = await prisma.board.create({
      data: {
        title: parsed.data.title,
        userId: user.id,
        columns: { create: ["Todo", "In Progress", "In Review", "Done"].map((title, order) => ({ title, order })) },
      },
      select: { id: true },
    });
    refresh();
    return { ok: true, data: { boardId: board.id } };
  } catch (error) {
    console.error("createBoard failed", error);
    return failed("Could not create the board. Check your database connection and try again.");
  }
}

export async function updateBoardTitle(input: unknown): Promise<ActionResult> {
  const parsed = updateBoardTitleSchema.safeParse(input);
  if (!parsed.success) return invalid(validationMessage(parsed.error));
  try {
    const user = await ensureMockUser();
    const result = await prisma.board.updateMany({ where: { id: parsed.data.boardId, userId: user.id }, data: { title: parsed.data.title } });
    if (!result.count) return failed("Board not found.");
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    console.error("updateBoardTitle failed", error);
    return failed("Could not rename the board.");
  }
}

export async function deleteBoard(input: unknown): Promise<ActionResult> {
  const parsed = deleteBoardSchema.safeParse(input);
  if (!parsed.success) return invalid(validationMessage(parsed.error));
  try {
    const user = await ensureMockUser();
    const result = await prisma.board.deleteMany({ where: { id: parsed.data.boardId, userId: user.id } });
    if (!result.count) return failed("Board not found.");
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    console.error("deleteBoard failed", error);
    return failed("Could not delete the board.");
  }
}

export async function createColumn(input: unknown): Promise<ActionResult<{ columnId: string }>> {
  const parsed = createColumnSchema.safeParse(input);
  if (!parsed.success) return invalid(validationMessage(parsed.error));
  try {
    const user = await ensureMockUser();
    const board = await prisma.board.findFirst({ where: { id: parsed.data.boardId, userId: user.id }, select: { id: true } });
    if (!board) return failed("Board not found.");
    const order = await prisma.column.count({ where: { boardId: board.id } });
    const column = await prisma.column.create({ data: { title: parsed.data.title, order, boardId: board.id }, select: { id: true } });
    refresh();
    return { ok: true, data: { columnId: column.id } };
  } catch (error) {
    console.error("createColumn failed", error);
    return failed("Could not create the column.");
  }
}

export async function updateColumnTitle(input: unknown): Promise<ActionResult> {
  const parsed = updateColumnTitleSchema.safeParse(input);
  if (!parsed.success) return invalid(validationMessage(parsed.error));
  try {
    const user = await ensureMockUser();
    const result = await prisma.column.updateMany({ where: { id: parsed.data.columnId, boardId: parsed.data.boardId, board: { is: { userId: user.id } } }, data: { title: parsed.data.title } });
    if (!result.count) return failed("Column not found.");
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    console.error("updateColumnTitle failed", error);
    return failed("Could not rename the column.");
  }
}

export async function deleteColumn(input: unknown): Promise<ActionResult> {
  const parsed = deleteColumnSchema.safeParse(input);
  if (!parsed.success) return invalid(validationMessage(parsed.error));
  try {
    const user = await ensureMockUser();
    await prisma.$transaction(async (tx) => {
      const columns = await tx.column.findMany({
        where: { boardId: parsed.data.boardId, board: { is: { userId: user.id } } },
        orderBy: { order: "asc" },
        include: { tasks: { orderBy: { order: "asc" } } },
      });
      const index = columns.findIndex((column) => column.id === parsed.data.columnId);
      if (index < 0) throw new Error("COLUMN_NOT_FOUND");
      if (columns.length < 2) throw new Error("LAST_COLUMN");
      const removed = columns[index];
      const target = columns[index + 1] ?? columns[index - 1];
      const remaining = columns.filter((column) => column.id !== removed.id);
      const targetTasks = target.tasks;
      await Promise.all(removed.tasks.map((task, taskIndex) => tx.task.update({ where: { id: task.id }, data: { columnId: target.id, order: targetTasks.length + taskIndex } })));
      await tx.column.delete({ where: { id: removed.id } });
      await Promise.all(remaining.map((column, order) => tx.column.update({ where: { id: column.id }, data: { order } })));
    });
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_COLUMN") return failed("A board must keep at least one column.");
    if (error instanceof Error && error.message === "COLUMN_NOT_FOUND") return failed("Column not found.");
    console.error("deleteColumn failed", error);
    return failed("Could not delete the column.");
  }
}

export async function createTask(input: unknown): Promise<ActionResult<{ taskId: string }>> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) return invalid(validationMessage(parsed.error));
  try {
    const user = await ensureMockUser();
    const column = await prisma.column.findFirst({ where: { id: parsed.data.columnId, boardId: parsed.data.boardId, board: { is: { userId: user.id } } }, select: { id: true } });
    if (!column) return failed("Column not found.");
    const order = await prisma.task.count({ where: { columnId: column.id } });
    const task = await prisma.task.create({
      data: { title: parsed.data.title, description: parsed.data.description || null, tags: parsed.data.tags, priority: parsed.data.priority ?? null, order, columnId: column.id },
      select: { id: true },
    });
    refresh();
    return { ok: true, data: { taskId: task.id } };
  } catch (error) {
    console.error("createTask failed", error);
    return failed("Could not create the task.");
  }
}

export async function updateTask(input: unknown): Promise<ActionResult> {
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) return invalid(validationMessage(parsed.error));
  try {
    const user = await ensureMockUser();
    const task = await prisma.task.findUnique({ where: { id: parsed.data.taskId }, select: { id: true, columnId: true } });
    if (!task) return failed("Task not found.");
    const column = await prisma.column.findFirst({ where: { id: task.columnId, boardId: parsed.data.boardId, board: { is: { userId: user.id } } }, select: { id: true } });
    if (!column) return failed("Task not found.");
    await prisma.task.update({ where: { id: task.id }, data: { title: parsed.data.title, description: parsed.data.description || null, tags: parsed.data.tags, priority: parsed.data.priority ?? null } });
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    console.error("updateTask failed", error);
    return failed("Could not update the task.");
  }
}

export async function deleteTask(input: unknown): Promise<ActionResult> {
  const parsed = deleteTaskSchema.safeParse(input);
  if (!parsed.success) return invalid(validationMessage(parsed.error));
  try {
    const user = await ensureMockUser();
    const task = await prisma.task.findUnique({ where: { id: parsed.data.taskId }, select: { id: true, columnId: true } });
    if (!task) return failed("Task not found.");
    const column = await prisma.column.findFirst({ where: { id: task.columnId, boardId: parsed.data.boardId, board: { is: { userId: user.id } } }, select: { id: true } });
    if (!column) return failed("Task not found.");
    await prisma.$transaction(async (tx) => {
      await tx.task.delete({ where: { id: task.id } });
      const remaining = await tx.task.findMany({ where: { columnId: column.id }, orderBy: { order: "asc" }, select: { id: true } });
      await Promise.all(remaining.map((item, order) => tx.task.update({ where: { id: item.id }, data: { order } })));
    });
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    console.error("deleteTask failed", error);
    return failed("Could not delete the task.");
  }
}

export async function moveTask(input: unknown): Promise<ActionResult> {
  const parsed = moveTaskSchema.safeParse(input);
  if (!parsed.success) return invalid(validationMessage(parsed.error));
  try {
    const user = await ensureMockUser();
    await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({ where: { id: parsed.data.taskId }, select: { id: true, columnId: true } });
      if (!task) throw new Error("TASK_NOT_FOUND");
      const source = await tx.column.findFirst({ where: { id: task.columnId, boardId: parsed.data.boardId, board: { is: { userId: user.id } } }, select: { id: true } });
      const destination = await tx.column.findFirst({ where: { id: parsed.data.destinationColumnId, boardId: parsed.data.boardId, board: { is: { userId: user.id } } }, select: { id: true } });
      if (!source || !destination) throw new Error("COLUMN_NOT_FOUND");
      const sourceTasks = await tx.task.findMany({ where: { columnId: source.id }, orderBy: { order: "asc" }, select: { id: true } });
      const movingIndex = sourceTasks.findIndex((item) => item.id === task.id);
      const [moving] = sourceTasks.splice(movingIndex, 1);

      if (source.id === destination.id) {
        sourceTasks.splice(Math.min(parsed.data.index, sourceTasks.length), 0, moving);
        await Promise.all(sourceTasks.map((item, order) => tx.task.update({ where: { id: item.id }, data: { order } })));
        return;
      }

      const destinationTasks = await tx.task.findMany({ where: { columnId: destination.id }, orderBy: { order: "asc" }, select: { id: true } });
      destinationTasks.splice(Math.min(parsed.data.index, destinationTasks.length), 0, moving);
      await Promise.all([
        ...sourceTasks.map((item, order) => tx.task.update({ where: { id: item.id }, data: { order } })),
        ...destinationTasks.map((item, order) => tx.task.update({ where: { id: item.id }, data: { columnId: destination.id, order } })),
      ]);
    });
    refresh();
    return { ok: true, data: null };
  } catch (error) {
    if (error instanceof Error && error.message === "TASK_NOT_FOUND") return failed("Task not found.");
    if (error instanceof Error && error.message === "COLUMN_NOT_FOUND") return failed("Destination column not found.");
    console.error("moveTask failed", error);
    return failed("Could not move the task.");
  }
}
