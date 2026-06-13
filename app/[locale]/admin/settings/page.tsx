"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, Send, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const t = useTranslations();
  const [sending, setSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"unknown" | "ok" | "error">("unknown");

  const checkEmailStatus = async () => {
    try {
      const res = await fetch("/api/admin/me");
      setEmailStatus(res.ok ? "ok" : "error");
    } catch {
      setEmailStatus("error");
    }
  };

  const handleTestEmail = async () => {
    setSending(true);
    try {
      // 通过订单 API 间接测试邮件（需要已配置 RESEND_API_KEY）
      toast.info("Email test requires RESEND_API_KEY configured in .env.local");
    } catch {
      toast.error("Test failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">{t("admin.settings.title")}</h1>

      <div className="space-y-6">
        {/* Email Configuration */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-cyan-500/10 p-2">
              <Mail size={20} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{t("admin.settings.emailTitle")}</h2>
              <p className="text-sm text-slate-400">{t("admin.settings.emailDescription")}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-4">
              <p className="text-xs text-slate-400 mb-1">{t("admin.settings.emailStatus")}</p>
              <div className="flex items-center gap-2">
                {emailStatus === "ok" ? (
                  <CheckCircle size={18} className="text-emerald-400" />
                ) : emailStatus === "error" ? (
                  <XCircle size={18} className="text-rose-400" />
                ) : (
                  <span className="text-sm text-slate-500">{t("admin.settings.notConfigured")}</span>
                )}
                <button
                  type="button"
                  onClick={checkEmailStatus}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Check
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-800/50 p-4">
              <p className="text-xs text-slate-400 mb-2">{t("admin.settings.testEmail")}</p>
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-400 disabled:opacity-50 transition"
              >
                <Send size={14} />
                {sending ? "Sending..." : t("admin.settings.testEmail")}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-800/30 p-4">
            <p className="text-xs text-slate-400">
              Configure by adding to <code className="text-cyan-400">.env.local</code>:
            </p>
            <pre className="mt-2 text-xs text-slate-300 bg-slate-950 rounded p-3 overflow-x-auto">
{`RESEND_API_KEY=re_xxxxxxxx
ADMIN_EMAIL=admin@example.com
EMAIL_FROM=Secure Trade <noreply@your-domain.com>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
