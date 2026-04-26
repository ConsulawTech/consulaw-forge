"use client";

import { useState } from "react";
import { Send, Check, Loader2 } from "lucide-react";
import { resendClientCredentialsAction } from "@/app/actions/clients";

export function ResendCredentialsButton({ clientId }: { clientId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClick() {
    setState("loading");
    setErrorMsg("");
    const result = await resendClientCredentialsAction(clientId);
    if (result.success) {
      setState("sent");
      setTimeout(() => setState("idle"), 4000);
    } else {
      setState("error");
      setErrorMsg(result.error);
      setTimeout(() => setState("idle"), 5000);
    }
  }

  if (state === "sent") {
    return (
      <button
        disabled
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold bg-[rgba(16,185,129,0.1)] text-[#10b981] border border-[rgba(16,185,129,0.2)] cursor-default"
      >
        <Check className="w-3.5 h-3.5" />
        Email sent
      </button>
    );
  }

  if (state === "error") {
    return (
      <button
        onClick={handleClick}
        title={errorMsg}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold bg-[rgba(239,68,68,0.08)] text-[#ef4444] border border-[rgba(239,68,68,0.2)] cursor-pointer hover:bg-[rgba(239,68,68,0.14)] transition-colors"
      >
        <Send className="w-3.5 h-3.5" />
        Retry
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold bg-white/65 border border-white/60 text-[#475569] hover:bg-white/85 cursor-pointer transition-colors disabled:opacity-60"
    >
      {state === "loading" ? (
        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
      ) : (
        <><Send className="w-3.5 h-3.5" /> Resend Login Details</>
      )}
    </button>
  );
}
