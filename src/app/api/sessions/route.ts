import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  calculateResult, calculateOvrChange, calculateXpEarned,
  calculateBudgetEarned, updateForm, calculateMorale, clampOvr,
} from "@/lib/game-logic";

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { skill: { select: { name: true, emoji: true } } },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { skillId, duration, goal, goalHit, focusScore } = await req.json();

  const skill = await prisma.skill.findFirst({ where: { id: skillId, userId } });
  if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

  const result = calculateResult(focusScore, goalHit);
  const newOvr = clampOvr(skill.ovr + calculateOvrChange(result));
  const xpEarned = calculateXpEarned(result, focusScore);
  const budgetEarned = calculateBudgetEarned(result);
  const newForm = updateForm(skill.form, result);

  const [gameSession] = await prisma.$transaction([
    prisma.session.create({
      data: { userId, skillId, duration, goal, goalHit, focusScore, result, ovrBefore: skill.ovr, ovrAfter: newOvr, xpEarned, budgetEarned },
    }),
    prisma.skill.update({
      where: { id: skillId },
      data: { ovr: newOvr, xp: skill.xp + xpEarned, form: newForm, morale: calculateMorale(newForm), totalSessions: skill.totalSessions + 1, totalWins: result === "win" ? skill.totalWins + 1 : skill.totalWins },
    }),
    prisma.user.update({ where: { id: userId }, data: { transferBudget: { increment: budgetEarned } } }),
  ]);

  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let currentSeason = await prisma.season.findFirst({ where: { userId, startDate: { gte: seasonStart } } });
  if (!currentSeason) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    currentSeason = await prisma.season.create({
      data: { userId, seasonNumber: (user?.totalSeasons ?? 0) + 1, division: user?.division ?? 5 },
    });
  }
  await prisma.season.update({
    where: { id: currentSeason.id },
    data: {
      wins: result === "win" ? { increment: 1 } : undefined,
      draws: result === "draw" ? { increment: 1 } : undefined,
      losses: result === "loss" ? { increment: 1 } : undefined,
      points: { increment: result === "win" ? 3 : result === "draw" ? 1 : 0 },
      budgetEarned: { increment: budgetEarned },
    },
  });

  return NextResponse.json({ session: gameSession, result, ovrChange: newOvr - skill.ovr, xpEarned, budgetEarned });
}
