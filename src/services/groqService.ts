"use server";

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function extractJSON(content: string) {
  try {
    let text = content.trim();

    if (text.startsWith("```")) {
      text = text.replace(/^```[a-z]*\n/i, "").replace(/\n```$/i, "").trim();
    }

    // Try direct parse
    try {
      return JSON.parse(text);
    } catch { }

    // Find first valid JSON object safely by progressively searching for a valid closing brace
    const first = text.indexOf("{");
    if (first !== -1) {
      for (let i = text.length - 1; i > first; i--) {
        if (text[i] === "}") {
          const candidate = text.slice(first, i + 1);
          try {
            return JSON.parse(candidate);
          } catch {
            // Continue searching if this specific pair isn't valid JSON
            continue;
          }
        }
      }
    }

    throw new Error("No valid JSON found in response");
  } catch (err) {
    console.error("JSON Parsing failed. Raw content:", content);
    throw err;
  }
}

function sanitizeMermaid(flow: string): string {
  if (!flow) return flow;

  return flow.replace(
    /([a-zA-Z0-9_]+)\[([^\]]+)\]/g,
    (match, node, label) => {
      const trimmed = label.trim();

      // Skip if already properly quoted
      if (/^".*"$/.test(trimmed)) return match;

      // If contains risky chars → wrap
      if (/[()]/.test(trimmed)) {
        const safe = trimmed.replace(/"/g, '\\"'); // escape quotes
        return `${node}["${safe}"]`;
      }

      return match;
    }
  );
}

function validateMermaid(flow: string) {
  if (!flow) return;

  if (!/(graph|flowchart)\s+(TD|LR|TB|BT|RL)/i.test(flow)) {
    throw new Error("Invalid Mermaid format: missing graph TD/LR");
  }

  // Detect ONLY unquoted parentheses
  const unsafe = flow.match(/([a-zA-Z0-9_]+)\[([^\]]+)\]/g);

  if (unsafe) {
    for (const node of unsafe) {
      const label = node.match(/\[(.*)\]/)?.[1];
      if (!label) continue;

      const trimmed = label.trim();

      if (!/^".*"$/.test(trimmed) && /[()]/.test(trimmed)) {
        throw new Error("Unsafe Mermaid: unquoted parentheses detected");
      }
    }
  }
}

function validateStructure(obj: any) {
  const required = [
    "overview",
    "features",
    "tech_stack",
    "steps",
    "risks",
    "improvements",
    "workflow_flowchart",
    "tech_stack_flowchart",
    "steps_flowchart"
  ];

  for (const key of required) {
    if (!(key in obj)) {
      throw new Error(`Missing key: ${key}`);
    }
  }
}


export async function processIdea(messages: any[]) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a product discovery assistant.

Goal: Help the user clarify their idea into something buildable.

Rules:
- Ask ONE question at a time.
- Maximum 7 questions total.
- Each question must reduce ambiguity or unlock implementation clarity.
- Prioritize:
  1. Who is the user?
  2. What problem is solved?
  3. What is the core action?
  4. What is the simplest version (MVP)?
  5. What makes this different?

Behavior:
- Questions must be short and specific.
- Avoid generic startup questions.
- Avoid repeating information already given.

Stopping condition:
- If the idea is clear enough to build, respond with exactly:
[DONE]

