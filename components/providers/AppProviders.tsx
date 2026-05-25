"use client";

import { Toaster } from "sonner";
import type { ReactNode } from "react";

import { AuthProvider } from "./AuthProvider";
import { CartProvider } from "./CartProvider";
import { CurrencyProvider } from "./CurrencyProvider";
import { UIProvider } from "./UIProvider";
import CartDrawer from "@/components/CartDrawer";
import AiCustomerServiceWidget from "@/components/AiCustomerServiceWidget";

// 聚合所有客户端 Provider，避免 layout 内嵌套层级过深
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <CartProvider>
          <UIProvider>
            {children}
            <CartDrawer />
            <AiCustomerServiceWidget />
            <Toaster richColors position="top-right" />
          </UIProvider>
        </CartProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}
