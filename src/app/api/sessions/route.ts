import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateResult,
  calculateOvrChange,
  calculateXpEarned,
  calculateBudgetEarned,
  updateForm,
  calculateMorale,
  clampOvr,
} from "@/lib/game-logic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.session.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { skill: { select: { name: true, emoji: true } } },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const authSession = await auth();
  if (!authSession?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { skillId, duration, goal, goalHit, focusScore } = await req.json();

  const skill = await prisma.skill.findFirst({
    where: { id: skillId, userId: authSession.user.id },
  });
  if (!skill) return NextResponse.json({ error: "Skill not found" }, { status: 404 });

  const result = calculateResult(focusScore, goalHit);
  const ovrChange = calculateOvrChange(result);
  const newOvr = clampOvr(skill.ovr + ovrChange);
  const xpEarned = calculateXpEarned(result, focusScore);
  const budgetEarned = calculateBudgetEarned(result);
  const newForm = updateForm(skill.form, result);
  const newMorale = calculateMorale(newForm);

  const [gameSession] = await prisma.$transaction([
    prisma.session.create({
      data: {
        userId: authSession.user.id,
        skillId,
        duration,
        goal,
        goalHit,
        focusScore,
        result,
        ovrBefore: skill.ovr,
        ovrAfter: newOvr,
        xpEarned,
        budgetEarned,
      },
    }),
    prisma.skill.update({
      where: { id: skillId },
      data: {
        ovr: newOvr,
        xp: skill.xp + xpEarned,
        form: newForm,
        morale: newMorale,
        totalSessions: skill.totalSessions + 1,
        totalWins: result === "win" ? skill.totalWins + 1 : skill.totalWins,
      },
    }),
    prisma.user.update({
      where: { id: authSession.user.id },
      data: { transferBudget: { increment: budgetEarned } },
    }),
  ]);

  // Update current season
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), now.getMonth(), 1);
  let currentSeason = await prisma.season.findFirst({
    where: { userId: authSession.user.id, startDate: { gte: seasonStart } },
  });
  if (!currentSeason) {
    const user = await prisma.user.findUnique({ where: { id: authSession.user.id } });
    currentSeason = await prisma.season.create({
      data: {
        userId: authSession.user.id,
        seasonNumber: (user?.totalSeasons ?? 0) + 1,
        division: user?.division ?? 5,
      },
    });
  }
  await prisma.season.update({
    where: { id: currentSeason.id },
    data: {
      wins: result === "win" ? { increment: 1 } : undefined,
      draws: result === "draw" ? { increment: 1 } : undefined,
      losses: result === "loss" ? { increment: 1 } : undefined,
      points: {
        increment: result === "win" ? 3 : result === "draw" ? 1 : 0,
      },
      budgetEarned: { increment: budgetEarned },
    },
  });

  return NextResponse.json({ session: gameSession, result, ovrChange, xpEarned, budgetEarned });
}
