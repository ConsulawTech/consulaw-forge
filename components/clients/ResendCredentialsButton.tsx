"use client";

import { useState } from "react";
import { Send, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
      <Button variant="success" size="md" disabled>
        <Check className="w-3.5 h-3.5" />
        Email sent
      </Button>
    );
  }

  if (state === "error") {
    return (
      <Button variant="danger" size="md" onClick={handleClick} title={errorMsg}>
        <Send className="w-3.5 h-3.5" />
        Retry
      </Button>
    );
  }

  return (
    <Button variant="secondary" size="md" onClick={handleClick} loading={state === "loading"}>
      <Send className="w-3.5 h-3.5" />
      {state === "loading" ? "Sending…" : "Resend Login Details"}
    </Button>
  );
}
