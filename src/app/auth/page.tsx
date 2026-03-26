"use client";

import { useState } from "react";
import { supabase } from "@/services/supabaseService";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const authAction = isLogin
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { data, error } = await authAction;

    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none animate-pulse-glow" />

      <div className="relative z-10 glass p-10 rounded-3xl shadow-2xl w-full max-w-md animate-fade-in-up opacity-0" style={{ animationFillMode: "forwards" }}>
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex justify-center transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <span className="text-4xl font-black tracking-tighter text-gradient-blue mb-2">
              Vivid AI
            </span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center text-white">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          {isLogin ? "Sign in to access your projects" : "Start building with VividAI"}
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-950/40 border border-red-900/60 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              required
              className="w-full bg-gray-950/80 border border-gray-700/60 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              required
              className="w-full bg-gray-950/80 border border-gray-700/60 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3.5 rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          {isLogin ? "Don\u2019t have an account? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-blue-400 hover:text-blue-300 font-medium transition"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
