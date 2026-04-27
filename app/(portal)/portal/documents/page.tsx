"use client";

import { useState, useEffect } from "react";
import { FolderOpen, FileText, Upload, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DocumentFile {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export default function PortalDocumentsPage() {
  const supabase = createClient();
  const [clientName, setClientName] = useState("");
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: client } = await supabase
        .from("clients")
        .select("name")
        .eq("profile_id", user.id)
        .single();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setClientName((client as any)?.name ?? "");

      // TODO: Fetch actual documents from Supabase Storage once bucket is set up
      // For now, show placeholder state
      setDocuments([]);
      setLoading(false);
    })();
  }, [supabase]);

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 [scrollbar-width:thin]">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Documents</h1>
        <p className="text-[13px] text-[#475569] mt-0.5">
          Files and deliverables shared by your Consulaw Tech team
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-[#1B3FEE] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(27,63,238,0.08)] flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-7 h-7 text-[#1B3FEE]" />
          </div>
          <div className="text-[15px] font-bold text-[#0f172a] mb-1.5">No documents yet</div>
          <p className="text-[13px] text-[#94a3b8] max-w-sm mx-auto leading-relaxed">
            Your team hasn&apos;t shared any files yet. Documents, contracts, and deliverables will appear here once they&apos;re uploaded.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {documents.map((doc, i) => (
            <div
              key={i}
              className="glass rounded-2xl p-4 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[rgba(27,63,238,0.08)] flex items-center justify-center flex-shrink-0 group-hover:bg-[rgba(27,63,238,0.12)] transition-colors">
                  <FileText className="w-5 h-5 text-[#1B3FEE]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#0f172a] truncate">{doc.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-[#94a3b8]">{formatFileSize(doc.size)}</span>
                    <span className="text-[11px] text-[#94a3b8]">·</span>
                    <span className="text-[11px] text-[#94a3b8]">{doc.type}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-[11px] text-[#94a3b8]">
                    <Clock className="w-3 h-3" />
                    {doc.uploadedAt}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload hint */}
      <div className="mt-6 glass rounded-2xl p-5 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(27,63,238,0.08)] flex items-center justify-center flex-shrink-0">
            <Upload className="w-5 h-5 text-[#1B3FEE]" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[#0f172a]">Upload files</div>
            <p className="text-[12px] text-[#94a3b8] mt-0.5">
              File upload coming soon. For now, share files with your team via the Messages page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
