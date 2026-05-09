"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Database,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { createSupabaseBrowserClient } from "@/lib/supabase";

// =============================================================
// 安全模块 · 实时状态看板
//   - 仅显示三项指标：在线/离线 · 拦截次数 · 当前加密强度
//   - 数据来源：Supabase security_logs 表
//   - 实时性：postgres_changes INSERT 订阅；另设短周期轮询 + 页签可见时刷新，避免未加入 Realtime publication 时数字卡 0
//   - 注入预防说明：所有查询走 Supabase Client `.eq("event_type", "...")`，
//     永远不拼接 SQL；安全 100% 由参数化查询 + RLS 保证
// =============================================================

type ModuleId = "bruteforce" | "xss" | "password" | "injection";

type ModuleDefinition = {
  id: ModuleId;
  icon: LucideIcon;
  accent: string;
  ring: string;
  badge: string;
  eventType: string;
};

const MODULES: ModuleDefinition[] = [
  {
    id: "bruteforce",
    icon: Activity,
    accent: "from-amber-400/30 to-orange-500/10",
    ring: "ring-amber-400/40",
    badge: "bg-amber-500/15 text-amber-200 border-amber-400/30",
    eventType: "Brute-force Attempt",
  },
  {
    id: "xss",
    icon: ShieldCheck,
    accent: "from-rose-500/30 to-fuchsia-500/10",
    ring: "ring-rose-400/40",
    badge: "bg-rose-500/15 text-rose-200 border-rose-400/30",
    eventType: "XSS Attack",
  },
  {
    id: "password",
    icon: KeyRound,
    accent: "from-cyan-400/30 to-sky-500/10",
    ring: "ring-cyan-400/40",
    badge: "bg-cyan-500/15 text-cyan-200 border-cyan-400/30",
    eventType: "Auth Failure",
  },
  {
    id: "injection",
    icon: Database,
    accent: "from-emerald-400/30 to-teal-500/10",
    ring: "ring-emerald-400/40",
    badge: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
    eventType: "Schema Validation",
  },
];

type Counts = Record<ModuleId, number>;
type ConnectionState = "connecting" | "online" | "offline";

const INITIAL_COUNTS: Counts = {
  bruteforce: 0,
  xss: 0,
  password: 0,
  injection: 0,
};

export default function StatusDashboard() {
  const t = useTranslations("security.status");

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [counts, setCounts] = useState<Counts>(INITIAL_COUNTS);
  const [state, setState] = useState<ConnectionState>("connecting");
  const [recentlyHit, setRecentlyHit] = useState<Partial<Record<ModuleId, number>>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;

    const loadCounts = async () => {
      try {
        const queries = await Promise.all(
          MODULES.map((m) =>
            supabase
              .from("security_logs")
              .select("*", { count: "exact", head: true })
              .eq("event_type", m.eventType),
          ),
        );

        if (cancelled) return;

        const next: Counts = { ...INITIAL_COUNTS };
        let hadError = false;
        let cursor = 0;
        for (const m of MODULES) {
          const { error, count } = queries[cursor++];
          if (error) {
            hadError = true;
            continue;
          }
          next[m.id] = count ?? 0;
        }

        setCounts(next);
        setState(hadError ? "offline" : "online");
      } catch (cause) {
        console.error("[status-dashboard] load failed", cause);
        if (!cancelled) setState("offline");
      }
    };

    loadCounts();

    // Fallback: Realtime 未生效时，仍通过轮询保证拦截计数可见更新。
    const pollId = window.setInterval(() => {
      void loadCounts();
    }, 6000);

    // 用户切回当前页签时立即刷新，避免后台挂起导致数字滞后。
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void loadCounts();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const channel = supabase
      .channel("status_dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_logs" },
        (payload) => {
          const row = payload.new as { event_type?: string };
          const target = MODULES.find((m) => m.eventType === row.event_type);
          if (!target) return;
          setCounts((prev) => ({ ...prev, [target.id]: prev[target.id] + 1 }));
          // 触发该卡片的脉冲高亮
          const ticket = Date.now();
          setRecentlyHit((prev) => ({ ...prev, [target.id]: ticket }));
          setTimeout(() => {
            setRecentlyHit((prev) =>
              prev[target.id] === ticket ? { ...prev, [target.id]: 0 } : prev,
            );
          }, 1800);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setState("online");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
          setState("offline");
      });

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <section className="rounded-3xl border border-slate-800/60 bg-slate-950/60 p-6 shadow-[0_30px_80px_rgba(8,47,73,0.35)] backdrop-blur">
      <header>
        <h2 className="text-xl font-bold text-white">{t("headline")}</h2>
        <p className="mt-1 text-sm text-slate-400">{t("subhead")}</p>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {MODULES.map((m) => (
          <ModuleCard
            key={m.id}
            module={m}
            count={counts[m.id]}
            state={state}
            highlighted={Boolean(recentlyHit[m.id])}
          />
        ))}
      </div>

      {state === "offline" && (
        <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2 text-[11px] text-amber-200">
          {t("stale")}
        </p>
      )}
    </section>
  );
}

function ModuleCard({
  module: m,
  count,
  state,
  highlighted,
}: {
  module: ModuleDefinition;
  count: number;
  state: ConnectionState;
  highlighted: boolean;
}) {
  const t = useTranslations("security.status");
  const tModule = useTranslations(`security.status.modules.${m.id}`);
  const Icon = m.icon;

  const statusLabel =
    state === "online"
      ? t("state.online")
      : state === "connecting"
        ? t("state.connecting")
        : t("state.offline");

  const statusDot =
    state === "online"
      ? "bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]"
      : state === "connecting"
        ? "bg-slate-400 shadow-[0_0_0_4px_rgba(148,163,184,0.18)]"
        : "bg-rose-400 shadow-[0_0_0_4px_rgba(244,63,94,0.18)]";

  return (
    <article
      id={`card-${m.id}`}
      className={`relative overflow-hidden scroll-mt-24 rounded-2xl border border-slate-800/70 bg-gradient-to-br ${m.accent} p-5 ring-1 ${m.ring} transition ${
        highlighted ? "animate-pulse-glow" : ""
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(120% 60% at 0% 0%, rgba(255,255,255,0.06), transparent 60%)",
        }}
      />

      <header className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${m.badge}`}
          >
            <Icon size={18} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {tModule("title")}
            </h3>
            <p className="text-[10.5px] uppercase tracking-[0.18em] text-slate-400">
              {tModule("tagline")}
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${m.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
          {statusLabel}
        </span>
      </header>

      <dl className="relative mt-5 grid gap-3 text-sm">
        <div className="flex items-baseline justify-between border-t border-slate-800/60 pt-3">
          <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            {t("labels.status")}
          </dt>
          <dd className="text-sm font-semibold text-white">{statusLabel}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-slate-800/60 pt-3">
          <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            {t("labels.blocked")}
          </dt>
          <dd className="font-mono text-2xl font-bold tabular-nums text-white">
            {count.toLocaleString()}
          </dd>
        </div>
        <div className="flex flex-col gap-1 border-t border-slate-800/60 pt-3">
          <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
            {t("labels.strength")}
          </dt>
          <dd className="text-xs leading-relaxed text-slate-200">
            {tModule("strength")}
          </dd>
        </div>
      </dl>
    </article>
  );
}
