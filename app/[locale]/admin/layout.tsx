import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import AdminSidebar from "@/components/admin/AdminSidebar";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;

  // 验证 locale
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    return null;
  }

  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
