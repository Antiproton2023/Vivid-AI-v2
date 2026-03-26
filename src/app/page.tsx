"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabaseService";
import Link from "next/link";
import { PlusCircle, Projector, Loader2, Sparkles, Binary, Zap } from "lucide-react";
import LandingPage from "@/components/LandingPage";
import { generateRandomIdeas } from "@/services/groqService";

export default function Home() {
  const [user, setUser] = useState<any | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [randomIdeas, setRandomIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ideasLoading, setIdeasLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        setIdeasLoading(true);
        const [projectsResult, ideasResult] = await Promise.all([
          supabase.from("projects").select("*").order("created_at", { ascending: false }),
          generateRandomIdeas()
        ]);

        if (!projectsResult.error && projectsResult.data) {
          setProjects(projectsResult.data);
        }
        setRandomIdeas(ideasResult);
        setIdeasLoading(false);
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session?.user) {
        setProjects([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  // Unauthenticated → show landing page
  if (!user) {
    return <LandingPage />;
  }

  // Authenticated → show dashboard
  return (
    <div className="flex-1 flex flex-col lg:flex-row p-6 md:p-8 max-w-[1600px] mx-auto w-full gap-8 animate-fade-in-up opacity-0" style={{ animationFillMode: "forwards" }}>
      {/* Main Content Area */}
      <div className="flex-1">
        <div className="mb-8">
          <span className="text-sm font-bold tracking-[0.2em] text-blue-500/80 uppercase mb-2 block animate-fade-in">
            Platform Dashboard
          </span>
          <h2 className="text-5xl font-black text-gradient-blue tracking-tighter animate-fade-in-up">
            Vivid AI
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-6 pt-6 border-t border-gray-900">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic">
            Your Projects
          </h1>
          <Link
            href="/project/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <PlusCircle size={20} />
            Generate New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-24 border border-gray-800 border-dashed rounded-2xl bg-gray-900/30">
            <Projector size={48} className="mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-medium text-gray-300">No projects yet</h2>
            <p className="text-gray-500 mt-2 max-w-md mx-auto px-4">
              Transform your raw ideas into structured systems. Get started by generating a new project.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="animate-fade-in-up opacity-0 bg-gray-900/60 border border-gray-800 hover:border-blue-500/40 rounded-2xl p-6 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-600/5"
              >
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition line-clamp-1">
                  {project.name}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-3 h-[60px]">
                  {project.overview || "No overview available."}
                </p>
                <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500 flex justify-between">
                  <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                  <span className="text-blue-500 opacity-0 group-hover:opacity-100 transition">View Details →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar: Architectural Sparks / Jump Start Section */}
      <div className="w-full lg:w-[350px] shrink-0">
        <div className="glass rounded-3xl p-8 sticky top-24 border border-blue-500/10 shadow-2xl overflow-hidden group">
          <div className="absolute top-0 right-0 -m-4 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full" />
          
          <div className="flex items-center gap-2 mb-8 relative z-10">
            <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
              <Zap size={18} fill="currentColor" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Jump Start Section</h2>
          </div>

          <div className="space-y-5 relative z-10">
            {ideasLoading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 bg-gray-800/40 animate-pulse rounded-xl border border-gray-800" />
              ))
            ) : randomIdeas.length > 0 ? (
              randomIdeas.map((idea, idx) => (
                <Link
                  key={idx}
                  href={`/project/new?seed=${encodeURIComponent(idea.title + ": " + idea.description)}`}
                  className="block group/item bg-gray-900/40 hover:bg-blue-600/10 border border-gray-800 hover:border-blue-500/30 rounded-xl p-4 transition-all duration-300 hover:translate-x-1"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-gray-200 group-hover/item:text-blue-400 transition line-clamp-1">{idea.title}</span>
                    <Sparkles size={12} className="text-blue-500 opacity-0 group-hover/item:opacity-100 transition" />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                    {idea.description}
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-sm italic">Failed to fetch ideas. Refresh to retry.</p>
            )}
          </div>

          <div className="mt-8 p-4 bg-gray-950/50 rounded-xl border border-gray-800/50">
            <div className="flex gap-3 items-center">
              <Binary size={16} className="text-gray-600" />
              <p className="text-[10px] text-gray-600 leading-tight">
                AI creates these unique system blueprints on every refresh. Click any to start your architecture journey.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

