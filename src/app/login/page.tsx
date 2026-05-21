"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clubName, setClubName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url = mode === "signin" ? "/api/auth/login" : "/api/auth/signup";
    const body = mode === "signin"
      ? { email, password }
      : { email, password, clubName, managerName };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-3xl font-bold text-white">Career Mode</h1>
          <p className="text-gray-400 mt-1 text-sm">Your deep work. Your legacy.</p>
        </div>

        <div className="flex bg-[#13161f] rounded-xl p-1 mb-6">
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === m ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {m === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#13161f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
              className="w-full bg-[#13161f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Club name</label>
                <input
                  type="text" value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="e.g. Deep Work FC"
                  className="w-full bg-[#13161f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Your name</label>
                <input
                  type="text" value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="Manager name"
                  className="w-full bg-[#13161f] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors mt-2"
          >
            {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Create Account & Start Playing"}
          </button>
        </form>
      </div>
    </div>
  );
}
