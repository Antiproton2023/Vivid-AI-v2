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
    try {
      return JSON.parse(text);
    } catch (parseError) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw parseError;
    }
  } catch (err) {
    console.error("JSON Parsing failed. Raw content:", content);
    throw err;
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

If unsure, choose the simplest correct design.`
        },
        {
          role: "user",
          content: context
        }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.2, // low temp for deterministic JSON output
      max_tokens: 4096,
      top_p: 1,
    });

    const content = chatCompletion.choices[0]?.message?.content || "{}";
    return extractJSON(content);
  } catch (error) {
    console.error("Groq Structure Generation Error:", error);
    throw new Error("Failed to generate project structure: " + (error instanceof Error ? error.message : String(error)));
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

If request is unclear, make the smallest reasonable change.`;

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
          content: `Current Structure: ${JSON.stringify(currentStructure)}\nUser Request: ${userRequest}`
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

    // Deep merge: original structure is the base, LLM response overwrites only non-empty fields
    const merged = { ...currentStructure };
    for (const key of Object.keys(parsed)) {
      const val = parsed[key];
      // Only overwrite if the new value is meaningful (not empty string/array)
      if (val === "" || val === null || val === undefined) continue;
      if (Array.isArray(val) && val.length === 0) continue;
      merged[key] = val;
    }

    return merged;
  } catch (error) {
    console.error("Groq Modification Error:", error);
    throw new Error("Failed to modify project structure: " + (error instanceof Error ? error.message : String(error)));
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


