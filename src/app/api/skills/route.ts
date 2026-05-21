import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const skills = await prisma.skill.findMany({
    where: { userId: session.user.id },
    orderBy: { ovr: "desc" },
  });
  return NextResponse.json(skills);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, emoji } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const skill = await prisma.skill.create({
    data: { userId: session.user.id, name: name.trim(), emoji: emoji ?? "⚽" },
  });
  return NextResponse.json(skill);
}
