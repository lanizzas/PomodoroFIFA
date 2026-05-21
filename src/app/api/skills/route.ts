import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const skills = await prisma.skill.findMany({ where: { userId }, orderBy: { ovr: "desc" } });
  return NextResponse.json(skills);
}

export async function POST(req: Request) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, emoji } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const skill = await prisma.skill.create({
    data: { userId, name: name.trim(), emoji: emoji ?? "⚽" },
  });
  return NextResponse.json(skill);
}
