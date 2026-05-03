"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createProposalAction } from "@/app/actions/proposals";
import { slugify } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  clientName: string | null;
}

export function CreateProposalForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [html, setHtml] = useState("");
  const [fileName, setFileName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = useCallback(
    (val: string) => {
      setTitle(val);
      if (!slugEdited) setSlug(slugify(val));
    },
    [slugEdited]
  );

  const handleSlugChange = useCallback((val: string) => {
    setSlugEdited(true);
    setSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".html") && file.type !== "text/html") {
      setError("Only .html files are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large. Maximum size is 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setHtml(ev.target?.result as string);
      setFileName(file.name);
      setError("");
    };
    reader.readAsText(file);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!html.trim()) {
      setError("HTML content is required. Upload a file or paste HTML below.");
      return;
    }
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.append("title", title);
    fd.append("slug", slug);
    fd.append("html", html);
    if (projectId) fd.append("project_id", projectId);
    if (recipientEmail) fd.append("recipient_email", recipientEmail);
    const result = await createProposalAction(fd);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push("/proposals");
  }

  const inputCls =
    "w-full px-3 py-2.5 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10 text-[#0f172a] placeholder:text-[#94a3b8]";

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 flex flex-col gap-5">
      {error && (
        <div className="text-[12.5px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12.5px] font-semibold text-[#0f172a]">Proposal Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
          placeholder="e.g. Bat & Bat Website Redesign"
          className={inputCls}
        />
      </div>

      {/* Slug */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12.5px] font-semibold text-[#0f172a]">
          URL Slug{" "}
          <span className="text-[#94a3b8] font-normal">(auto-generated, editable)</span>
        </label>
        <div className="flex items-center gap-0 rounded-xl overflow-hidden border border-white/50 focus-within:border-[#1B3FEE]/40 focus-within:ring-2 focus-within:ring-[#1B3FEE]/10 bg-white/60">
          <span className="text-[12px] text-[#94a3b8] px-3 py-2.5 border-r border-white/50 bg-white/40 flex-shrink-0 whitespace-nowrap">
            forge.consulawtech.com/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            required
            pattern="[a-z0-9-]+"
            placeholder="batandbat-website"
            className="flex-1 px-3 py-2.5 text-[13px] bg-transparent outline-none text-[#0f172a] placeholder:text-[#94a3b8]"
          />
        </div>
      </div>

      {/* Project */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12.5px] font-semibold text-[#0f172a]">
          Link to Project{" "}
          <span className="text-[#94a3b8] font-normal">(optional)</span>
        </label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className={inputCls}
        >
          <option value="">— No project —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.clientName ? ` · ${p.clientName}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Recipient email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12.5px] font-semibold text-[#0f172a]">
          Recipient Email{" "}
          <span className="text-[#94a3b8] font-normal">(optional — can also be set when sending)</span>
        </label>
        <input
          type="email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="client@example.com"
          className={inputCls}
        />
      </div>

      {/* HTML upload */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12.5px] font-semibold text-[#0f172a]">HTML Content</label>

        <div
          className="border-2 border-dashed border-[rgba(27,63,238,0.2)] rounded-xl p-5 text-center cursor-pointer hover:border-[rgba(27,63,238,0.4)] hover:bg-[rgba(27,63,238,0.02)] transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,text/html"
            className="hidden"
            onChange={handleFileUpload}
          />
          {html && fileName ? (
            <p className="text-[13px]">
              <span className="text-[#10b981] font-semibold">{fileName}</span>{" "}
              <span className="text-[#94a3b8]">({(html.length / 1024).toFixed(1)} KB loaded)</span>
              <span className="text-[#1B3FEE] font-semibold"> · Click to replace</span>
            </p>
          ) : (
            <p className="text-[13px] text-[#475569]">
              <span className="text-[#1B3FEE] font-semibold">Click to upload</span> an .html file
            </p>
          )}
        </div>

        <p className="text-[11px] text-[#94a3b8] text-center">— or paste HTML directly —</p>

        <textarea
          value={html}
          onChange={(e) => { setHtml(e.target.value); setFileName(""); }}
          placeholder={"<!DOCTYPE html>\n<html>...</html>"}
          rows={10}
          className={`${inputCls} font-mono text-[11.5px] resize-y min-h-[180px]`}
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => router.push("/proposals")}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1" loading={loading}>
          {loading ? "Creating…" : "Create Proposal"}
        </Button>
      </div>
    </form>
  );
}
