import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, password, clubName, managerName } = await req.json();

  if (!email?.trim() || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase().trim(),
      password: hashed,
      clubName: clubName?.trim() || "My Club",
      managerName: managerName?.trim() || "Manager",
    },
  });

  await setSessionCookie(user.id);
  return NextResponse.json({ ok: true });
}
