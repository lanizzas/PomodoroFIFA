import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DIVISION_NAMES, MORALE_COLORS, type Morale } from "@/lib/game-logic";

export default async function DashboardPage() {
  const userId = await getSession();
  if (!userId) redirect("/login");

  const [user, skills, recentSessions] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.skill.findMany({ where: { userId }, orderBy: { ovr: "desc" }, take: 5 }),
    prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { skill: { select: { name: true, emoji: true } } },
    }),
  ]);

  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentSeason = await prisma.season.findFirst({
    where: { userId, startDate: { gte: seasonStart } },
  });

  const divisionName = DIVISION_NAMES[user?.division ?? 5];

  return (
    <div className="space-y-8">
      {/* Club header */}
      <div className="bg-[#13161f] border border-gray-800 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Club</p>
            <h1 className="text-3xl font-bold text-white mt-1">{user?.clubName}</h1>
            <p className="text-gray-400 mt-1">
              {user?.managerName} · <span className="text-blue-400">{divisionName}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Transfer Budget</p>
            <p className="text-2xl font-bold text-green-400">£{user?.transferBudget?.toLocaleString()}</p>
          </div>
        </div>

        {currentSeason && (
          <div className="mt-5 pt-5 border-t border-gray-800 grid grid-cols-4 gap-4 text-center">
            {[
              { label: "Played", value: currentSeason.wins + currentSeason.draws + currentSeason.losses },
              { label: "W", value: currentSeason.wins },
              { label: "D", value: currentSeason.draws },
              { label: "L", value: currentSeason.losses },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick start */}
      <Link
        href="/dashboard/match"
        className="block bg-blue-600 hover:bg-blue-500 transition-colors rounded-2xl p-5 text-center"
      >
        <p className="text-2xl mb-1">⚽</p>
        <p className="text-white font-bold text-lg">Start a Match</p>
        <p className="text-blue-200 text-sm mt-0.5">Begin a new Pomodoro session</p>
      </Link>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Squad snapshot */}
        <div className="bg-[#13161f] border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Squad</h2>
            <Link href="/dashboard/squad" className="text-blue-400 text-sm hover:text-blue-300">
              Manage →
            </Link>
          </div>
          {skills.length === 0 ? (
            <p className="text-gray-500 text-sm">No skills yet. Add players to your squad.</p>
          ) : (
            <div className="space-y-3">
              {skills.map((s) => {
                const form: string[] = JSON.parse(s.form);
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="text-xl">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{s.name}</p>
                      <p className={`text-xs ${MORALE_COLORS[s.morale as Morale]}`}>
                        {s.morale.charAt(0).toUpperCase() + s.morale.slice(1)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {form.slice(-5).map((r, i) => (
                          <span
                            key={i}
                            className={`w-4 h-4 rounded-sm text-xs flex items-center justify-center font-bold ${
                              r === "W"
                                ? "bg-green-600 text-white"
                                : r === "D"
                                ? "bg-yellow-600 text-white"
                                : "bg-red-600 text-white"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                      <span className="text-white font-bold text-sm w-8 text-right">{s.ovr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent matches */}
        <div className="bg-[#13161f] border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Recent Matches</h2>
          {recentSessions.length === 0 ? (
            <p className="text-gray-500 text-sm">No matches played yet.</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <span className="text-lg">{s.skill.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{s.skill.name}</p>
                    <p className="text-gray-500 text-xs truncate">{s.goal}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                        s.result === "win"
                          ? "bg-green-900 text-green-300"
                          : s.result === "draw"
                          ? "bg-yellow-900 text-yellow-300"
                          : "bg-red-900 text-red-300"
                      }`}
                    >
                      {s.result}
                    </span>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {s.ovrAfter > s.ovrBefore ? "+" : ""}{s.ovrAfter - s.ovrBefore} OVR
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
