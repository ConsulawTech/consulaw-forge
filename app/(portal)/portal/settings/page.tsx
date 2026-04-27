"use client";

import { useState, useEffect } from "react";
import { User, Lock, Check, Loader2, ShieldCheck, LogOut, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { changePasswordAction } from "@/app/actions/settings";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

function PasswordField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••••••"
        required={required}
        className="w-full bg-white/70 border border-white/60 rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10 transition-all"
      />
    </div>
  );
}

export default function PortalSettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<{ full_name: string; email?: string } | null>(null);
  const [clientName, setClientName] = useState("");

  // Load profile + client info on mount
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase.from("clients").select("name").eq("profile_id", user.id).single(),
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProfile((p as any) ?? { full_name: user.email ?? "Client" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setClientName((c as any)?.name ?? "");
    })();
  }, [supabase]);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("currentPassword", passwordForm.currentPassword);
      fd.set("newPassword", passwordForm.newPassword);
      await changePasswordAction(fd);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 [scrollbar-width:thin]">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Settings</h1>
        <p className="text-[13px] text-[#475569] mt-0.5">Manage your profile and account security</p>
      </div>

      <div className="max-w-lg space-y-4">
        {/* Profile card */}
        <div className="glass rounded-2xl p-5 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[rgba(27,63,238,0.08)] flex items-center justify-center">
              <User className="w-4 h-4 text-[#1B3FEE]" />
            </div>
            <h3 className="text-[14px] font-bold text-[#0f172a]">Your Profile</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Company / Name</label>
              <div className="w-full bg-white/50 border border-white/40 rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#0f172a]">
                {clientName || profile?.full_name || "—"}
              </div>
            </div>
            <p className="text-[11px] text-[#94a3b8]">
              Your profile details are managed by your Consulaw Tech team. Contact them via Messages if anything needs updating.
            </p>
          </div>
        </div>

        {/* Change password */}
        <div className="glass rounded-2xl p-5 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[rgba(27,63,238,0.08)] flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#1B3FEE]" />
            </div>
            <h3 className="text-[14px] font-bold text-[#0f172a]">Change Account Password</h3>
          </div>
          <p className="text-[12px] text-[#94a3b8] mb-4">
            This password is shared across all Consulaw platforms — ConsulVault, Forge, and any future products on the same account.
          </p>

          {error && (
            <div className="text-[12.5px] text-red-500 bg-red-50/80 rounded-xl px-4 py-2 border border-red-100 mb-3">
              {error}
            </div>
          )}
          {success && (
            <div className="text-[12.5px] text-emerald-600 bg-emerald-50/80 rounded-xl px-4 py-2 border border-emerald-100 mb-3 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Password updated successfully.
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <PasswordField
              label="Current Password"
              value={passwordForm.currentPassword}
              onChange={(v) => setPasswordForm((f) => ({ ...f, currentPassword: v }))}
              required
            />
            <PasswordField
              label="New Password (min 10 chars)"
              value={passwordForm.newPassword}
              onChange={(v) => setPasswordForm((f) => ({ ...f, newPassword: v }))}
              required
            />
            <PasswordField
              label="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChange={(v) => setPasswordForm((f) => ({ ...f, confirmPassword: v }))}
              required
            />
            <div className="pt-1">
              <Button type="submit" variant="primary" loading={saving}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update Password"}
              </Button>
            </div>
          </form>
        </div>

        {/* Active session */}
        <div className="glass rounded-2xl p-5 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[rgba(16,185,129,0.08)] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#10b981]" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#0f172a]">Active Session</p>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">You are currently signed in on this device</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </Button>
          </div>
        </div>

        {/* Support */}
        <div className="glass rounded-2xl p-5 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl bg-[rgba(245,159,0,0.08)] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-[#f59f00]" />
            </div>
            <h3 className="text-[14px] font-bold text-[#0f172a]">Need Help?</h3>
          </div>
          <p className="text-[12.5px] text-[#475569] leading-relaxed">
            If you have any issues with your portal or need to update information only your team can change, reach out via the <a href="/portal/messages" className="text-[#1B3FEE] font-semibold hover:underline">Messages</a> page.
          </p>
        </div>
      </div>
    </div>
  );
}
