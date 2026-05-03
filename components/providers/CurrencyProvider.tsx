"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Currency = "USD" | "CNY";

const RATE: Record<Currency, number> = {
  USD: 1,
  CNY: 7.16,
};

const SYMBOL: Record<Currency, string> = {
  USD: "$",
  CNY: "¥",
};

const STORAGE_KEY = "sgt-currency";

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  symbol: string;
  format: (amountUsd: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "USD" || saved === "CNY") {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = useCallback((next: Currency) => {
    setCurrencyState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const format = useCallback(
    (amountUsd: number) => {
      const value = amountUsd * RATE[currency];
      return `${SYMBOL[currency]}${value.toFixed(2)}`;
    },
    [currency],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({ currency, setCurrency, symbol: SYMBOL[currency], format }),
    [currency, setCurrency, format],
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used inside CurrencyProvider");
  }
  return context;
}
