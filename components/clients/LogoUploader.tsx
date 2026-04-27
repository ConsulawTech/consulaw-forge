"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

interface LogoUploaderProps {
  currentLogoUrl?: string | null;
  clientName: string;
  onUpload?: (url: string) => void;
}

export function LogoUploader({ currentLogoUrl, clientName, onUpload }: LogoUploaderProps) {
  const supabase = createClient();
  const [preview, setPreview] = useState<string | null>(currentLogoUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!["image/jpeg", "image/png", "image/svg+xml"].includes(file.type)) {
      setError("Only JPG, PNG, or SVG files allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("File must be under 2MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      // Create local preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Get current user for folder path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/logo.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("client-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // Bucket might not exist yet — show helpful message
        if (uploadError.message.includes("bucket")) {
          throw new Error("Storage bucket not set up. Ask your team to run the storage setup.");
        }
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from("client-logos").getPublicUrl(filePath);

      // Update client record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("clients")
        .update({ logo_url: publicUrl })
        .eq("profile_id", user.id);

      if (updateError) throw new Error(updateError.message);

      setPreview(publicUrl);
      onUpload?.(publicUrl);
    } catch (err) {
      setError((err as Error).message);
      // Revert preview on error
      setPreview(currentLogoUrl ?? null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt={clientName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
            />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1B3FEE] text-white flex items-center justify-center cursor-pointer hover:bg-[#1535D4] transition-colors shadow-[0_2px_8px_rgba(27,63,238,0.3)] disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-2xl bg-[#1B3FEE] text-white text-xl font-black flex items-center justify-center cursor-pointer hover:bg-[#1535D4] transition-colors shadow-[0_4px_12px_rgba(27,63,238,0.3)] disabled:opacity-50 relative"
          >
            {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : getInitials(clientName)}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white text-[#1B3FEE] flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
              <Camera className="w-3.5 h-3.5" />
            </div>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/svg+xml"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {error && (
        <div className="text-[11px] text-red-500 bg-red-50 rounded-lg px-3 py-1.5 border border-red-100 max-w-[200px] text-center">
          {error}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="text-[11px]"
      >
        <Upload className="w-3 h-3" />
        {uploading ? "Uploading…" : preview ? "Change logo" : "Upload logo"}
      </Button>
    </div>
  );
}
