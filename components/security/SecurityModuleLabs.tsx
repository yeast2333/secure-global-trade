"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export default function SecurityModuleLabs() {
  const t = useTranslations("security.lab");
  const locale = useLocale();
  const [xssProbeUrl, setXssProbeUrl] = useState("");

  useEffect(() => {
    setXssProbeUrl(
      `${window.location.origin}/${locale}?security-xss-probe=${encodeURIComponent("<script>")}`,
    );
  }, [locale]);

  return (
    <section className="mt-10 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">{t("title")}</h2>
        <p className="mt-1 text-sm text-slate-400">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BruteLab />
        <XssLab probeUrl={xssProbeUrl} />
        <PasswordLab />
        <InjectionLab />
      </div>

      <p className="text-center text-[11px] text-slate-500">
        <Link href="/" className="text-cyan-400 hover:underline">
          {t("backHome")}
        </Link>
      </p>
    </section>
  );
}

function BruteLab() {
  const t = useTranslations("security.lab.bruteforce");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      let last = 0;
      for (let i = 0; i < 6; i++) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: `security-lab-${i}@demo.invalid`,
            password: "wrong-password",
          }),
        });
        last = res.status;
      }
      if (last === 429) {
        toast.success(t("toastRateLimited"));
      } else {
        toast.message(t("toastFinished", { last: String(last) }));
      }
    } catch {
      toast.error(t("toastError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      id="lab-bruteforce"
      className="scroll-mt-24 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5"
    >
      <h3 className="text-sm font-semibold text-amber-200">{t("heading")}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{t("body")}</p>
      <button
        type="button"
        disabled={busy}
        onClick={run}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-100 ring-1 ring-amber-500/40 hover:bg-amber-500/30 disabled:opacity-50"
      >
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {busy ? t("running") : t("cta")}
      </button>
    </article>
  );
}

function XssLab({ probeUrl }: { probeUrl: string }) {
  const t = useTranslations("security.lab.xss");

  return (
    <article
      id="lab-xss"
      className="scroll-mt-24 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5"
    >
      <h3 className="text-sm font-semibold text-rose-200">{t("heading")}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{t("body")}</p>
      {probeUrl ? (
        <a
          href={probeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-rose-500/15 px-4 py-2 text-xs font-semibold text-rose-100 ring-1 ring-rose-500/35 hover:bg-rose-500/25"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t("cta")}
        </a>
      ) : (
        <p className="mt-4 text-xs text-slate-500">{t("loadingLink")}</p>
      )}
    </article>
  );
}

function PasswordLab() {
  const t = useTranslations("security.lab.password");
  const [email, setEmail] = useState("demo@secure-trade.local");
  const [password, setPassword] = useState("definitely-wrong");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (res.status === 401 && data.error === "INVALID_CREDENTIALS") {
        toast.success(t("toastAuthFailureLogged"));
      } else if (res.status === 429) {
        toast.warning(t("toastRateLimited"));
      } else if (res.status === 422) {
        toast.error(t("toastValidation"));
      } else {
        toast.message(t("toastOther", { code: String(res.status) }));
      }
    } catch {
      toast.error(t("toastError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      id="lab-password"
      className="scroll-mt-24 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5"
    >
      <h3 className="text-sm font-semibold text-cyan-200">{t("heading")}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{t("body")}</p>
      <div className="mt-4 space-y-2">
        <label className="block text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {t("email")}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-cyan-500/30 focus:ring-2"
          />
        </label>
        <label className="block text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {t("password")}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none ring-cyan-500/30 focus:ring-2"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={submit}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-100 ring-1 ring-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-50"
      >
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {busy ? t("running") : t("cta")}
      </button>
      <p className="mt-3 text-[10px] text-slate-500">{t("hint")}</p>
    </article>
  );
}

function InjectionLab() {
  const t = useTranslations("security.lab.injection");
  const [raw, setRaw] = useState("1' OR '1'='1");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/security/injection-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: raw }),
      });
      if (res.status === 422) {
        toast.success(t("toastBlocked"));
      } else if (res.ok) {
        toast.message(t("toastAccepted"));
      } else {
        toast.error(t("toastError", { code: String(res.status) }));
      }
    } catch {
      toast.error(t("toastNetwork"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      id="lab-injection"
      className="scroll-mt-24 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-5"
    >
      <h3 className="text-sm font-semibold text-emerald-200">{t("heading")}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{t("body")}</p>
      <label className="mt-4 block text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {t("field")}
        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white outline-none ring-emerald-500/30 focus:ring-2"
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={submit}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-500/40 hover:bg-emerald-500/30 disabled:opacity-50"
      >
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {busy ? t("running") : t("cta")}
      </button>
      <p className="mt-3 text-[10px] text-slate-500">{t("hint")}</p>
    </article>
  );
}
