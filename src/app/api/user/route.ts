import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clubName, managerName } = await req.json();
  const user = await prisma.user.update({ where: { id: userId }, data: { clubName, managerName } });
  return NextResponse.json(user);
}
