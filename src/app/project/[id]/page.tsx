"use client";

import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/services/supabaseService";
import { generateFinalDocuments } from "@/services/groqService";
import Mermaid from "@/components/Mermaid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DownloadCloud, FileText, LayoutDashboard, Copy, Check, ArrowLeft, Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FinalProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [projectData, setProjectData] = useState<any>(null);
  const [docs, setDocs] = useState<{prompts: string, rules: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(false);
  const [copiedP, setCopiedP] = useState(false);
  const [copiedR, setCopiedR] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasInited = useRef(false);

  const [activeTab, setActiveTab] = useState<"diagrams" | "overview" | "code">("diagrams");

  useEffect(() => {
    if (hasInited.current) return;
    hasInited.current = true;

    const init = async () => {
      const { data: latestVersion, error: vError } = await supabase
        .from("project_versions")
        .select("*")
        .eq("project_id", unwrappedParams.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (latestVersion) {
        setProjectData(latestVersion.data);

        if (latestVersion.prompts && latestVersion.rules) {
          setDocs({ prompts: latestVersion.prompts, rules: latestVersion.rules });
        } else {
          setDocsLoading(true);
          try {
            const finalDocs = await generateFinalDocuments(latestVersion.data);
            setDocs(finalDocs);

            await supabase
              .from("project_versions")
              .update({ prompts: finalDocs.prompts, rules: finalDocs.rules })
              .eq("id", latestVersion.id);
          } catch(err) {
            console.error(err);
          } finally {
            setDocsLoading(false);
          }
        }
      }
      setLoading(false);
    };
    init();
  }, [unwrappedParams.id]);

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", unwrappedParams.id);

      if (error) throw error;
      router.push("/");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete project. Please try again.");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 size={32} className="text-blue-500 animate-spin" />
        <p className="text-sm">Loading finalized project...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col h-[calc(100vh-4rem)] animate-fade-in opacity-0" style={{ animationFillMode: "forwards" }}>
      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="glass p-8 rounded-3xl max-w-md w-full border border-red-500/20 shadow-2xl animate-fade-in-up">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 mx-auto">
              <Trash2 size={32} />
            </div>
            <h2 className="text-2xl font-bold text-center text-white mb-2">Delete Project?</h2>
            <p className="text-gray-400 text-center mb-8 leading-relaxed">
              This action is permanent. All system diagrams, version history, and architectural documentation will be lost forever.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-gray-800/60 pb-4 mb-6 shrink-0 gap-4">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto custom-scrollbar no-scrollbar">
          {[
            { key: "diagrams" as const, icon: LayoutDashboard, label: "Diagrams" },
            { key: "overview" as const, icon: FileText, label: "Overview" },
            { key: "code" as const, icon: DownloadCloud, label: "Agent Docs" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition shrink-0 ${
                activeTab === tab.key
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/40"
                  : "bg-gray-900/60 border border-gray-800/60 text-gray-400 hover:text-white hover:border-gray-700"
              }`}
            >
              <tab.icon size={16} />{tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center gap-2 bg-red-950/20 hover:bg-red-900/40 text-red-400 px-4 py-2.5 rounded-lg font-medium text-sm transition border border-red-900/30 group"
            title="Delete Project"
          >
            <Trash2 size={16} className="group-hover:scale-110 transition" />
            <span className="hidden sm:inline">Delete</span>
          </button>
          <button
            onClick={() => router.push(`/project/${unwrappedParams.id}/review`)}
            className="flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-lg font-medium text-sm transition border border-gray-700/50 grayscale hover:grayscale-0 shadow-lg"
          >
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Back</span>
          </button>
        </div>
      </div>


      {/* Content */}
      <div className="flex-1 bg-gray-950/50 border border-gray-800/60 rounded-2xl overflow-hidden relative flex flex-col">
        {activeTab === "diagrams" && (
          <div className="p-8 overflow-y-auto w-full space-y-12 pb-24 custom-scrollbar">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-200 to-gray-500 bg-clip-text text-transparent">Final System Diagrams</h2>

            {[
              { title: "Workflow Architecture", field: "workflow_flowchart" },
              { title: "Technical Stack Pipeline", field: "tech_stack_flowchart" },
              { title: "Implementation Sequence", field: "steps_flowchart" },
            ].map((chart) => (
              <div key={chart.field} className="space-y-3">
                <h3 className="font-bold text-gray-400 uppercase tracking-widest text-xs">{chart.title}</h3>
                <div className="glass p-6 rounded-2xl shadow-xl flex justify-center overflow-x-auto">
                  {projectData?.[chart.field]
                    ? <Mermaid chart={projectData[chart.field]} />
                    : <p className="text-gray-500 py-12">Not available.</p>
                  }
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "overview" && (
          <div className="p-8 overflow-y-auto space-y-8 max-w-4xl mx-auto w-full custom-scrollbar">
            <div>
              <h3 className="text-sm uppercase tracking-wider text-blue-500 mb-3 font-bold">Executive Summary</h3>
              <div className="prose prose-lg prose-invert max-w-none text-gray-300 prose-p:leading-relaxed prose-headings:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{projectData?.overview || ""}</ReactMarkdown>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="glass p-6 rounded-xl">
                <h4 className="font-bold text-white mb-4 border-b border-gray-700/50 pb-2">Core Features</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
                  {projectData?.features?.map((f: string, i: number) => <li key={i}>{f}</li>)}
                </ul>
              </div>
              <div className="glass p-6 rounded-xl">
                <h4 className="font-bold text-white mb-4 border-b border-gray-700/50 pb-2">Tech Stack</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
                  {projectData?.tech_stack?.map((t: string, i: number) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            </div>

            {projectData?.risks && projectData.risks.length > 0 && (
              <div className="glass p-6 rounded-xl">
                <h4 className="font-bold text-white mb-4 border-b border-gray-700/50 pb-2">Risks & Mitigations</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
                  {projectData.risks.map((r: string, i: number) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}

            {projectData?.improvements && projectData.improvements.length > 0 && (
              <div className="glass p-6 rounded-xl">
                <h4 className="font-bold text-white mb-4 border-b border-gray-700/50 pb-2">Future Improvements</h4>
                <ul className="list-disc pl-5 space-y-2 text-gray-300 text-sm">
                  {projectData.improvements.map((imp: string, i: number) => <li key={i}>{imp}</li>)}
                </ul>
              </div>
            )}

            {projectData?.steps && projectData.steps.length > 0 && (
              <div className="glass p-6 rounded-xl">
                <h4 className="font-bold text-white mb-4 border-b border-gray-700/50 pb-2">Build Steps</h4>
                <ol className="list-decimal pl-5 space-y-2 text-gray-300 text-sm">
                  {projectData.steps.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            )}
          </div>
        )}

        {activeTab === "code" && (
          <div className="flex flex-col h-full">
            {docsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <Loader2 size={40} className="text-blue-500 animate-spin" />
                <p className="text-gray-400">Compiling agent documents...</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-800/60 h-full overflow-hidden">
                {/* Prompts pane */}
                <div className="flex-1 flex flex-col h-full p-6 w-full doc-pane">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <h3 className="font-bold text-lg text-white font-mono flex items-center gap-2">
                      <FileText size={16} className="text-green-400" />
                      prompts.txt
                    </h3>
                    <button
                      onClick={() => copyToClipboard(docs?.prompts || "", setCopiedP)}
                      className="flex items-center gap-2 glass hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg transition text-sm"
                    >
                      {copiedP ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      {copiedP ? "Copied!" : "Copy (Ctrl+C)"}
                    </button>
                  </div>
                  <div className="flex-1 bg-gray-950 border border-gray-800/60 rounded-xl p-6 overflow-auto custom-scrollbar">
                    <div className="prose prose-sm prose-invert max-w-none prose-p:text-green-400/80 prose-headings:text-green-300 prose-li:text-green-400/80 prose-strong:text-green-300 prose-code:text-green-300 font-mono text-sm leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {docs?.prompts?.replace(/\\\\n|\\n/g, '\n') || "No prompts generated."}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>

                {/* Rules pane */}
                <div className="flex-1 flex flex-col h-full p-6 w-full doc-pane">
                  <div className="flex items-center justify-between mb-4 shrink-0">
                    <h3 className="font-bold text-lg text-white font-mono flex items-center gap-2">
                      <FileText size={16} className="text-blue-400" />
                      rules.md
                    </h3>
                    <button
                      onClick={() => copyToClipboard(docs?.rules || "", setCopiedR)}
                      className="flex items-center gap-2 glass hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg transition text-sm"
                    >
                      {copiedR ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      {copiedR ? "Copied!" : "Copy (Ctrl+C)"}
                    </button>
                  </div>
                  <div className="flex-1 bg-gray-950 border border-gray-800/60 rounded-xl p-6 overflow-auto custom-scrollbar">
                    <div className="prose prose-sm prose-invert max-w-none prose-headings:text-blue-300 prose-strong:text-blue-300 prose-code:text-blue-300 font-mono text-sm leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {docs?.rules?.replace(/\\\\n|\\n/g, '\n') || "No rules generated."}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
