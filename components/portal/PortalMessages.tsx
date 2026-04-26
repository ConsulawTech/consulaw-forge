"use client";

import { useState, useEffect, useRef } from "react";
import { Send, FileText, ChevronDown, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatTime } from "@/lib/utils";
import type { Message } from "@/lib/types";

interface Project {
  id: string;
  name: string;
}

interface PortalMessagesProps {
  projects: Project[];
  initialProjectId: string;
  initialMessages: Message[];
  senderName: string;
  senderId: string;
}

export function PortalMessages({ projects, initialProjectId, initialMessages, senderName, senderId }: PortalMessagesProps) {
  const supabase = createClient();
  const [projectId, setProjectId] = useState(initialProjectId);
  const [messages, setMessages]   = useState<Message[]>(initialMessages);
  const [input, setInput]         = useState("");
  const [sending, setSending]     = useState(false);
  const [sendError, setSendError] = useState("");
  const msgsRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time messages for the selected project
  useEffect(() => {
    const channel = supabase
      .channel(`portal-messages:${projectId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, supabase]);

  // Reload messages when project changes
  useEffect(() => {
    if (projectId === initialProjectId) {
      setMessages(initialMessages);
      return;
    }
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from("messages")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at")
        .limit(50);
      setMessages(data ?? []);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setSendError("");

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("messages") as any).insert({
        project_id:  projectId,
        sender_id:   senderId,
        sender_name: senderName,
        sender_role: "client",
        content:     text,
      });
      if (error) throw new Error(error.message);
      setInput("");
    } catch (err) {
      setSendError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/50 glass flex-shrink-0 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-[rgba(27,63,238,0.1)] flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#1B3FEE]" strokeWidth={2} />
          </div>
          <div>
            <div className="text-[15px] font-bold text-[#0f172a]">Messages</div>
            <div className="text-[11.5px] text-[#94a3b8]">Chat with your Consulaw Tech team</div>
          </div>
        </div>

        {/* Project selector — only shown if multiple projects */}
        {projects.length > 1 && (
          <div className="ml-auto relative">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-[10px] bg-white/70 border border-white/60 text-[13px] font-medium text-[#0f172a] outline-none focus:border-[#1B3FEE]/30 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        {projects.length === 1 && (
          <div className="ml-auto text-[12px] font-semibold text-[#1B3FEE] bg-[rgba(27,63,238,0.08)] px-2.5 py-1 rounded-full border border-[rgba(27,63,238,0.15)]">
            {selectedProject?.name}
          </div>
        )}

        {/* Online indicator */}
        <div className="flex items-center gap-1.5 text-[12px] text-[#475569]">
          <div className="w-2 h-2 rounded-full bg-[#2dc071] shadow-[0_0_0_2px_rgba(45,192,113,0.25)]" />
          Team online
        </div>
      </div>

      {/* Messages */}
      <div ref={msgsRef} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3 [scrollbar-width:thin]">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(27,63,238,0.08)] flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-[#1B3FEE]" />
            </div>
            <div className="text-[14px] font-semibold text-[#0f172a] mb-1">No messages yet</div>
            <p className="text-[13px] text-[#94a3b8]">Send a message to start the conversation with your team.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_role === "client";
          return (
            <div key={msg.id} className={`flex flex-col max-w-[60%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
              {!isMe && (
                <span className="text-[11px] text-[#94a3b8] font-medium mb-1 px-1">Consulaw Tech</span>
              )}
              <div
                className="px-4 py-2.5 text-[13.5px] leading-[1.5] shadow-sm"
                style={
                  isMe
                    ? { background: "#1B3FEE", color: "#fff", borderRadius: "16px 4px 16px 16px" }
                    : { background: "rgba(255,255,255,0.85)", color: "#0f172a", borderRadius: "4px 16px 16px 16px", border: "1px solid rgba(203,213,225,0.4)" }
                }
              >
                {msg.content}
              </div>
              <span className={`text-[10.5px] text-[#94a3b8] mt-1 px-1 ${isMe ? "text-right" : "text-left"}`}>
                {formatTime(msg.created_at)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input bar */}
      <div className="px-6 py-4 border-t border-white/50 glass flex-shrink-0">
        {sendError && (
          <div className="flex items-center gap-1.5 text-[11px] text-red-500 mb-2 px-1">
            <AlertCircle className="w-3 h-3" />
            {sendError}
          </div>
        )}
        <div className="flex items-center gap-3 bg-white/70 border border-white/60 rounded-[14px] px-4 py-2.5 focus-within:border-[rgba(27,63,238,0.3)] focus-within:ring-2 focus-within:ring-[rgba(27,63,238,0.08)] transition-all">
          <input
            type="text"
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            className="flex-1 bg-transparent text-[13.5px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none font-sans"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="w-[36px] h-[36px] rounded-[10px] bg-[#1B3FEE] flex items-center justify-center cursor-pointer hover:bg-[#1535D4] transition-colors disabled:opacity-40 shadow-[0_2px_8px_rgba(27,63,238,0.25)] flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-[11px] text-[#94a3b8] mt-2 text-center">
          Messages are seen by your Consulaw Tech team in real time
        </p>
      </div>
    </div>
  );
}
