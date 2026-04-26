"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, ChevronDown, Users, FolderKanban } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatTime, getAvatarColor } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import type { Message } from "@/lib/types";

interface Project {
  id: string;
  name: string;
  clientName: string;
}

interface InternalMessagesProps {
  projects: Project[];
  initialProjectId: string;
  initialMessages: Message[];
  senderName: string;
}

export function InternalMessages({ projects, initialProjectId, initialMessages, senderName }: InternalMessagesProps) {
  const supabase = createClient();
  const [projectId, setProjectId] = useState(initialProjectId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const msgsRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find((p) => p.id === projectId);

  // Subscribe to realtime messages
  useEffect(() => {
    if (!projectId) return;
    const channel = supabase
      .channel(`internal-messages:${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

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

  // Scroll to bottom
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending || !projectId) return;
    setSending(true);
    setInput("");

    const { data: { user } } = await supabase.auth.getUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("messages") as any).insert({
      project_id:  projectId,
      sender_id:   user?.id ?? null,
      sender_name: senderName,
      sender_role: "team",
      content:     text,
    });
    setSending(false);
  }

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      {/* Project list sidebar */}
      <div className="hidden md:flex w-[260px] flex-shrink-0 flex-col border-r border-white/50 glass">
        <div className="px-4 py-4 border-b border-white/50 flex-shrink-0">
          <div className="text-[14px] font-bold text-[#0f172a]">Conversations</div>
          <div className="text-[11.5px] text-[#94a3b8] mt-0.5">All client projects</div>
        </div>
        <div className="flex-1 overflow-y-auto py-2 [scrollbar-width:thin]">
          {projects.map((p) => {
            const isActive = p.id === projectId;
            const projectMsgs = messages.filter(m => m.project_id === p.id);
            const lastMsg = projectMsgs[projectMsgs.length - 1];
            return (
              <button
                key={p.id}
                onClick={() => setProjectId(p.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 transition-all text-left hover:bg-white/60 ${
                  isActive ? "bg-[rgba(27,63,238,0.08)]" : ""
                }`}
              >
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                  isActive ? "bg-[#1B3FEE]" : "bg-[rgba(27,63,238,0.1)]"
                }`}>
                  <FolderKanban className={`w-4 h-4 ${isActive ? "text-white" : "text-[#1B3FEE]"}`} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[12.5px] font-semibold truncate ${isActive ? "text-[#1B3FEE]" : "text-[#0f172a]"}`}>
                    {p.name}
                  </div>
                  <div className="text-[11px] text-[#94a3b8] truncate">{p.clientName}</div>
                  {lastMsg && (
                    <div className="text-[11px] text-[#94a3b8] truncate mt-0.5">
                      {lastMsg.sender_name}: {lastMsg.content}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-white/50 glass flex-shrink-0 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[rgba(27,63,238,0.1)] flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#1B3FEE]" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#0f172a]">
                {selectedProject?.name ?? "Select a project"}
              </div>
              {selectedProject && (
                <div className="text-[11.5px] text-[#94a3b8]">{selectedProject.clientName}</div>
              )}
            </div>
          </div>

          {/* Mobile project selector */}
          {projects.length > 1 && (
            <div className="md:hidden ml-auto relative">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-[10px] bg-white/70 border border-white/60 text-[13px] font-medium text-[#0f172a] outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <div className="ml-auto hidden md:flex items-center gap-1.5 text-[12px] text-[#475569]">
            <Users className="w-3.5 h-3.5" />
            <span>Team channel</span>
          </div>
        </div>

        {/* No project selected state */}
        {!projectId && (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-[rgba(27,63,238,0.08)] flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-[#1B3FEE]" />
              </div>
              <div className="text-[14px] font-semibold text-[#0f172a] mb-1">Select a project</div>
              <p className="text-[13px] text-[#94a3b8]">Choose a client project from the list to view messages.</p>
            </div>
          </div>
        )}

        {/* Messages */}
        {projectId && (
          <>
            <div ref={msgsRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-5 flex flex-col gap-3 [scrollbar-width:thin]">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-[rgba(27,63,238,0.08)] flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-[#1B3FEE]" />
                  </div>
                  <div className="text-[14px] font-semibold text-[#0f172a] mb-1">No messages yet</div>
                  <p className="text-[13px] text-[#94a3b8]">Start the conversation — the client will see it in their portal.</p>
                </div>
              )}

              {messages.map((msg) => {
                const isMe = msg.sender_role === "team";
                return (
                  <div key={msg.id} className={`flex items-end gap-2 max-w-[72%] ${isMe ? "self-end flex-row-reverse" : "self-start"}`}>
                    {!isMe && (
                      <Avatar name={msg.sender_name ?? "C"} color={getAvatarColor(msg.sender_name ?? "C")} size="xs" />
                    )}
                    <div className="flex flex-col">
                      {!isMe && (
                        <span className="text-[11px] text-[#94a3b8] font-medium mb-1 px-1">{msg.sender_name}</span>
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
                  </div>
                );
              })}
            </div>

            {/* Input bar */}
            <div className="px-4 md:px-6 py-4 border-t border-white/50 glass flex-shrink-0">
              <div className="flex items-center gap-3 bg-white/70 border border-white/60 rounded-[14px] px-4 py-2.5 focus-within:border-[rgba(27,63,238,0.3)] focus-within:ring-2 focus-within:ring-[rgba(27,63,238,0.08)] transition-all">
                <input
                  type="text"
                  placeholder={`Message ${selectedProject?.clientName ?? "client"}…`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  className="flex-1 bg-transparent text-[13.5px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none font-sans"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || sending || !projectId}
                  className="w-[36px] h-[36px] rounded-[10px] bg-[#1B3FEE] flex items-center justify-center cursor-pointer hover:bg-[#1535D4] transition-colors disabled:opacity-40 shadow-[0_2px_8px_rgba(27,63,238,0.25)] flex-shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-2 text-center">
                Messages are visible to the client in real time via their portal
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
