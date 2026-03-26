"use client";

import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
});

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgStr, setSvgStr] = useState("");

  useEffect(() => {
    let active = true;
    const renderChart = async () => {
      if (containerRef.current && chart) {
        try {
          // ensure unique id to avoid cache conflict
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          
          let cleanChart = chart.replace(/```mermaid\n?/gi, "");
          cleanChart = cleanChart.replace(/```\n?/gi, "");
          cleanChart = cleanChart.replace(/^\s*mermaid\s*/gi, "");
          
          // NEW FIX: Convert literal escaped "\n" substrings to true carriage returns!
          cleanChart = cleanChart.replace(/\\n/g, "\n");

          // ROBUSTNESS FIX: Auto-quote all unquoted labels
          // This shields the diagram from almost all syntax errors in node text (parens, dots, slashes, etc.)
          cleanChart = cleanChart.replace(/([\w-]+)(\[)([^"\]]+)(\])/g, (match, id, start, inner, end) => {
            return `${id}["${inner.trim()}"]`;
          });

          // ROBUSTNESS FIX: Remove accidental trailing IDs after node definitions
          // This fixes: ID[Label] ID --> and ID[Label] ID
          cleanChart = cleanChart.replace(/(\[[^\]]+\])\s+([\w-]+)\s*(?=-->|==>|-.->|--|\||\n|$)/g, "$1");

          cleanChart = cleanChart.trim();
          
          const { svg } = await mermaid.render(id, cleanChart);
          if (active) setSvgStr(svg);
        } catch (error) {
          console.error("Mermaid Render Error:", error);
          if (active) setSvgStr("<div class='text-gray-600 text-sm italic py-10 opacity-50 select-none'>Diagram could not be rendered due to a syntax error in the AI output.</div>");
        }
      }
    };
    renderChart();
    return () => { active = false; };
  }, [chart]);

  return <div ref={containerRef} className="w-full flex justify-center py-4" dangerouslySetInnerHTML={{ __html: svgStr }} />;
};

export default Mermaid;
