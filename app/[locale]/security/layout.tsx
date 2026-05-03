import { ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function SecurityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("security");

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100"
      style={{
        backgroundImage:
          "radial-gradient(1200px 600px at 10% -10%, rgba(56,189,248,0.12), transparent 60%), radial-gradient(900px 450px at 90% 0%, rgba(244,63,94,0.10), transparent 60%), linear-gradient(to bottom, #020617, #0f172a)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-lg backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
              <ShieldCheck size={18} />
            </span>
            <div>
              <h1 className="text-lg font-bold text-white sm:text-xl">
                {t("headline")}
              </h1>
              <p className="text-xs text-slate-400">{t("subhead")}</p>
            </div>
          </div>
        </header>

        <div className="mt-6 space-y-6">{children}</div>
      </div>
    </div>
  );
}
