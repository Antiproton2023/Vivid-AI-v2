# VividAI System Walkthrough

## 1. Workflow Mapping
VividAI converts human ideas into deterministic technical architectures via a sophisticated five-page funnel. The workflow executes as follows:
- **Authentication**: `src/app/auth/page.tsx` checks user state via Supabase Auth and protects the rest of the application.
- **Home**: `src/app/page.tsx` displays previously generated systems for a user by querying the `projects` table.
- **Idea Capture**: `src/app/project/new/page.tsx` simulates a terminal and iterates up to 10 context-gathering loops via Groq.
- **Backend Processor**: `src/app/project/create/page.tsx` handles the heavy backend API calls to compile the parsed input into deterministic JSON (saved instantly to Supabase).
- **Review Layer**: `src/app/project/[id]/review/page.tsx` visually parses the JSON via Mermaid flowcharts, initiates subsequent analysis via 3 analyst personas, and allows users to append dynamic iterations using Builder Mode Copilot.
- **Final Output**: `src/app/project/[id]/page.tsx` serves as the culmination, permanently storing and rendering the final output JSON layout alongside `prompts.txt` and `rules.md` (generated strictly out of context data).

## 2. Component Responsibilities
- **Navbar**: Main navigation overlay dynamically reading from `supabasé.auth` onAuthStateChange. Reuses the project's unique `/brand Logo.png`.
- **Mermaid renderer**: Dynamic React component (`src/components/Mermaid.tsx`) handling DOM injection logic for raw Mermaid.js JSON output. Prevents conflicts by managing state and IDs natively.
- **State Module**: Zustand instance standardizing dynamic chat inputs globally before inserting data to DB.

## 3. Service Layer
- **`supabaseService.ts`**: Pure client interface logic bridging the Vercel app to Supabase PostgreSQL endpoints. Used predominantly for standard `insert()`, `select()`, and identity polling queries.
- **`groqService.ts`**: Backend server-action hub powering the intelligence engine. Abstracted rigorously via `use server`. Each specific task is separated into distinct functions (`processIdea()`, `generateProjectStructure()`, `analyzeProject()`, `generateFinalDocuments()`) strictly prompted for JSON-only or contextual deterministic output. Uses the lightweight Llama 3 8B model via the standard SDK.

## 4. Data Flow
1. **Input Phase**: Messages accumulate iteratively in User Interface (Zustand store tracking).
2. **Structuring Phase**: State variables bundled and pipelined via `groqService.ts` to transform plaintext arrays into robust JSON logic.
3. **Persistency**: Post-transformation, JSON objects immediately dispatch through API to Superbase's `projects` and `project_versions` schemas respectively.
4. **Rendering Phase**: React state pulls versions locally querying Supabase and formats JSON elements (specifically flowcharts via `mermaid.js`).

## 5. State Management
Rather than relying completely on React's component state (which inherently is dangerous to lose across dynamic chat interactions and subsequent route renders), we centralize volatile context via **Zustand** inside `/src/store/projectStore.ts`. 
- **`chatHistory`**: Logs continuous inputs linearly without pushing each index to DB.
- **`projectData`**: Maintains immediate local cache memory mirroring exactly what is synced with the DB row. Eliminates the necessity to rehydrate DB query data persistently when toggling between tabs on Review and Final stages.
