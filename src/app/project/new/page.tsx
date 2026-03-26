"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProjectStore } from "@/store/projectStore";
import { processIdea } from "@/services/groqService";
import { Send, Terminal } from "lucide-react";

function ChatTerminal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { chatHistory, addChatMessage, setIdea, reset } = useProjectStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    reset();
    const seed = searchParams.get("seed");
    
    if (seed) {
      // Auto-submit the seed idea
      handleAutoSubmit(decodeURIComponent(seed));
    } else {
      addChatMessage({
        role: "assistant",
        content: "Welcome to VividAI. I'll ask you up to 10 questions to refine your project idea. What are you building?"
      });
    }
  }, [searchParams]);

  const handleAutoSubmit = async (content: string) => {
    addChatMessage({
      role: "assistant",
      content: "Welcome to VividAI. I've received your starting idea. Let me process that..."
    });
    
    const userMessage = { role: "user", content };
    addChatMessage(userMessage);
    setLoading(true);

    try {
      const responseContent = await processIdea([userMessage]);
      addChatMessage({ role: "assistant", content: responseContent });
    } catch (error) {
      console.error(error);
      addChatMessage({ role: "assistant", content: "Error communicating with AI. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input };
    addChatMessage(userMessage);
    setInput("");
    setLoading(true);

    try {
      const allMessages = [...chatHistory, userMessage];
      const responseContent = await processIdea(allMessages);

      if (responseContent.includes("[DONE]") || chatHistory.length >= 20) {
        addChatMessage({ role: "assistant", content: "Great! I have enough context. Formulating your project structure now..." });
        
        // Compile idea context
        const ideaContext = allMessages
          .filter(m => m.role === "user")
          .map(m => m.content)
          .join("\n");
        
        setIdea(ideaContext);
        
        // Redirect to review page slightly delayed for transition
        setTimeout(() => {
          router.push("/project/create"); // An intermediate page to generate & save project
        }, 1500);
      } else {
        addChatMessage({ role: "assistant", content: responseContent });
      }
    } catch (error) {
      console.error(error);
      addChatMessage({ role: "assistant", content: "Error communicating with AI. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col p-6">
      <div className="flex items-center gap-2 mb-6 text-green-400 font-mono">
        <Terminal size={24} />
        <h2 className="text-xl">VividAI Secure Terminal :: IDEA GENERATOR</h2>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 bg-black border border-gray-800 rounded-2xl p-6 overflow-y-auto font-mono text-sm space-y-6 shadow-2xl"
      >
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg p-4 ${
              msg.role === "user" 
                ? "bg-blue-900/50 text-blue-100 border border-blue-800/50 ml-auto" 
                : "bg-gray-900 border border-gray-800 text-green-400"
            }`}>
              <span className="opacity-50 text-xs mb-1 block">
                {msg.role === "user" ? "USER_INPUT" : "SYS_AI"}
              </span>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-900 border border-gray-800 text-green-400 rounded-lg p-4 animate-pulse">
              Generating response...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          className="flex-1 bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-green-500 font-mono transition"
          placeholder="Type your response..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 rounded-xl flex items-center justify-center transition"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

export default function NewProjectChat() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-500 font-mono">Initializing Terminal...</div>}>
      <ChatTerminal />
    </Suspense>
  );
}

