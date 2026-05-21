import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const current = await prisma.season.findFirst({
    where: { userId, startDate: { gte: seasonStart } },
  });
  const history = await prisma.season.findMany({
    where: { userId },
    orderBy: { seasonNumber: "desc" },
    take: 10,
  });

  return NextResponse.json({ current, history });
}
