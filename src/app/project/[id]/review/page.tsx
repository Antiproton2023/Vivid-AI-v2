"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/services/supabaseService";
import { useProjectStore } from "@/store/projectStore";
import { analyzeProject, modifyProject, generateFinalDocuments } from "@/services/groqService";
import { useRouter } from "next/navigation";
import Mermaid from "@/components/Mermaid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"diagrams" | "analysis" | "builder">("diagrams");
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<"risk" | "architect" | "investor">("risk");
  const { projectData, setProjectData } = useProjectStore();
  const [loading, setLoading] = useState(true);
  
  // Analysis States
  const [riskAnalysis, setRiskAnalysis] = useState("");
  const [archAnalysis, setArchAnalysis] = useState("");
  const [investorAnalysis, setInvestorAnalysis] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analyzedOverview, setAnalyzedOverview] = useState("");

  // Builder States
  const [builderInput, setBuilderInput] = useState("");
  const [builderLoading, setBuilderLoading] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      const { data: latestVersion } = await supabase
        .from("project_versions")
        .select("*")
        .eq("project_id", unwrappedParams.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (latestVersion) {
        setProjectData(latestVersion.data);
      }
      setLoading(false);
    };
    fetchProject();
  }, [unwrappedParams.id, setProjectData]);

  const loadAnalysis = async () => {
    if (!projectData?.overview || projectData.overview === analyzedOverview) return;
    setAnalysisLoading(true);
    try {
      const [risk, arch, inv] = await Promise.all([
        analyzeProject(projectData.overview, "risk"),
        analyzeProject(projectData.overview, "architect"),
        analyzeProject(projectData.overview, "investor")
      ]);
      setRiskAnalysis(risk);
      setArchAnalysis(arch);
      setInvestorAnalysis(inv);
      setAnalyzedOverview(projectData.overview);
    } catch(err) {
      console.error(err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "analysis") loadAnalysis();
  }, [activeTab]);

  const handleBuilderModify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderInput.trim() || builderLoading || !projectData) return;
    setBuilderLoading(true);
    try {
      const newStructure = await modifyProject(projectData, builderInput, { riskAnalysis, archAnalysis, investorAnalysis });
      setProjectData(newStructure);
      
      await supabase.from("project_versions").insert({
        project_id: unwrappedParams.id,
        data: newStructure
      });
      
      setBuilderInput("");
      alert("Project updated successfully! Check Diagrams tab.");
    } catch(err) {
      console.error(err);
      alert("Failed to modify project.");
    } finally {
      setBuilderLoading(false);
    }
  };

  const proceedToFinal = async () => {
    router.push(`/project/${unwrappedParams.id}`);
  };

  if (loading || !projectData) {
    return <div className="p-8 text-center text-gray-500">Loading initial project state...</div>;
  }

  return (
    <div className="flex-1 flex flex-col p-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
        <div className="flex gap-4">
          <button onClick={() => setActiveTab("diagrams")} className={`px-4 py-2 font-medium rounded-md transition ${activeTab === 'diagrams' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Diagrams</button>
          <button onClick={() => setActiveTab("analysis")} className={`px-4 py-2 font-medium rounded-md transition ${activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Deep Analysis</button>
          <button onClick={() => setActiveTab("builder")} className={`px-4 py-2 font-medium rounded-md transition ${activeTab === 'builder' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>Builder Mode</button>
        </div>
        <button onClick={proceedToFinal} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-bold transition">
          Proceed to Finalization →
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
        {activeTab === "diagrams" && (
          <div className="space-y-12 pb-12">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">Workflow Architecture</h2>
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl overflow-x-auto min-h-[300px]">
                {projectData.workflow_flowchart ? <Mermaid chart={projectData.workflow_flowchart} /> : <p className="text-gray-500">No chart generated.</p>}
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">Tech Stack Diagram</h2>
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl overflow-x-auto min-h-[300px]">
                {projectData.tech_stack_flowchart ? <Mermaid chart={projectData.tech_stack_flowchart} /> : <p className="text-gray-500">No chart generated.</p>}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">Sequential Steps</h2>
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl overflow-x-auto min-h-[300px]">
                {projectData.steps_flowchart ? <Mermaid chart={projectData.steps_flowchart} /> : <p className="text-gray-500">No chart generated.</p>}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">Project Overview</h2>
              <div className="bg-gray-900 border border-gray-800 p-10 md:p-14 rounded-xl min-h-[150px] text-gray-200 font-light prose prose-lg prose-invert max-w-none prose-p:leading-loose prose-p:mb-8 prose-li:mb-3 prose-headings:mt-12 prose-headings:mb-6">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {projectData.overview}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="space-y-8 pb-12">

            {analysisLoading ? <p className="text-gray-400 animate-pulse">Running advanced AI analysis...</p> : (
              <div className="flex flex-col h-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                <div className="flex border-b border-gray-800 shrink-0">
                  <button 
                    onClick={() => setActiveAnalysisTab('risk')}
                    className={`flex-1 py-4 font-bold transition ${activeAnalysisTab === 'risk' ? 'text-red-400 border-b-2 border-red-500 bg-red-900/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                  >
                    Risk Analyst (Critic)
                  </button>
                  <button 
                    onClick={() => setActiveAnalysisTab('architect')}
                    className={`flex-1 py-4 font-bold transition ${activeAnalysisTab === 'architect' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-900/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                  >
                    System Architect
                  </button>
                  <button 
                    onClick={() => setActiveAnalysisTab('investor')}
                    className={`flex-1 py-4 font-bold transition ${activeAnalysisTab === 'investor' ? 'text-green-400 border-b-2 border-green-500 bg-green-900/10' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                  >
                    Investor Perspective
                  </button>
                </div>

                <div className="p-10 md:p-14 overflow-y-auto prose prose-lg prose-invert max-w-none text-gray-200 prose-p:leading-loose prose-p:mb-8 prose-li:mb-3 prose-headings:mt-12 prose-headings:mb-6">
                  {activeAnalysisTab === 'risk' && (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{riskAnalysis}</ReactMarkdown>
                  )}
                  {activeAnalysisTab === 'architect' && (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{archAnalysis}</ReactMarkdown>
                  )}
                  {activeAnalysisTab === 'investor' && (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{investorAnalysis}</ReactMarkdown>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "builder" && (
          <div className="flex flex-col h-[600px] border border-gray-800 bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
              <h2 className="font-bold text-gray-200">Builder Mode Copilot</h2>
              <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">Live Syncing DB</span>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-4">
              <p className="text-gray-400 text-center max-w-md">
                Chat with Groq to dynamically update your architecture. Any changes will immediately regenerate your flowcharts and overall data structure as a new historic version in Supabase.
              </p>
              
              <div className="w-full max-w-2xl bg-black border border-gray-700 rounded-lg p-6 max-h-64 overflow-y-auto mb-4 font-mono text-sm text-gray-300">
                <h4 className="text-gray-500 mb-2">// Current State Readout</h4>
                {projectData.overview}
              </div>

              <form onSubmit={handleBuilderModify} className="w-full max-w-2xl flex gap-3">
                <input 
                  type="text"
                  placeholder="E.g., Swap PostgreSQL to MongoDB and add a Redis cache layer"
                  value={builderInput}
                  onChange={(e) => setBuilderInput(e.target.value)}
                  disabled={builderLoading}
                  className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono text-sm"
                />
                <button 
                  type="submit" 
                  disabled={builderLoading || !builderInput.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 font-medium rounded-lg transition"
                >
                  {builderLoading ? "Modifying..." : "Apply Edit"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
