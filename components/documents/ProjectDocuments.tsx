"use client";

import { useState, useCallback } from "react";
import { FileText } from "lucide-react";
import { DocumentUploader } from "./DocumentUploader";
import { DocumentList } from "./DocumentList";
import { createClient } from "@/lib/supabase/client";

interface DocumentItem {
  id: string;
  filename: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

export function ProjectDocuments({
  projectId,
  initialDocuments,
}: {
  projectId: string;
  initialDocuments: DocumentItem[];
}) {
  const supabase = createClient();
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);

  const refresh = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("documents")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setDocuments(data ?? []);
  }, [supabase, projectId]);

  async function handleDelete(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("documents").delete().eq("id", id);
    if (!error) refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="text-[15px] font-bold text-slate-900">Documents</span>
          <span className="text-[12px] text-slate-400">
            {documents.length} file{documents.length !== 1 ? "s" : ""}
          </span>
        </div>
        <DocumentUploader projectId={projectId} onUpload={refresh} />
      </div>
      <DocumentList documents={documents} showDelete onDelete={handleDelete} />
    </div>
  );
}
