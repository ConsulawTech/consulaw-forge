"use client";

import { useState, useEffect } from "react";
import { User, Lock, Check, Loader2, ShieldCheck, LogOut, Eye, EyeOff } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { saveProfileAction, changePasswordAction } from "@/app/actions/settings";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  full_name: string;
  job_title: string | null;
  role: string;
  avatar_color: string;
  initials: string | null;
}

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, job_title, role, avatar_color, initials")
        .eq("id", user.id)
        .single();
      setProfile(data ?? null);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
        <div className="mb-5">
          <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Settings</h1>
          <p className="text-[13px] text-[#475569] mt-0.5">Manage your profile and account security</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-5 glass rounded-[12px] p-[3px] w-fit border border-white/50">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={
                tab === id
                  ? "flex items-center gap-1.5 px-4 py-[7px] rounded-[9px] text-[13px] font-semibold text-[#0f172a] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)] cursor-pointer transition-all"
                  : "flex items-center gap-1.5 px-4 py-[7px] rounded-[9px] text-[13px] font-medium text-[#475569] cursor-pointer hover:text-[#0f172a] transition-all"
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-[#94a3b8]" />
          </div>
        ) : (
          <>
            {tab === "profile" && <ProfileTab profile={profile} onUpdate={setProfile} />}
            {tab === "security" && <SecurityTab />}
          </>
        )}
      </div>
    </div>
  );
}

function ProfileTab({
  profile,
  onUpdate,
}: {
  profile: Profile | null;
  onUpdate: (p: Profile) => void;
}) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [jobTitle, setJobTitle] = useState(profile?.job_title ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("full_name", fullName);
      fd.set("job_title", jobTitle);
      await saveProfileAction(fd);
      if (profile) onUpdate({ ...profile, full_name: fullName, job_title: jobTitle });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <div className="glass rounded-2xl p-5 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        {/* Avatar preview */}
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/50">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-[18px] font-bold flex-shrink-0"
            style={{ background: profile?.avatar_color ?? "#1B3FEE" }}
          >
            {initials || "?"}
          </div>
          <div>
            <div className="text-[15px] font-bold text-[#0f172a]">{fullName || "—"}</div>
            <div className="text-[12px] text-[#94a3b8] mt-0.5 capitalize">{profile?.role ?? "team"}</div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="text-[12.5px] text-red-500 bg-red-50/80 rounded-xl px-4 py-2 border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full bg-white/70 border border-white/60 rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10 transition-all"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full bg-white/70 border border-white/60 rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10 transition-all"
              placeholder="e.g. Senior Associate"
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" variant="primary" loading={saving}>
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saved ? (
                <><Check className="w-3.5 h-3.5" /> Saved</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SecurityTab() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      fd.set("currentPassword", form.currentPassword);
      fd.set("newPassword", form.newPassword);
      await changePasswordAction(fd);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="max-w-lg space-y-4">
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
            value={form.currentPassword}
            onChange={(v) => setForm((f) => ({ ...f, currentPassword: v }))}
            required
          />
          <PasswordField
            label="New Password (min 10 chars)"
            value={form.newPassword}
            onChange={(v) => setForm((f) => ({ ...f, newPassword: v }))}
            required
          />
          <PasswordField
            label="Confirm New Password"
            value={form.confirmPassword}
            onChange={(v) => setForm((f) => ({ ...f, confirmPassword: v }))}
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
    </div>
  );
}

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
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-[12px] font-semibold text-[#475569] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••••••"
          required={required}
          className="w-full bg-white/70 border border-white/60 rounded-[10px] px-3.5 py-2.5 pr-10 text-[13px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10 transition-all"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
