"use client";

import { useEffect, useRef } from "react";
import { useProjectStore } from "@/store/projectStore";
import { generateProjectStructure } from "@/services/groqService";
import { supabase } from "@/services/supabaseService";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CreateProject() {
  const { currentProjectIdea, setProjectData } = useProjectStore();
  const router = useRouter();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!currentProjectIdea || hasStarted.current) {
      if (!currentProjectIdea) router.push("/");
      return;
    }
    
    hasStarted.current = true;

    const compileAndSave = async () => {
      try {
        const generatedData = await generateProjectStructure(currentProjectIdea);
        setProjectData(generatedData);

        const sessionRes = await supabase.auth.getSession();
        const userId = sessionRes.data.session?.user?.id;
        
        if (!userId) throw new Error("No user found");

        const projectName = generatedData.overview ? generatedData.overview.split(' ').slice(0, 5).join(' ') + "..." : "Untitled Project";

        // Insert new project
        const { data: project, error: pError } = await supabase
          .from("projects")
          .insert({
            user_id: userId,
            name: projectName,
            overview: generatedData.overview
          })
          .select()
          .single();

        if (pError || !project) throw pError;

        // Insert initial project version
        const { error: pvError } = await supabase
          .from("project_versions")
          .insert({
            project_id: project.id,
            data: generatedData
          });

        if (pvError) throw pvError;

        router.push(`/project/${project.id}/review`);
      } catch (error) {
        console.error("Error creating project:", error);
      }
    };

    compileAndSave();
  }, [currentProjectIdea, router, setProjectData]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-950">
      <div className="w-16 h-16 relative animate-spin mb-8">
        <Loader2 size={64} className="text-blue-500 absolute inset-0" />
      </div>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
        Compiling System Blueprint
      </h2>
      <p className="max-w-md text-center text-gray-400 mt-4 leading-relaxed">
        Our AI is analyzing your answers, building deterministic architectures, and generating structured diagrams for review.
      </p>
    </div>
  );
}
