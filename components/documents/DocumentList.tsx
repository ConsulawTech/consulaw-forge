"use client";

import { FileText, Download, Trash2 } from "lucide-react";

interface Document {
  id: string;
  filename: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function DocumentList({
  documents,
  showDelete,
  onDelete,
}: {
  documents: Document[];
  showDelete?: boolean;
  onDelete?: (id: string) => void;
}) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[13px] text-slate-400">No documents yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50/60 hover:bg-slate-50 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-[rgba(27,63,238,0.08)] flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-[#1B3FEE]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-slate-800 truncate">{doc.filename}</div>
            <div className="flex items-center gap-2 mt-0.5">
              {doc.file_size ? (
                <span className="text-[11px] text-slate-400">{formatFileSize(doc.file_size)}</span>
              ) : null}
              <span className="text-[11px] text-slate-400">{formatDate(doc.created_at)}</span>
            </div>
          </div>
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0"
            title="Download"
          >
            <Download className="w-4 h-4 text-slate-500" />
          </a>
          {showDelete && onDelete && (
            <button
              onClick={() => onDelete(doc.id)}
              className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
