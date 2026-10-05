import { prisma } from "@/lib/db";

export const MOCK_USER_ID = "flowboard-demo-user";

export async function ensureMockUser() {
  return prisma.user.upsert({
    where: { id: MOCK_USER_ID },
    update: {},
    create: { id: MOCK_USER_ID, email: "demo@flowboard.local", name: "Alex Morgan" },
  });
}
