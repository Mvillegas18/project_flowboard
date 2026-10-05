import { z } from "zod";

const id = z.string().trim().min(1).max(64);
const title = z.string().trim().min(1, "A title is required.").max(100);
const description = z.string().trim().max(2000).nullable().optional();
const tags = z.array(z.string().trim().min(1).max(32)).max(12).default([]);

export const createBoardSchema = z.object({ title });
export const updateBoardTitleSchema = z.object({ boardId: id, title });
export const deleteBoardSchema = z.object({ boardId: id });
export const createColumnSchema = z.object({ boardId: id, title });
export const updateColumnTitleSchema = z.object({ boardId: id, columnId: id, title });
export const deleteColumnSchema = z.object({ boardId: id, columnId: id });
export const createTaskSchema = z.object({ boardId: id, columnId: id, title, description, tags, priority: z.enum(["Urgent", "High", "Medium", "Low"]).nullable().optional() });
export const updateTaskSchema = z.object({ boardId: id, taskId: id, title, description, tags, priority: z.enum(["Urgent", "High", "Medium", "Low"]).nullable().optional() });
export const deleteTaskSchema = z.object({ boardId: id, taskId: id });
export const moveTaskSchema = z.object({ boardId: id, taskId: id, destinationColumnId: id, index: z.number().int().min(0).max(100_000) });

