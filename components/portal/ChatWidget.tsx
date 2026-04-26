"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, FileText, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";
import { formatTime } from "@/lib/utils";

interface ChatWidgetProps {
  projectId: string;
  initialMessages: Message[];
}

export function ChatWidget({ projectId, initialMessages }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sender, setSender] = useState<{ id: string; name: string; role: string } | null>(null);
  const msgsRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch sender profile once on mount
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = profile as any;
      if (p) {
        setSender({ id: user.id, name: p.full_name ?? "User", role: p.role ?? "client" });
      }
    })();
  }, [supabase]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [projectId, supabase]);

  useEffect(() => {
    if (open && msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [open, messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    if (!sender) {
      setSendError("Unable to send — please sign in again.");
      return;
    }

    setSending(true);
    setSendError("");

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from("messages") as any).insert({
        project_id: projectId,
        sender_id: sender.id,
        sender_name: sender.name,
        sender_role: sender.role,
        content: text,
      });
      if (error) throw new Error(error.message);
      setInput("");
    } catch (err) {
      setSendError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-7 right-7 w-[52px] h-[52px] rounded-full bg-[#1B3FEE] flex items-center justify-center cursor-pointer z-50 shadow-[0_4px_20px_rgba(27,63,238,0.4)] hover:scale-[1.06] hover:shadow-[0_6px_24px_rgba(27,63,238,0.5)] transition-all duration-150"
        aria-label="Open chat"
      >
        {open
          ? <X className="w-5 h-5 text-white" />
          : <MessageSquare className="w-5 h-5 text-white" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-[92px] right-7 w-[320px] h-[420px] rounded-[20px] flex flex-col overflow-hidden z-50 animate-chat-in"
          style={{
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.14), 0 1px 0 rgba(255,255,255,0.9) inset",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3.5" style={{ background: "linear-gradient(135deg, #1B3FEE, #7b8ef5)" }}>
            <div className="w-7 h-7 rounded-[8px] bg-white/20 flex items-center justify-center flex-shrink-0">
              <FileText className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-white">Message Your Team</div>
              <div className="text-[11px] text-white/70 mt-0.5">Consulaw Tech · Forge</div>
            </div>
            <div className="w-[7px] h-[7px] rounded-full bg-[#2dc071] shadow-[0_0_0_2px_rgba(45,192,113,0.3)]" />
          </div>

          {/* Messages */}
          <div
            ref={msgsRef}
            className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2.5 [scrollbar-width:thin]"
          >
            {messages.length === 0 && (
              <div className="text-center text-[12px] text-[#94a3b8] mt-4">
                Send a message to start the conversation!
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.sender_role === "client";
              return (
                <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                  {!isMe && (
                    <span className="text-[10px] text-[#94a3b8] font-medium mb-1">{msg.sender_name}</span>
                  )}
                  <div
                    className="px-3 py-2 text-[12.5px] leading-[1.45]"
                    style={
                      isMe
                        ? { background: "#1B3FEE", color: "#fff", borderRadius: "14px 4px 14px 14px" }
                        : { background: "rgba(241,245,249,0.9)", color: "#0f172a", borderRadius: "4px 14px 14px 14px", border: "1px solid rgba(203,213,225,0.4)" }
                    }
                  >
                    {msg.content}
                  </div>
                  <span className={`text-[10px] text-[#94a3b8] mt-1 ${isMe ? "text-right" : "text-left"}`}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="flex flex-col gap-1 px-3 py-2.5 border-t border-[rgba(203,213,225,0.3)] bg-white/60">
            {sendError && (
              <div className="flex items-center gap-1 text-[10px] text-red-500 px-1">
                <AlertCircle className="w-2.5 h-2.5" />
                {sendError}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                className="flex-1 rounded-[10px] px-3 py-2 text-[12.5px] text-[#0f172a] placeholder:text-[#94a3b8] bg-white/80 border border-[rgba(203,213,225,0.5)] outline-none focus:border-[rgba(27,63,238,0.4)] focus:ring-2 focus:ring-[rgba(27,63,238,0.08)] transition-all font-sans"
              />
              <button
                onClick={send}
                disabled={!input.trim() || sending}
                className="w-[34px] h-[34px] rounded-[10px] bg-[#1B3FEE] flex items-center justify-center cursor-pointer hover:bg-[#1535D4] transition-colors disabled:opacity-50 shadow-[0_2px_8px_rgba(27,63,238,0.25)] flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
