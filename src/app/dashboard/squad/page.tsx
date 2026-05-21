"use client";

import { useEffect, useState } from "react";
import { MORALE_COLORS, type Morale } from "@/lib/game-logic";

type Skill = {
  id: string;
  name: string;
  emoji: string;
  ovr: number;
  pace: number;
  stamina: number;
  vision: number;
  composure: number;
  technique: number;
  morale: string;
  form: string;
  totalSessions: number;
  totalWins: number;
};

const EMOJIS = ["⚽", "💻", "✍️", "🎨", "📚", "🎵", "🏋️", "🧪", "📊", "🗣️", "🧠", "🔧"];

export default function SquadPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("⚽");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Skill | null>(null);

  useEffect(() => {
    fetch("/api/skills")
      .then((r) => r.json())
      .then((data) => { setSkills(data); setLoading(false); });
  }, []);

  async function addSkill(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), emoji: newEmoji }),
    });
    const skill = await res.json();
    setSkills((prev) => [skill, ...prev]);
    setNewName("");
    setNewEmoji("⚽");
    setShowAdd(false);
    setSaving(false);
  }

  if (loading) return <div className="text-gray-400 text-center py-20">Loading squad...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Squad</h1>
          <p className="text-gray-400 text-sm mt-0.5">{skills.length} player{skills.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Skill
        </button>
      </div>

      {showAdd && (
        <div className="bg-[#13161f] border border-gray-700 rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">New Player</h2>
          <form onSubmit={addSkill} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">Skill name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Coding, Writing, Design"
                className="w-full bg-[#0d0f14] border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Icon</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setNewEmoji(e)}
                    className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-colors ${
                      newEmoji === e ? "bg-blue-600" : "bg-[#0d0f14] hover:bg-gray-800"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !newName.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {saving ? "Signing..." : "Sign Player"}
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {skills.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-4xl mb-3">👥</p>
          <p>Your squad is empty. Add your first skill to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {skills.map((skill) => {
            const form: string[] = JSON.parse(skill.form);
            const isSelected = selected?.id === skill.id;
            return (
              <div
                key={skill.id}
                className={`bg-[#13161f] border rounded-2xl p-4 cursor-pointer transition-colors ${
                  isSelected ? "border-blue-500" : "border-gray-800 hover:border-gray-700"
                }`}
                onClick={() => setSelected(isSelected ? null : skill)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#0d0f14] rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {skill.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold">{skill.name}</p>
                      <span className={`text-xs ${MORALE_COLORS[skill.morale as Morale]}`}>
                        {skill.morale.charAt(0).toUpperCase() + skill.morale.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-0.5">
                        {form.slice(-5).map((r, i) => (
                          <span
                            key={i}
                            className={`w-5 h-5 rounded text-xs flex items-center justify-center font-bold ${
                              r === "W" ? "bg-green-600" : r === "D" ? "bg-yellow-600" : "bg-red-700"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                        {form.length === 0 && <span className="text-gray-600 text-xs">No matches yet</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-3xl font-black text-white">{skill.ovr}</p>
                    <p className="text-gray-500 text-xs">OVR</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-5 gap-3 text-center">
                    {[
                      { label: "PAC", value: skill.pace },
                      { label: "STA", value: skill.stamina },
                      { label: "VIS", value: skill.vision },
                      { label: "COM", value: skill.composure },
                      { label: "TEC", value: skill.technique },
                    ].map((attr) => (
                      <div key={attr.label}>
                        <p className={`text-lg font-bold ${attr.value >= 75 ? "text-green-400" : attr.value >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                          {attr.value}
                        </p>
                        <p className="text-gray-500 text-xs">{attr.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
