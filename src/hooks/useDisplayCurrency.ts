import { useEffect, useMemo, useState } from "react";
import { getCompanySettings } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export const useDisplayCurrency = () => {
  const { user } = useAuth();
  const [baseCurrency, setBaseCurrency] = useState<string>("USD");
  const [displayCurrency, setDisplayCurrency] = useState<string>("USD");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadCompanyCurrency = async () => {
      if (!user) return;
      setIsLoading(true);
      setError(null);
      try {
        const company = await getCompanySettings();
        if (!isActive) return;
        const base = company.baseCurrency || "USD";
        const preferred = user.preferredCurrency || base;
        setBaseCurrency(base);
        setDisplayCurrency(preferred);
      } catch (err) {
        if (!isActive) return;
        const message = err instanceof Error ? err.message : "Failed to load currency settings";
        setError(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadCompanyCurrency();

    return () => {
      isActive = false;
    };
  }, [user?.id, user?.preferredCurrency]);

  return useMemo(
    () => ({
      baseCurrency,
      displayCurrency,
      isLoading,
      error,
    }),
    [baseCurrency, displayCurrency, isLoading, error]
  );
};