Do NOT explain anything else.`
        },
        ...messages
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.7,
      max_tokens: 1350,
      top_p: 1,
    });
    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq Idea Processing Error:", error);
    throw new Error("Failed to process idea: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function generateProjectStructure(context: string) {
  let attempts = 0;
  const maxRetries = 2;
  let lastError = "";

  while (attempts <= maxRetries) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a senior system architect.

Your task is to convert the user's idea into a structured, buildable system.

OUTPUT RULES (STRICT):
- Output ONLY valid JSON
- No markdown
- No explanation
- No text before or after JSON
- All strings must be valid JSON (escape newlines as \\n)

JSON STRUCTURE:
{
  "overview": "Clear and structured explanation of the system (150-250 words, no fluff)",
  "features": ["Concrete feature with implementation hint", "..."],
  "tech_stack": ["Specific technologies with reason", "..."],
  "steps": ["Step-by-step build order", "..."],
  "risks": ["Real risk + mitigation", "..."],
  "improvements": ["Future enhancement", "..."],
  "workflow_flowchart": "mermaid graph TD ...",
  "tech_stack_flowchart": "mermaid graph TD ...",
  "steps_flowchart": "mermaid graph TD ..."
}

QUALITY RULES:
- Be practical, not theoretical
- Avoid buzzwords
- Prefer simple architectures over complex ones
- Assume MVP-first approach

MERMAID RULES:
- Use graph TD
- Keep it readable (not huge)
- Include meaningful labels (e.g. Auth -> Validate Token)
- Avoid excessive nesting
- CRITICAL: If a node label contains parentheses () or special characters, you MUST wrap the label in double quotes (e.g., A["User Input (Optional)"]). Do not use unquoted parentheses in node text.

If unsure, choose the simplest correct design.

STRICT FAILURE CONDITION:
If the output is not EXACTLY valid JSON matching the schema, your response will be discarded.

You MUST internally validate:
1. JSON parses correctly
2. All required keys exist
3. Mermaid rules are followed

Only then respond.`
          },
          {
            role: "user",
            content: attempts === 0 ? context : context + `\n\nSYSTEM ERROR (fix this in next response): ${lastError}`
          }
        ],
        model: "openai/gpt-oss-120b",
        temperature: 0.2, // low temp for deterministic JSON output
        max_tokens: 4096,
        top_p: 1,
      });

      const content = chatCompletion.choices[0]?.message?.content || "{}";
      const parsed = extractJSON(content);

      // Validate schema keys
      validateStructure(parsed);

      // Enforce Mermaid safety (Soft Recovery per field)
      try {
        if (parsed.workflow_flowchart) {
          parsed.workflow_flowchart = sanitizeMermaid(parsed.workflow_flowchart);
          validateMermaid(parsed.workflow_flowchart);
        }
      } catch {
        parsed.workflow_flowchart = "mermaid graph TD\nA[Start] --> B[Process] --> C[End]";
      }

      try {
        if (parsed.tech_stack_flowchart) {
          parsed.tech_stack_flowchart = sanitizeMermaid(parsed.tech_stack_flowchart);
          validateMermaid(parsed.tech_stack_flowchart);
        }
      } catch {
        parsed.tech_stack_flowchart = "mermaid graph TD\nA[Frontend] --> B[Backend]";
      }

      try {
        if (parsed.steps_flowchart) {
          parsed.steps_flowchart = sanitizeMermaid(parsed.steps_flowchart);
          validateMermaid(parsed.steps_flowchart);
        }
      } catch {
        parsed.steps_flowchart = "mermaid graph TD\nA[Step 1] --> B[Step 2]";
      }

      return parsed;
    } catch (error) {
      attempts++;
      lastError = String(error instanceof Error ? error.message : error);
      console.warn(`Structure Generation Attempt ${attempts} failed:`, error);

      if (attempts > maxRetries) {
        console.warn("Full generation failed after retries, applying safe structure fallback.");
        // We might not even have a parsed object if JSON parsing failed
        const fallbackBase = {
          overview: "Generation failed. Please try again with a simpler prompt.",
          features: ["N/A"],
          tech_stack: ["N/A"],
          steps: ["N/A"],
          risks: ["N/A"],
          improvements: ["N/A"],
        };

        return {
          ...fallbackBase,
          workflow_flowchart: "mermaid graph TD\nA[Start] --> B[Process] --> C[End]",
          tech_stack_flowchart: "mermaid graph TD\nA[Frontend] --> B[Backend]",
          steps_flowchart: "mermaid graph TD\nA[Step 1] --> B[Step 2]"
        };
      }
    }
  }
}

