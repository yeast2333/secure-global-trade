"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Search, ChevronLeft, ChevronRight, Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";

type User = {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
};

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const t = useTranslations();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", String(PAGE_SIZE));
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.ok) {
        setUsers(data.data);
        setTotal(data.total);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleAdmin = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAdmin: !user.is_admin }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(t("admin.users.adminUpdated"));
        fetchUsers();
      } else {
        toast.error(data.error ?? "Update failed");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">{t("admin.users.title")}</h1>

      <div className="mb-4">
        <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 w-64">
          <Search size={14} className="text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("admin.users.search")}
            className="ml-2 w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/50">
            <tr>
              <th className="px-4 py-3 text-slate-400 font-medium">{t("admin.users.email")}</th>
              <th className="px-4 py-3 text-slate-400 font-medium">{t("admin.users.admin")}</th>
              <th className="px-4 py-3 text-slate-400 font-medium">{t("admin.users.registeredAt")}</th>
              <th className="px-4 py-3 text-right text-slate-400 font-medium">{t("admin.users.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-500">{t("admin.users.noUsers")}</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-900/30 transition">
                  <td className="px-4 py-3">
                    <span className="text-slate-200">{user.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_admin ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/30">
                        <Shield size={10} />
                        {t("admin.users.yes")}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">{t("admin.users.no")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleAdmin(user)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        user.is_admin
                          ? "border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                          : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                      }`}
                    >
                      {user.is_admin ? (
                        <><ShieldOff size={12} /> {t("admin.users.removeAdmin")}</>
                      ) : (
                        <><Shield size={12} /> {t("admin.users.makeAdmin")}</>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>{total} users</span>
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
