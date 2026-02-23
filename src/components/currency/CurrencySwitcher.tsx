import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { getSupportedCurrencies, updateUserPreferredCurrency, type Currency } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';

export const CurrencySwitcher: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { displayCurrency, baseCurrency } = useDisplayCurrency();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentCurrency = displayCurrency || baseCurrency || user?.preferredCurrency || 'USD';

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const data = await getSupportedCurrencies();
        setCurrencies(data);
      } catch (err) {
        console.error('Failed to load currencies:', err);
        setError('Failed to load currencies');
      }
    };

    if (isOpen && currencies.length === 0) {
      loadCurrencies();
    }
  }, [isOpen, currencies.length]);

  const handleCurrencyChange = async (currencyCode: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await updateUserPreferredCurrency(currencyCode === currentCurrency ? null : currencyCode);
      await refreshUser();
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to update currency:', err);
      setError(err instanceof Error ? err.message : 'Failed to update currency');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
        title="Change display currency"
      >
        <Globe className="w-4 h-4" />
        <span>{currentCurrency}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 z-50 py-2 max-h-96 overflow-y-auto">
            <div className="px-4 py-2 border-b border-slate-200">
              <p className="text-xs font-medium text-slate-900">Display Currency</p>
              <p className="text-xs text-slate-500">Choose how amounts are displayed</p>
            </div>

            {error && (
              <div className="px-4 py-2 text-xs text-rose-600 bg-rose-50">
                {error}
              </div>
            )}

            <div className="py-1">
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencyChange(currency.code)}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors flex items-center justify-between ${
                    currency.code === currentCurrency ? 'bg-violet-50 text-violet-900' : 'text-slate-700'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{currency.symbol}</span>
                    <div>
                      <div className="text-sm font-medium">{currency.code}</div>
                      <div className="text-xs text-slate-500">{currency.name}</div>
                    </div>
                  </div>
                  {currency.code === currentCurrency && (
                    <div className="w-2 h-2 bg-violet-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
