import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DIVISION_NAMES } from "@/lib/game-logic";

const AI_CLUBS = [
  { name: "Past Self FC", emoji: "👤" },
  { name: "Procrastination United", emoji: "😴" },
  { name: "Focus City", emoji: "🧠" },
  { name: "Burnout Athletic", emoji: "🔥" },
  { name: "Consistency Rovers", emoji: "📅" },
];

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export default async function LeaguePage() {
  const userId = await getSession();
  if (!userId) redirect("/login");

  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [user, currentSeason, history] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.season.findFirst({ where: { userId, startDate: { gte: seasonStart } } }),
    prisma.season.findMany({
      where: { userId },
      orderBy: { seasonNumber: "desc" },
      take: 8,
    }),
  ]);

  const division = user?.division ?? 5;
  const divisionName = DIVISION_NAMES[division] ?? "Sunday League";

  // Generate AI club standings seeded by month
  const monthSeed = now.getFullYear() * 100 + now.getMonth();
  const rand = seedRandom(monthSeed);

  const aiStandings = AI_CLUBS.map((club) => {
    const played = Math.floor(rand() * 12) + 4;
    const wins = Math.floor(rand() * played * 0.7);
    const draws = Math.floor(rand() * (played - wins) * 0.5);
    const losses = played - wins - draws;
    return { ...club, played, wins, draws, losses, points: wins * 3 + draws };
  });

  const userStats = currentSeason
    ? {
        played: currentSeason.wins + currentSeason.draws + currentSeason.losses,
        wins: currentSeason.wins,
        draws: currentSeason.draws,
        losses: currentSeason.losses,
        points: currentSeason.points,
        isUser: true,
        name: user?.clubName ?? "My Club",
        emoji: "🏠",
      }
    : { played: 0, wins: 0, draws: 0, losses: 0, points: 0, isUser: true, name: user?.clubName ?? "My Club", emoji: "🏠" };

  const allStandings = [
    userStats,
    ...aiStandings.map((c) => ({ ...c, isUser: false })),
  ].sort((a, b) => b.points - a.points || b.wins - a.wins);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">League</h1>
        <p className="text-blue-400 text-sm mt-0.5">{divisionName} · Season {user?.totalSeasons ? user.totalSeasons + 1 : 1}</p>
      </div>

      {/* Standings table */}
      <div className="bg-[#13161f] border border-gray-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_3rem] gap-x-2 px-4 py-2 text-xs text-gray-500 font-medium uppercase border-b border-gray-800">
          <span>#</span>
          <span>Club</span>
          <span className="text-center">P</span>
          <span className="text-center">W</span>
          <span className="text-center">D</span>
          <span className="text-center">L</span>
          <span className="text-center">Pts</span>
        </div>
        {allStandings.map((club, i) => (
          <div
            key={club.name}
            className={`grid grid-cols-[2rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem_3rem] gap-x-2 px-4 py-3 items-center text-sm border-b border-gray-800/50 last:border-0 ${
              club.isUser ? "bg-blue-900/10" : ""
            }`}
          >
            <span className={`font-bold ${i === 0 ? "text-yellow-400" : i <= 1 ? "text-green-400" : "text-gray-500"}`}>
              {i + 1}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <span>{club.emoji}</span>
              <span className={`truncate font-medium ${club.isUser ? "text-white" : "text-gray-300"}`}>
                {club.name}
                {club.isUser && <span className="ml-1 text-xs text-blue-400">(You)</span>}
              </span>
            </div>
            <span className="text-center text-gray-400">{club.played}</span>
            <span className="text-center text-green-400">{club.wins}</span>
            <span className="text-center text-yellow-400">{club.draws}</span>
            <span className="text-center text-red-400">{club.losses}</span>
            <span className={`text-center font-bold ${club.isUser ? "text-white" : "text-gray-300"}`}>
              {club.points}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Promotion zone</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Relegation zone</span>
      </div>

      {/* Season history */}
      {history.length > 0 && (
        <div className="bg-[#13161f] border border-gray-800 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Season History</h2>
          <div className="space-y-3">
            {history.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-white font-medium">Season {s.seasonNumber}</span>
                  <span className="text-gray-500 ml-2">{DIVISION_NAMES[s.division] ?? "—"}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <span>{s.wins}W {s.draws}D {s.losses}L</span>
                  <span className="font-bold text-white">{s.points} pts</span>
                  {s.promoted !== null && (
                    <span className={s.promoted ? "text-green-400" : "text-red-400"}>
                      {s.promoted ? "↑ Promoted" : "↓ Relegated"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
