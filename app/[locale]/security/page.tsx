import SecurityModuleLabs from "@/components/security/SecurityModuleLabs";
import StatusDashboard from "@/components/security/StatusDashboard";

// 安全运营指挥中心 · 实时模块看板 + 交互实验区
//   - 看板：四大模块 · 在线/离线 · 拦截次数 · 加密强度（Supabase Realtime）
//   - 实验区：真实 API / 边缘策略，驱动审计计数增长
export default function SecurityOverviewPage() {
  return (
    <>
      <StatusDashboard />
      <SecurityModuleLabs />
    </>
  );
}
