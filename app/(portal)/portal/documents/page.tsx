"use client";

import { useState, useEffect } from "react";
import { FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentList } from "@/components/documents/DocumentList";

interface Project {
  id: string;
  name: string;
}

interface DocumentItem {
  id: string;
  filename: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
  project_id: string;
}

export default function PortalDocumentsPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Fetch on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // Get client's projects
      const { data: clientRaw } = await supabase
        .from("clients")
        .select("id, projects(id, name)")
        .eq("profile_id", user.id)
        .single();

      const client = clientRaw as { id: string; projects: { id: string; name: string }[] } | null;
      const clientProjects: Project[] = (client?.projects ?? []).map((p) => ({
        id: p.id,
        name: p.name,
      }));

      if (cancelled) return;
      setProjects(clientProjects);

      if (clientProjects.length > 0) {
        const projectIds = clientProjects.map((p) => p.id);
        setSelectedProjectId(projectIds[0]);

        // Fetch documents for all client projects
        const { data: docs } = await supabase
          .from("documents")
          .select("*")
          .in("project_id", projectIds)
          .order("created_at", { ascending: false });

        if (!cancelled) setDocuments(docs ?? []);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [supabase]);

  async function refresh() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: clientRaw } = await supabase
      .from("clients")
      .select("id, projects(id, name)")
      .eq("profile_id", user.id)
      .single();

    const client = clientRaw as { id: string; projects: { id: string; name: string }[] } | null;
    const clientProjects: Project[] = (client?.projects ?? []).map((p) => ({
      id: p.id,
      name: p.name,
    }));

    if (clientProjects.length > 0) {
      const projectIds = clientProjects.map((p) => p.id);
      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .in("project_id", projectIds)
        .order("created_at", { ascending: false });
      setDocuments(docs ?? []);
    }
  }

  const filteredDocuments = selectedProjectId
    ? documents.filter((d) => d.project_id === selectedProjectId)
    : documents;

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 [scrollbar-width:thin]">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Documents</h1>
        <p className="text-[13px] text-[#475569] mt-0.5">
          Files and deliverables for your projects
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-[#1B3FEE] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[rgba(27,63,238,0.08)] flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-7 h-7 text-[#1B3FEE]" />
          </div>
          <div className="text-[15px] font-bold text-[#0f172a] mb-1.5">No projects yet</div>
          <p className="text-[13px] text-[#94a3b8] max-w-sm mx-auto leading-relaxed">
            Your team hasn&apos;t assigned any projects yet. Documents will appear here once projects are set up.
          </p>
        </div>
      ) : (
        <>
          {/* Project selector */}
          {projects.length > 1 && (
            <div className="glass rounded-2xl p-4 mb-5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-[0.07em] text-[#94a3b8]">Project</span>
                <div className="flex gap-2 flex-wrap">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className={`px-3 py-1.5 rounded-[10px] text-[12px] font-semibold border transition-all cursor-pointer ${
                        selectedProjectId === p.id
                          ? "bg-[rgba(27,63,238,0.08)] text-[#1B3FEE] border-[rgba(27,63,238,0.2)]"
                          : "bg-white/65 text-[#475569] border-white/60 hover:bg-white/85"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Upload + List */}
          <div className="glass rounded-2xl p-5 border border-white/50 mb-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <span className="text-[14px] font-bold text-[#0f172a]">
                  {selectedProject?.name ?? "Documents"}
                </span>
                <span className="text-[12px] text-[#94a3b8] ml-2">
                  {filteredDocuments.length} file{filteredDocuments.length !== 1 ? "s" : ""}
                </span>
              </div>
              {selectedProjectId && (
                <DocumentUploader projectId={selectedProjectId} onUpload={refresh} />
              )}
            </div>
            <DocumentList documents={filteredDocuments} />
          </div>
        </>
      )}
    </div>
  );
}
