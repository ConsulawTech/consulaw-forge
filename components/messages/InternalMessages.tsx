"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, ChevronDown, Users, FolderKanban, User, Hash, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatTime, getAvatarColor } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import type { Message, InternalMessage } from "@/lib/types";

interface Project {
  id: string;
  name: string;
  clientName: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  job_title: string | null;
}

interface InternalMessagesProps {
  projects: Project[];
  teamMembers: TeamMember[];
  initialProjectId: string;
  initialMessages: Message[];
  senderName: string;
  senderId: string;
}

type ChatTab = "client" | "team" | "dm";

export function InternalMessages({
  projects,
  teamMembers,
  initialProjectId,
  initialMessages,
  senderName,
  senderId,
}: InternalMessagesProps) {
  const supabase = createClient();

  // Shared state — restore from localStorage on mount
  const [activeTab, setActiveTab] = useState<ChatTab>(() => {
    try {
      const saved = localStorage.getItem("forge:messages:activeTab") as ChatTab | null;
      return saved && ["client", "team", "dm"].includes(saved) ? saved : "client";
    } catch { return "client"; }
  });
  const [projectId, setProjectId] = useState(() => {
    try {
      const saved = localStorage.getItem("forge:messages:projectId");
      return saved && projects.some((p) => p.id === saved) ? saved : initialProjectId;
    } catch { return initialProjectId; }
  });
  const [recipientId, setRecipientId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem("forge:messages:recipientId");
      return saved && teamMembers.some((m) => m.id === saved) ? saved : "";
    } catch { return ""; }
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const msgsRef = useRef<HTMLDivElement>(null);

  // Messages state per tab
  const [clientMessages, setClientMessages] = useState<Message[]>(initialMessages);
  const [teamMessages, setTeamMessages] = useState<InternalMessage[]>([]);
  const [dmMessages, setDmMessages] = useState<InternalMessage[]>([]);

  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedMember = teamMembers.find((m) => m.id === recipientId);

  // Persist tab / project / recipient to localStorage
  useEffect(() => {
    localStorage.setItem("forge:messages:activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("forge:messages:projectId", projectId);
  }, [projectId]);

  useEffect(() => {
    localStorage.setItem("forge:messages:recipientId", recipientId);
  }, [recipientId]);

  // ── Realtime subscriptions ─────────────────────────────────────────────

  useEffect(() => {
    if (activeTab === "client" && projectId) {
      const channel = supabase
        .channel(`internal-messages-client:${projectId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` },
          (payload) => setClientMessages((prev) => [...prev, payload.new as Message])
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, projectId]);

  useEffect(() => {
    if (activeTab === "team" && projectId) {
      const channel = supabase
        .channel(`internal-messages-team:${projectId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "internal_messages", filter: `project_id=eq.${projectId}` },
          (payload) => {
            const msg = payload.new as InternalMessage;
            // Only append team messages (recipient_id is null)
            if (msg.recipient_id === null) {
              setTeamMessages((prev) => [...prev, msg]);
            }
          }
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, projectId]);

  useEffect(() => {
    if (activeTab === "dm" && recipientId) {
      const channel = supabase
        .channel(`internal-messages-dm:${senderId}:${recipientId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "internal_messages", filter: `project_id=is.null` },
          (payload) => {
            const msg = payload.new as InternalMessage;
            // Only append if it's between these two users
            if (
              msg.project_id === null &&
              ((msg.sender_id === senderId && msg.recipient_id === recipientId) ||
                (msg.sender_id === recipientId && msg.recipient_id === senderId))
            ) {
              setDmMessages((prev) => [...prev, msg]);
            }
          }
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, recipientId]);

  // ── Load messages when selection changes ───────────────────────────────

  useEffect(() => {
    if (activeTab === "client") {
      if (projectId === initialProjectId) {
        setClientMessages(initialMessages);
      } else {
        (async () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await (supabase as any)
            .from("messages")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at")
            .limit(50);
          setClientMessages(data ?? []);
        })();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, projectId]);

  useEffect(() => {
    if (activeTab === "team" && projectId) {
      (async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("internal_messages")
          .select("*")
          .eq("project_id", projectId)
          .is("recipient_id", null)
          .order("created_at")
          .limit(50);
        setTeamMessages(data ?? []);
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, projectId]);

  useEffect(() => {
    if (activeTab === "dm" && recipientId) {
      (async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("internal_messages")
          .select("*")
          .is("project_id", null)
          .or(`and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`)
          .order("created_at")
          .limit(50);
        setDmMessages(data ?? []);
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, recipientId]);

  // ── Scroll to bottom ───────────────────────────────────────────────────

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [activeTab === "client" ? clientMessages : activeTab === "team" ? teamMessages : dmMessages]);

  // ── Send message ───────────────────────────────────────────────────────

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    if ((activeTab === "dm" ? !recipientId : !projectId)) return;

    setSending(true);
    setSendError("");

    try {
      if (activeTab === "client" && projectId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("messages") as any).insert({
          project_id: projectId,
          sender_id: senderId,
          sender_name: senderName,
          sender_role: "team",
          content: text,
        });
        if (error) throw new Error(error.message);
      } else if (activeTab === "team" && projectId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("internal_messages") as any).insert({
          project_id: projectId,
          sender_id: senderId,
          sender_name: senderName,
          recipient_id: null,
          content: text,
        });
        if (error) throw new Error(error.message);
      } else if (activeTab === "dm" && recipientId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase.from("internal_messages") as any).insert({
          project_id: null,
          sender_id: senderId,
          sender_name: senderName,
          recipient_id: recipientId,
          content: text,
        });
        if (error) throw new Error(error.message);
      }
      setInput("");
    } catch (err) {
      setSendError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  // ── Current messages and UI helpers ────────────────────────────────────

  const currentMessages =
    activeTab === "client" ? clientMessages :
    activeTab === "team" ? teamMessages :
    dmMessages;

  const chatTitle =
    activeTab === "client" ? (selectedProject?.name ?? "Select a project") :
    activeTab === "team" ? `${selectedProject?.name ?? "Select a project"} — Team Chat` :
    selectedMember?.full_name ?? "Select a team member";

  const chatSubtitle =
    activeTab === "client" ? (selectedProject?.clientName ?? "") :
    activeTab === "team" ? "In-house project chat" :
    (selectedMember?.job_title ?? "Team Member");

  const placeholderText =
    activeTab === "client" ? `Message ${selectedProject?.clientName ?? "client"}…` :
    activeTab === "team" ? "Message the project team…" :
    `Message ${selectedMember?.full_name ?? "team member"}…`;

  const footerNote =
    activeTab === "client" ? "Messages are visible to the client in real time via their portal" :
    activeTab === "team" ? "In-house team chat — not visible to clients" :
    "Direct message — private between you and this team member";

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      {/* Left sidebar */}
      <div className="hidden md:flex w-[280px] flex-shrink-0 flex-col border-r border-white/50 glass">
        {/* Tabs */}
        <div className="flex items-center gap-1 px-3 py-3 border-b border-white/50 flex-shrink-0">
          {([
            { key: "client", label: "Client", icon: MessageSquare },
            { key: "team", label: "Team", icon: Hash },
            { key: "dm", label: "DMs", icon: User },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                activeTab === t.key
                  ? "bg-[rgba(27,63,238,0.1)] text-[#1B3FEE]"
                  : "text-[#94a3b8] hover:bg-white/40 hover:text-[#475569]"
              }`}
            >
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2 [scrollbar-width:thin]">
          {activeTab === "client" && projects.map((p) => {
            const isActive = p.id === projectId;
            const lastMsg = clientMessages.filter(m => m.project_id === p.id).slice(-1)[0];
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

          {activeTab === "team" && projects.map((p) => {
            const isActive = p.id === projectId;
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
                  <Hash className={`w-4 h-4 ${isActive ? "text-white" : "text-[#1B3FEE]"}`} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-[12.5px] font-semibold truncate ${isActive ? "text-[#1B3FEE]" : "text-[#0f172a]"}`}>
                    {p.name}
                  </div>
                  <div className="text-[11px] text-[#94a3b8] truncate">{p.clientName}</div>
                </div>
              </button>
            );
          })}

          {activeTab === "dm" && teamMembers.filter(m => m.id !== senderId).map((m) => {
            const isActive = m.id === recipientId;
            return (
              <button
                key={m.id}
                onClick={() => setRecipientId(m.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 transition-all text-left hover:bg-white/60 ${
                  isActive ? "bg-[rgba(27,63,238,0.08)]" : ""
                }`}
              >
                <Avatar name={m.full_name} color={getAvatarColor(m.full_name)} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className={`text-[12.5px] font-semibold truncate ${isActive ? "text-[#1B3FEE]" : "text-[#0f172a]"}`}>
                    {m.full_name}
                  </div>
                  <div className="text-[11px] text-[#94a3b8] truncate">{m.job_title ?? "Team Member"}</div>
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
              {activeTab === "dm" ? (
                <User className="w-4 h-4 text-[#1B3FEE]" strokeWidth={2} />
              ) : (
                <MessageSquare className="w-4 h-4 text-[#1B3FEE]" strokeWidth={2} />
              )}
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#0f172a]">{chatTitle}</div>
              {chatSubtitle && <div className="text-[11.5px] text-[#94a3b8]">{chatSubtitle}</div>}
            </div>
          </div>

          {/* Mobile selectors */}
          {activeTab !== "dm" && projects.length > 1 && (
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

          {activeTab === "dm" && teamMembers.length > 1 && (
            <div className="md:hidden ml-auto relative">
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-[10px] bg-white/70 border border-white/60 text-[13px] font-medium text-[#0f172a] outline-none cursor-pointer"
              >
                <option value="">Select member…</option>
                {teamMembers.filter(m => m.id !== senderId).map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <div className="ml-auto hidden md:flex items-center gap-1.5 text-[12px] text-[#475569]">
            <Users className="w-3.5 h-3.5" />
            <span>
              {activeTab === "client" ? "Client channel" : activeTab === "team" ? "Team channel" : "Direct message"}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div ref={msgsRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-5 flex flex-col gap-3 [scrollbar-width:thin]">
          {currentMessages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(27,63,238,0.08)] flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-[#1B3FEE]" />
              </div>
              <div className="text-[14px] font-semibold text-[#0f172a] mb-1">No messages yet</div>
              <p className="text-[13px] text-[#94a3b8]">
                {activeTab === "client"
                  ? "Start the conversation — the client will see it in their portal."
                  : activeTab === "team"
                  ? "Start the team discussion for this project."
                  : "Start a direct message with this team member."}
              </p>
            </div>
          )}

          {activeTab === "client" && (currentMessages as Message[]).map((msg) => {
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
                  {isMe && (
                    <span className="text-[11px] text-[#94a3b8] font-medium mb-1 px-1 text-right">{msg.sender_name}</span>
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

          {(activeTab === "team" || activeTab === "dm") && (currentMessages as InternalMessage[]).map((msg) => {
            const isMe = msg.sender_id === senderId;
            return (
              <div key={msg.id} className={`flex items-end gap-2 max-w-[72%] ${isMe ? "self-end flex-row-reverse" : "self-start"}`}>
                {!isMe && (
                  <Avatar name={msg.sender_name ?? "T"} color={getAvatarColor(msg.sender_name ?? "T")} size="xs" />
                )}
                <div className="flex flex-col">
                  <span className={`text-[11px] text-[#94a3b8] font-medium mb-1 px-1 ${isMe ? "text-right" : "text-left"}`}>
                    {msg.sender_name}
                  </span>
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
          {sendError && (
            <div className="flex items-center gap-1.5 text-[11px] text-red-500 mb-2 px-1">
              <AlertCircle className="w-3 h-3" />
              {sendError}
            </div>
          )}
          <div className="flex items-center gap-3 bg-white/70 border border-white/60 rounded-[14px] px-4 py-2.5 focus-within:border-[rgba(27,63,238,0.3)] focus-within:ring-2 focus-within:ring-[rgba(27,63,238,0.08)] transition-all">
            <input
              type="text"
              placeholder={placeholderText}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              className="flex-1 bg-transparent text-[13.5px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none font-sans"
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending || (activeTab === "dm" ? !recipientId : !projectId)}
              className="w-[36px] h-[36px] rounded-[10px] bg-[#1B3FEE] flex items-center justify-center cursor-pointer hover:bg-[#1535D4] transition-colors disabled:opacity-40 shadow-[0_2px_8px_rgba(27,63,238,0.25)] flex-shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-[11px] text-[#94a3b8] mt-2 text-center">{footerNote}</p>
        </div>
      </div>
    </div>
  );
}
