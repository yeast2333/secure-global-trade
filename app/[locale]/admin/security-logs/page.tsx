"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Wifi, WifiOff } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase";

type SecurityLog = {
  id: string;
  created_at: string;
  event_type: string;
  attack_type: string;
  payload: string;
  client_ip: string;
  severity: string;
  defense_level: string | null;
  matched_rule: string | null;
  verdict: string;
};

const PAGE_SIZE = 30;

const ATTACK_TYPES = [
  "",
  "brute_force_attempt",
  "xss_probe",
  "auth_failure_login",
  "schema_validation_failed",
];

const SEVERITIES = ["", "low", "medium", "high"];

const severityColors: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  high: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

const verdictColors: Record<string, string> = {
  blocked: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  allowed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  flagged: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

export default function AdminSecurityLogsPage() {
  const t = useTranslations();

  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [attackType, setAttackType] = useState("");
  const [severity, setSeverity] = useState("");
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (attackType) params.set("attack_type", attackType);
      if (severity) params.set("severity", severity);

      const res = await fetch(`/api/admin/security-logs?${params}`);
      const data = await res.json();
      if (data.ok) {
        setLogs(data.data);
        setTotal(data.total);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, attackType, severity]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Realtime subscription
  useEffect(() => {
    if (!live) {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("admin_security_logs_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_logs" },
        (payload) => {
          const newLog = payload.new as SecurityLog;
          setLogs((prev) => [newLog, ...prev.slice(0, PAGE_SIZE - 1)]);
          setTotal((prev) => prev + 1);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [live]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">{t("admin.securityLogs.title")}</h1>
        <button
          type="button"
          onClick={() => setLive((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            live
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-slate-600 bg-slate-800 text-slate-400"
          }`}
        >
          {live ? <Wifi size={12} /> : <WifiOff size={12} />}
          {live ? t("admin.securityLogs.live") : t("admin.securityLogs.pause")}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={attackType}
          onChange={(e) => { setAttackType(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none"
        >
          <option value="">{t("admin.securityLogs.filterType")}</option>
          {ATTACK_TYPES.filter(Boolean).map((at) => (
            <option key={at} value={at}>{at}</option>
          ))}
        </select>
        <select
          value={severity}
          onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none"
        >
          <option value="">{t("admin.securityLogs.filterSeverity")}</option>
          {SEVERITIES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-800 bg-slate-900/50">
            <tr>
              <th className="px-3 py-2 text-slate-400 font-medium">{t("admin.securityLogs.time")}</th>
              <th className="px-3 py-2 text-slate-400 font-medium">{t("admin.securityLogs.type")}</th>
              <th className="px-3 py-2 text-slate-400 font-medium">{t("admin.securityLogs.ip")}</th>
              <th className="px-3 py-2 text-slate-400 font-medium">{t("admin.securityLogs.severity")}</th>
              <th className="px-3 py-2 text-slate-400 font-medium">{t("admin.securityLogs.verdict")}</th>
              <th className="px-3 py-2 text-slate-400 font-medium">{t("admin.securityLogs.payload")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={6} className="px-3 py-12 text-center text-slate-500">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-12 text-center text-slate-500">{t("admin.securityLogs.noLogs")}</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/30 transition">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400">
                      {log.attack_type}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-[10px] text-slate-400">
                    {log.client_ip}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${severityColors[log.severity] ?? "bg-slate-500/10 text-slate-400 border-slate-500/30"}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${verdictColors[log.verdict] ?? "bg-slate-500/10 text-slate-400 border-slate-500/30"}`}>
                      {log.verdict}
                    </span>
                  </td>
                  <td className="max-w-48 truncate px-3 py-2 text-[10px] text-slate-500">
                    {log.payload}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>{total} events</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-md p-1 hover:bg-slate-800 disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <span>{page} / {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-md p-1 hover:bg-slate-800 disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