export async function analyzeProject(overview: string, type: 'risk' | 'architect' | 'investor') {
  const prompts = {
    risk: `You are a blunt technical critic.

Analyze the project and identify:
- 3–5 real risks (technical, product, or UX)
- For each risk:
  - Explain why it is a problem
  - Suggest a practical fix

Rules:
- No fluff
- No generic advice
- Be specific and actionable`,

    architect: `You are a senior system architect.

Analyze the system and:
- Identify structural weaknesses
- Suggest better architecture if needed
- Simplify where possible

Focus on:
- Scalability
- Maintainability
- Simplicity

Rules:
- Prefer simpler systems over complex ones
- Be concrete, not theoretical`,

    investor: `You are a pragmatic startup investor.

Evaluate:
- Is this worth building?
- Who will actually use this?
- What is missing for market success?

Output:
- Strengths
- Weaknesses
- 2–3 specific improvements to increase success

Rules:
- No hype
- No vague startup jargon
- Be realistic`
  };

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: prompts[type]
        },
        {
          role: "user",
          content: overview
        }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.5,
      max_tokens: 4096,
      top_p: 1,
    });
    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq Analysis Error:", error);
    throw new Error("Failed to generate analysis: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function modifyProject(currentStructure: any, userRequest: string, analysisContext?: any) {
  let attempts = 0;
  const maxRetries = 2;
  let lastError = "";

  while (attempts <= maxRetries) {
    try {
      // Helper to truncate long analyst text to avoid blowing the context window
      const truncate = (text: string, max = 800) =>
        text && text.length > max ? text.slice(0, max) + "\n...[truncated]" : text || "";

      // Build explicit list of keys from the current structure so the LLM knows what to preserve
      const fieldList = Object.keys(currentStructure).join(", ");

      let systemContent = `You are a software builder.

Your task:
Modify the existing project structure based on the user's request.

RULES:
- Preserve ALL existing fields unless modification is required
- Do NOT remove useful information
- Apply changes surgically
- You MUST include ALL of these keys in your response: ${fieldList}

OUTPUT RULES:
- Return ONLY valid JSON
- Same structure as input — include EVERY key even if unchanged
- No extra text
- Escape newlines as \\n

MERMAID RULES (for flowchart fields):
- Use graph TD
- Keep diagrams readable
- Include meaningful labels
- Wrap labels containing parentheses in double quotes
- Always output valid mermaid syntax

PRIORITY:
1. Respect user request
2. Maintain consistency
3. Keep structure clean

If request is unclear, make the smallest reasonable change.

STRICT FAILURE CONDITION:
If the output is not EXACTLY valid JSON matching the schema, your response will be discarded.

You MUST internally validate:
1. JSON parses correctly
2. All required keys exist
3. Mermaid rules are followed

Only then respond.`;

      if (analysisContext && (analysisContext.archAnalysis || analysisContext.riskAnalysis)) {
        systemContent += `\n\nCONTEXT FROM ANALYSTS:
The user might refer to advice from the system architect, risk analyst, or investor. Here is their recent feedback:
`;
        if (analysisContext.archAnalysis) {
          systemContent += `\n[System Architect]:\n${truncate(analysisContext.archAnalysis)}\n`;
        }
        if (analysisContext.riskAnalysis) {
          systemContent += `\n[Risk Analyst]:\n${truncate(analysisContext.riskAnalysis)}\n`;
        }
        if (analysisContext.investorAnalysis) {
          systemContent += `\n[Investor]:\n${truncate(analysisContext.investorAnalysis)}\n`;
        }
      }

      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: systemContent
          },
          {
            role: "user",
            content: attempts === 0
              ? `Current Structure: ${JSON.stringify(currentStructure)}\nUser Request: ${userRequest}`
              : `Current Structure: ${JSON.stringify(currentStructure)}\nUser Request: ${userRequest}\n\nSYSTEM ERROR (fix this in next response): ${lastError}`
          }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 8192,
        top_p: 1,
        response_format: { type: "json_object" },
      });

      const content = chatCompletion.choices[0]?.message?.content || "{}";
      const parsed = extractJSON(content);

      // Validate schema keys
      validateStructure(parsed);

      // Deep merge: original structure is the base, LLM response overwrites only non-empty fields
      const merged = { ...currentStructure };
      for (const key of Object.keys(parsed)) {
        const val = parsed[key];
        // Only overwrite if the new value is meaningful (not empty string/array)
        if (val === "" || val === null || val === undefined) continue;
        if (Array.isArray(val) && val.length === 0) continue;
        merged[key] = val;
      }

      // Enforce Mermaid safety (Soft Recovery per field)
      try {
        if (merged.workflow_flowchart) {
          merged.workflow_flowchart = sanitizeMermaid(merged.workflow_flowchart);
          validateMermaid(merged.workflow_flowchart);
        }
      } catch {
        merged.workflow_flowchart = "mermaid graph TD\nA[Start] --> B[Process] --> C[End]";
      }

      try {
        if (merged.tech_stack_flowchart) {
          merged.tech_stack_flowchart = sanitizeMermaid(merged.tech_stack_flowchart);
          validateMermaid(merged.tech_stack_flowchart);
        }
      } catch {
        merged.tech_stack_flowchart = "mermaid graph TD\nA[Frontend] --> B[Backend]";
      }

      try {
        if (merged.steps_flowchart) {
          merged.steps_flowchart = sanitizeMermaid(merged.steps_flowchart);
          validateMermaid(merged.steps_flowchart);
        }
      } catch {
        merged.steps_flowchart = "mermaid graph TD\nA[Step 1] --> B[Step 2]";
      }

      return merged;
    } catch (error) {
      attempts++;
      lastError = String(error instanceof Error ? error.message : error);
      console.warn(`Project Modification Attempt ${attempts} failed:`, error);

      if (attempts > maxRetries) {
        console.warn("Modification failed after retries, applying safe flowchart fallbacks on current structure.");
        return {
          ...currentStructure,
          workflow_flowchart: "mermaid graph TD\nA[Start] --> B[Process] --> C[End]",
          tech_stack_flowchart: "mermaid graph TD\nA[Frontend] --> B[Backend]",
          steps_flowchart: "mermaid graph TD\nA[Step 1] --> B[Step 2]"
        };
      }
    }
  }
}

