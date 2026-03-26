"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseService";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="w-full h-16 bg-gray-950/80 backdrop-blur-lg border-b border-gray-800/60 flex items-center justify-between px-6 z-50 sticky top-0">
      <Link 
        href="/" 
        className="flex items-center gap-2 group transition-all"
      >
        <span className="text-2xl font-bold tracking-tighter text-gradient-blue group-hover:opacity-80 transition-opacity">
          Vivid AI
        </span>
      </Link>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-400 hidden sm:inline">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm px-4 py-2 bg-gray-800/80 hover:bg-gray-700 text-gray-200 rounded-lg transition border border-gray-700/50"
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            href="/auth"
            className="text-sm px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition shadow-lg shadow-blue-600/20"
          >
            Login / Sign Up
          </Link>
        )}
      </div>
    </nav>
  );
}
