import { create } from 'zustand';

interface ProjectState {
  currentProjectIdea: string;
  chatHistory: any[];
  projectData: any | null; // Structured JSON output
  finalDocuments: { prompts: string; rules: string } | null;
  setIdea: (idea: string) => void;
  addChatMessage: (msg: any) => void;
  setProjectData: (data: any) => void;
  setFinalDocuments: (docs: { prompts: string; rules: string }) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProjectIdea: '',
  chatHistory: [],
  projectData: null,
  finalDocuments: null,
  setIdea: (idea) => set({ currentProjectIdea: idea }),
  addChatMessage: (msg) => set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
  setProjectData: (data) => set({ projectData: data }),
  setFinalDocuments: (docs) => set({ finalDocuments: docs }),
  reset: () => set({ currentProjectIdea: '', chatHistory: [], projectData: null, finalDocuments: null }),
}));
