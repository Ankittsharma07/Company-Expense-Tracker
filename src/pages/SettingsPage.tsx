import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { resolveAvatarUrl } from '../lib/avatar';
import { uploadMyAvatar } from '../lib/api';
import { RoleBadge } from '../components/ui/RoleBadge';

export const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentAvatar = useMemo(() => {
    if (!user) return '';
    return resolveAvatarUrl(user.avatarUrl || null, user.email);
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
    </div>
  );
};