export async function generateFinalDocuments(projectOverview: any) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a senior software architect writing instructions for an AI coding agent.

Your task:
Generate a MASTER BUILD PROMPT and a RULESET.

FORMAT (STRICT):

[MASTER PROMPT]
Write a clear, step-by-step instruction for building the system:
- Architecture
- Core features
- Data flow
- Implementation order

Keep it practical and structured (500–700 words).

---RULES---

[RULES]
- Coding constraints
- Architecture constraints
- Best practices

RULES:
- No fluff
- No repetition
- No mermaid diagrams
- Must be actionable
- Must be readable by another AI

Do NOT output JSON.
Do NOT add extra sections.`
        },
        {
          role: "user",
          content: `Project Details: ${JSON.stringify(projectOverview)}`
        }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      max_tokens: 4096,
      top_p: 1,
    });

    const content = chatCompletion.choices[0]?.message?.content || "";
    const parts = content.split("---RULES---");

    return {
      prompts: parts[0]?.replace(/^---PROMPTS---/i, '').trim() || JSON.stringify(projectOverview, null, 2),
      rules: parts[1]?.trim() || "No specific rules were generated by the API."
    };
  } catch (error) {
    console.error("Groq Document Gen Error:", error);
    throw new Error("Failed to generate final documents: " + (error instanceof Error ? error.message : String(error)));
  }
}

export async function generateRandomIdeas() {
  try {
    const seed = Date.now();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Generate exactly 5 unique, innovative tech startup or system ideas.
Current Random Seed/Timestamp: ${seed}
Each idea should be 1-2 sentences long.
Must be specific and exciting.
Avoid generic "AI bot" ideas.

OUTPUT RULES:
- Output ONLY valid JSON array of objects.
- Structure: {"ideas": [{"title": "Name", "description": "1-2 sentence pitch"}]}`
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 1.0,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0]?.message?.content || "{\"ideas\": []}";
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.ideas) ? parsed.ideas : (parsed.items || []);
  } catch (error) {
    console.error("Groq Random Idea Generation Error:", error);
    return [
      { title: "AI Legal Assistant", description: "An autonomous agent that pre-vets legal contracts for common pitfalls." },
      { title: "Decentralized Energy", description: "P2P energy sharing platform for homes with solar panels." }
    ];
  }
}


