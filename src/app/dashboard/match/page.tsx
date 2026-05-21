"use client";

import { useEffect, useState, useRef, useCallback } from "react";

type Skill = { id: string; name: string; emoji: string; ovr: number; morale: string };
type Phase = "pre" | "live" | "post";

type PostData = {
  result: string;
  ovrChange: number;
  xpEarned: number;
  budgetEarned: number;
  goal: string;
  skillName: string;
  skillEmoji: string;
  focusScore: number;
  goalHit: boolean;
};

const DURATIONS = [
  { label: "25 min", value: 25 },
  { label: "50 min", value: 50 },
  { label: "90 min", value: 90 },
];

export default function MatchPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [phase, setPhase] = useState<Phase>("pre");

  // Pre-match
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState(25);

  // Live timer
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Post-match
  const [focusScore, setFocusScore] = useState(3);
  const [goalHit, setGoalHit] = useState(true);
  const [postData, setPostData] = useState<PostData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((data) => { setSkills(data); if (data.length > 0) setSelectedSkill(data[0]); });
  }, []);

  const tick = useCallback(() => {
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        setRunning(false);
        return 0;
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, tick]);

  function startMatch() {
    setSecondsLeft(duration * 60);
    setRunning(true);
    setPhase("live");
  }

  function endEarly() {
    setRunning(false);
    setPhase("post");
  }

  function finishTimer() {
    setRunning(false);
    setPhase("post");
  }

  useEffect(() => {
    if (phase === "live" && secondsLeft === 0 && !running) {
      finishTimer();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running, phase]);

  async function submitResult() {
    if (!selectedSkill) return;
    setSubmitting(true);
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        skillId: selectedSkill.id,
        duration,
        goal,
        goalHit,
        focusScore,
      }),
    });
    const data = await res.json();
    setPostData({
      result: data.result,
      ovrChange: data.ovrChange,
      xpEarned: data.xpEarned,
      budgetEarned: data.budgetEarned,
      goal,
      skillName: selectedSkill.name,
      skillEmoji: selectedSkill.emoji,
      focusScore,
      goalHit,
    });
    setSubmitting(false);
  }

  function reset() {
    setPhase("pre");
    setGoal("");
    setFocusScore(3);
    setGoalHit(true);
    setPostData(null);
    setSecondsLeft(0);
  }

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const secs = (secondsLeft % 60).toString().padStart(2, "0");
  const progress = duration > 0 ? ((duration * 60 - secondsLeft) / (duration * 60)) * 100 : 0;

  // PRE-MATCH
  if (phase === "pre") {
    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white">Pre-Match</h1>
          <p className="text-gray-400 text-sm mt-0.5">Set up your session before kick-off</p>
        </div>

        <div className="bg-[#13161f] border border-gray-800 rounded-2xl p-5 space-y-5">
          <div>
            <label className="text-sm text-gray-400 block mb-2">Select skill</label>
            {skills.length === 0 ? (
              <p className="text-gray-500 text-sm">No skills yet — add some in Squad first.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {skills.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSkill(s)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-colors text-left ${
                      selectedSkill?.id === s.id
                        ? "border-blue-500 bg-blue-900/20"
                        : "border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    <span className="text-xl">{s.emoji}</span>
                    <div>
                      <p className="text-white text-sm font-medium">{s.name}</p>
                      <p className="text-gray-500 text-xs">OVR {s.ovr}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1">Session goal</label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What will you accomplish this session?"
              className="w-full bg-[#0d0f14] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Duration</label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    duration === d.value
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={startMatch}
          disabled={!selectedSkill || !goal.trim()}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
        >
          ⚽ Kick Off
        </button>
      </div>
    );
  }

  // LIVE TIMER
  if (phase === "live") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 max-w-sm mx-auto">
        <div className="text-center">
          <p className="text-gray-400 text-sm mb-1">Now playing</p>
          <p className="text-white font-bold text-xl">
            {selectedSkill?.emoji} {selectedSkill?.name}
          </p>
          <p className="text-gray-400 text-sm mt-1 italic">"{goal}"</p>
        </div>

        {/* Circular progress */}
        <div className="relative w-52 h-52">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#1a1d26" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="#2563eb"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl font-black text-white tabular-nums">{mins}:{secs}</p>
            <p className="text-gray-400 text-sm mt-1">{running ? "Focus" : "Paused"}</p>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => setRunning((r) => !r)}
            className="flex-1 bg-[#13161f] border border-gray-700 hover:border-gray-600 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {running ? "⏸ Pause" : "▶ Resume"}
          </button>
          <button
            onClick={endEarly}
            className="flex-1 bg-[#13161f] border border-gray-700 hover:border-red-800 hover:border-red-700 text-gray-400 hover:text-red-400 font-medium py-3 rounded-xl transition-colors"
          >
            End Early
          </button>
        </div>
      </div>
    );
  }

  // POST-MATCH
  if (phase === "post" && !postData) {
    return (
      <div className="max-w-sm mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Full Time</h1>
          <p className="text-gray-400 text-sm mt-0.5">How did the session go?</p>
        </div>

        <div className="bg-[#13161f] border border-gray-800 rounded-2xl p-5 space-y-5">
          <div>
            <p className="text-sm text-gray-400 mb-1">Your goal was:</p>
            <p className="text-white font-medium italic">"{goal}"</p>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Did you hit your goal?</label>
            <div className="flex gap-3">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setGoalHit(v)}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-sm border transition-colors ${
                    goalHit === v
                      ? v
                        ? "bg-green-700 border-green-600 text-white"
                        : "bg-red-700 border-red-600 text-white"
                      : "border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {v ? "✅ Yes" : "❌ No"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Focus score</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setFocusScore(n)}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm border transition-colors ${
                    focusScore >= n
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-700 text-gray-600 hover:border-gray-600"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-1 text-center">
              {focusScore === 1 ? "Couldn't focus" : focusScore === 2 ? "Mostly distracted" : focusScore === 3 ? "Decent" : focusScore === 4 ? "Strong session" : "Peak focus"}
            </p>
          </div>
        </div>

        <button
          onClick={submitResult}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg transition-colors"
        >
          {submitting ? "Processing..." : "Submit Result"}
        </button>
      </div>
    );
  }

  // MATCH REPORT
  if (postData) {
    const resultConfig = {
      win: { label: "Victory", color: "text-green-400", bg: "bg-green-900/20 border-green-700", icon: "🏆" },
      draw: { label: "Draw", color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-700", icon: "🤝" },
      loss: { label: "Defeat", color: "text-red-400", bg: "bg-red-900/20 border-red-700", icon: "💔" },
    }[postData.result] ?? { label: "Draw", color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-700", icon: "🤝" };

    return (
      <div className="max-w-sm mx-auto space-y-5">
        <h1 className="text-2xl font-bold text-white text-center">Match Report</h1>

        <div className={`border rounded-2xl p-6 text-center ${resultConfig.bg}`}>
          <div className="text-5xl mb-2">{resultConfig.icon}</div>
          <p className={`text-3xl font-black ${resultConfig.color}`}>{resultConfig.label}</p>
          <p className="text-gray-300 mt-1">
            {postData.skillEmoji} {postData.skillName}
          </p>
        </div>

        <div className="bg-[#13161f] border border-gray-800 rounded-2xl p-5">
          <p className="text-gray-400 text-sm mb-1">Goal</p>
          <p className="text-white font-medium italic mb-4">"{postData.goal}"</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className={`text-2xl font-black ${postData.ovrChange > 0 ? "text-green-400" : postData.ovrChange < 0 ? "text-red-400" : "text-gray-400"}`}>
                {postData.ovrChange > 0 ? "+" : ""}{postData.ovrChange}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">OVR</p>
            </div>
            <div>
              <p className="text-2xl font-black text-blue-400">+{postData.xpEarned}</p>
              <p className="text-gray-500 text-xs mt-0.5">XP</p>
            </div>
            <div>
              <p className="text-2xl font-black text-green-400">+£{postData.budgetEarned}</p>
              <p className="text-gray-500 text-xs mt-0.5">Budget</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-colors"
          >
            New Match
          </button>
          <a
            href="/dashboard"
            className="flex-1 bg-[#13161f] border border-gray-700 hover:border-gray-600 text-gray-300 font-medium py-3 rounded-xl text-center transition-colors"
          >
            Club Home
          </a>
        </div>
      </div>
    );
  }

  return null;
}
