"use client";

import { useState, useRef } from "react";
import { Loader2, FileUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DocumentUploaderProps {
  projectId: string;
  onUpload?: () => void;
}

export function DocumentUploader({ projectId, onUpload }: DocumentUploaderProps) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError("File must be under 20MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const fileExt = file.name.split(".").pop() ?? "";
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${projectId}/${Date.now()}_${safeName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("project-documents")
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        if (uploadError.message.includes("bucket")) {
          throw new Error("Storage bucket not set up. Ask your admin to create the 'project-documents' bucket.");
        }
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from("project-documents").getPublicUrl(filePath);

      // Insert document record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (supabase as any)
        .from("documents")
        .insert({
          project_id: projectId,
          filename: file.name,
          file_url: publicUrl,
          file_type: file.type || fileExt,
          file_size: file.size,
          uploaded_by: user.id,
        });

      if (dbError) throw new Error(dbError.message);

      onUpload?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B3FEE] text-white text-[13px] font-semibold hover:bg-[#1535D4] transition-colors disabled:opacity-50 cursor-pointer"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
        {uploading ? "Uploading…" : "Upload Document"}
      </button>
      {error && (
        <p className="text-[11px] text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
