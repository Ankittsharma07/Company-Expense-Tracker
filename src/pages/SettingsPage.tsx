import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { resolveAvatarUrl } from '../lib/avatar';
import { uploadMyAvatar, getSupportedCurrencies, getCompanySettings, updateCompanyBaseCurrency, updateCompanyName, updateUserPreferredCurrency, type Currency, type Company } from '../lib/api';
import { RoleBadge } from '../components/ui/RoleBadge';
import { Globe, Building2 } from 'lucide-react';

export const SettingsPage = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Currency state
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [selectedBaseCurrency, setSelectedBaseCurrency] = useState<string>('USD');
  const [selectedPreferredCurrency, setSelectedPreferredCurrency] = useState<string | null>(null);
  const [isSavingBaseCurrency, setIsSavingBaseCurrency] = useState(false);
  const [isSavingPreferredCurrency, setIsSavingPreferredCurrency] = useState(false);
  const [currencyError, setCurrencyError] = useState<string | null>(null);

  // Company name state
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [isSavingCompanyName, setIsSavingCompanyName] = useState(false);
  const [companyNameError, setCompanyNameError] = useState<string | null>(null);
  const [companyNameSuccess, setCompanyNameSuccess] = useState(false);

  const currentAvatar = useMemo(() => {
    if (!user) return '';
    return resolveAvatarUrl(
      user.avatarUrl || null,
      user.googleAvatarUrl || null,
      user.email
    );
  }, [user]);

  // Load currencies and company settings
  useEffect(() => {
    const loadCurrencyData = async () => {
      try {
        const [currenciesData, companyData] = await Promise.all([
          getSupportedCurrencies(),
          getCompanySettings(),
        ]);
        setCurrencies(currenciesData);
        setCompany(companyData);
        setSelectedBaseCurrency(companyData.baseCurrency);
        setCompanyNameInput(companyData.name);
        setSelectedPreferredCurrency(user?.preferredCurrency || null);
      } catch (err) {
        console.error('Failed to load currency data:', err);
        setCurrencyError('Failed to load currency settings');
      }
    };

    if (user) {
      loadCurrencyData();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSave = async () => {
    if (!selectedFile) {
      setError('Please select an image file.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const updatedUser = await uploadMyAvatar(selectedFile);
      updateUser({
        avatarUrl: updatedUser.avatarUrl || null,
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload avatar';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCompanyName = async () => {
    if (!company || companyNameInput.trim() === company.name) return;
    if (companyNameInput.trim().length < 2) {
      setCompanyNameError('Company name must be at least 2 characters.');
      return;
    }
    setIsSavingCompanyName(true);
    setCompanyNameError(null);
    setCompanyNameSuccess(false);
    try {
      const updatedCompany = await updateCompanyName(companyNameInput.trim());
      setCompany(updatedCompany);
      setCompanyNameInput(updatedCompany.name);
      setCompanyNameSuccess(true);
      setTimeout(() => setCompanyNameSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update company name';
      setCompanyNameError(message);
    } finally {
      setIsSavingCompanyName(false);
    }
  };

  const handleSaveBaseCurrency = async () => {
    if (!company || selectedBaseCurrency === company.baseCurrency) {
      return;
    }
    setIsSavingBaseCurrency(true);
    setCurrencyError(null);
    try {
      const updatedCompany = await updateCompanyBaseCurrency(selectedBaseCurrency);
      setCompany(updatedCompany);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update base currency';
      setCurrencyError(message);
    } finally {
      setIsSavingBaseCurrency(false);
    }
  };

  const handleSavePreferredCurrency = async () => {
    if (selectedPreferredCurrency === user.preferredCurrency) {
      return;
    }
    setIsSavingPreferredCurrency(true);
    setCurrencyError(null);
    try {
      await updateUserPreferredCurrency(selectedPreferredCurrency);
      await refreshUser();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update preferred currency';
      setCurrencyError(message);
    } finally {
      setIsSavingPreferredCurrency(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 font-display">Settings</h1>
        <p className="text-slate-500">Manage your profile and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
            <div className="relative w-20 h-20">
              <img
                src={previewUrl || currentAvatar}
                alt={user.name}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover border border-slate-200 shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-slate-900">{user.name}</p>
                <RoleBadge role={user.role} />
              </div>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <label className="text-sm font-medium text-slate-700">Profile Avatar</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
            <p className="text-xs text-slate-500">JPG, PNG, or WEBP. Max 2MB.</p>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div>
              <Button onClick={handleSave} isLoading={isSaving} disabled={!selectedFile}>
                Save Avatar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Base Currency - ADMIN Only */}
      {user.role === 'ADMIN' && company && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-600" />
              <CardTitle>Company Currency Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Company Name
                </label>
                <p className="text-sm text-slate-600 mb-3">
                  This name will appear on all generated reports (PDF &amp; Excel).
                </p>
                <div className="flex gap-3 items-start">
                  <input
                    type="text"
                    value={companyNameInput}
                    onChange={(e) => setCompanyNameInput(e.target.value)}
                    minLength={2}
                    maxLength={100}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 transition-all"
                    placeholder="Your Company Name"
                  />
                  <Button
                    onClick={handleSaveCompanyName}
                    isLoading={isSavingCompanyName}
                    disabled={!companyNameInput.trim() || companyNameInput.trim() === company?.name}
                  >
                    Save
                  </Button>
                </div>
                {companyNameError && <p className="text-sm text-rose-600 mt-2">{companyNameError}</p>}
                {companyNameSuccess && <p className="text-sm text-emerald-600 mt-2">Company name updated successfully!</p>}
              </div>

              <hr className="border-slate-200" />

              <div>
                <p className="text-sm text-slate-600 mb-4">
                  Set the base currency for your company. All financial reports and aggregations will use this currency.
                </p>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Base Currency
                </label>
                <div className="flex gap-3 items-start">
                  <select
                    value={selectedBaseCurrency}
                    onChange={(e) => setSelectedBaseCurrency(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 transition-all"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={handleSaveBaseCurrency}
                    isLoading={isSavingBaseCurrency}
                    disabled={selectedBaseCurrency === company.baseCurrency}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Current: {company.baseCurrency}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Preferred Currency */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-slate-600" />
            <CardTitle>Display Currency Preference</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600 mb-4">
                Choose how you prefer to view amounts in the dashboard. This doesn't affect stored expense data.
              </p>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Preferred Currency
              </label>
              <div className="flex gap-3 items-start">
                <select
                  value={selectedPreferredCurrency || ''}
                  onChange={(e) => setSelectedPreferredCurrency(e.target.value || null)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 transition-all"
                >
                  <option value="">Default (Company Base Currency)</option>
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={handleSavePreferredCurrency}
                  isLoading={isSavingPreferredCurrency}
                  disabled={selectedPreferredCurrency === user.preferredCurrency}
                >
                  Save
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Current: {user.preferredCurrency || `Default (${company?.baseCurrency || 'USD'})`}
              </p>
            </div>
            {currencyError && (
              <p className="text-sm text-rose-600">{currencyError}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
