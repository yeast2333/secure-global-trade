import { Suspense } from "react";

import TradeHome from "@/components/TradeHome";

// useSearchParams 必须在 Suspense 边界内使用
export default function HomePage() {
  return (
    <Suspense>
      <TradeHome />
    </Suspense>
  );
}
