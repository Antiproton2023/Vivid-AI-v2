"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Cpu, Layers, FileCode2, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-28 md:py-36 overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 blur-[160px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

        <div className="relative z-10 max-w-3xl mx-auto stagger-children">
          <div className="animate-fade-in-up opacity-0 flex flex-col items-center mb-10">
            <h1 className="text-6xl md:text-8xl font-black text-gradient-blue tracking-tighter mb-4 drop-shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              Vivid AI
            </h1>
            <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-400 text-sm font-medium px-4 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
              <Sparkles size={14} />
              AI-Powered System Architect
            </div>
          </div>

          <h1 className="animate-fade-in-up opacity-0 text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
            Turn{" "}
            <span className="text-gradient-blue">Raw Ideas</span>
            <br />
            Into Blueprint Systems
          </h1>

          <p className="animate-fade-in-up opacity-0 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            VividAI transforms your rough concepts into structured, execution-ready system designs
            — complete with architecture diagrams, risk analysis, and build-ready documentation.
          </p>

          <div className="animate-fade-in-up opacity-0 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth"
              className="group flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-xl shadow-blue-600/25 hover:shadow-blue-500/30"
            >
              Get Started
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-6 py-20 bg-gray-950 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 animate-fade-in opacity-0">
            How It Works
          </h2>
          <p className="text-gray-500 text-center mb-16 max-w-lg mx-auto animate-fade-in opacity-0">
            From a single sentence to a fully architected system in minutes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-children">
            {[
              {
                step: "01",
                title: "Describe Your Idea",
                desc: "Chat with our AI discovery agent. It asks targeted questions to sharpen your concept into something buildable.",
                color: "blue",
              },
              {
                step: "02",
                title: "AI Architects It",
                desc: "Groq-powered AI generates architecture, flowcharts, tech stack, risks & improvements — all as structured output.",
                color: "cyan",
              },
              {
                step: "03",
                title: "Review & Deploy",
                desc: "Get multi-perspective analysis, refine with the Builder copilot, then export build prompts and rules for your dev agent.",
                color: "indigo",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="animate-fade-in-up opacity-0 group glass rounded-2xl p-8 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                <span className={`text-sm font-bold text-${item.color}-400 tracking-widest`}>{item.step}</span>
                <h3 className="text-xl font-bold text-white mt-3 mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Built for <span className="text-gradient-blue">Builders</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 stagger-children">
            {[
              {
                icon: Cpu,
                title: "AI-First Architecture",
                desc: "Groq LLM generates deterministic, structured system blueprints with zero hallucination guardrails.",
              },
              {
                icon: Layers,
                title: "Multi-Perspective Review",
                desc: "Get critical analysis from a Risk Analyst, System Architect, and Investor — before writing a single line of code.",
              },
              {
                icon: FileCode2,
                title: "Agent-Ready Output",
                desc: "Export master build prompts and rules files designed for AI coding agents to autonomously build your system.",
              },
              {
                icon: Shield,
                title: "Version-Controlled",
                desc: "Every change is committed to Supabase. Refresh the page, come back tomorrow — your work is always safe.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="animate-fade-in-up opacity-0 group flex gap-5 glass rounded-2xl p-7 hover:border-blue-500/20 transition-all duration-300"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/20 transition">
                  <feat.icon size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">{feat.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-24 border-t border-gray-800/50 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Build Something?
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            Stop planning in your head. Let VividAI turn your idea into a system.
          </p>
          <Link
            href="/auth"
            className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-xl shadow-blue-600/25"
          >
            Start for Free
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <span className="text-xl font-bold tracking-tighter text-gradient-blue opacity-50 hover:opacity-100 transition-opacity">
              Vivid AI
            </span>
          </Link>
          <p className="text-xs text-gray-600">© {new Date().getFullYear()} VividAI. Built with Groq, Supabase & Next.js.</p>
        </div>
      </footer>
    </div>
  );
}
