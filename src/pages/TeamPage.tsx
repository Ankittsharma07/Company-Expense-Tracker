import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Plus, Mail, Calendar, Shield } from 'lucide-react';
import { createUser, fetchUsers } from '../lib/api';
import type { ApiUser } from '../lib/api';
import { formatDate } from '../lib/utils';

export const TeamPage = () => {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE' as 'MANAGER' | 'EMPLOYEE',
  });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to load users.';
      setError(errMessage === 'unauthorized' ? 'Session expired. Please sign in again.' : errMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();

    // Set up polling for real-time updates every 30 seconds
    const intervalId = setInterval(() => {
      loadUsers();
    }, 30000); // 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [loadUsers]);

  const resetForm = () => {
    setFormState({
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
    });
  };

  const openNewUser = () => {
    setError(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!formState.name || !formState.email || !formState.password) {
      setError('Please fill in all fields.');
      return;
    }

    if (formState.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      await createUser({
        name: formState.name,
        email: formState.email,
        password: formState.password,
        role: formState.role,
      });
      setIsModalOpen(false);
      resetForm();
      await loadUsers();
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to create user.';
      setError(errMessage);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') return <Badge variant="default">Admin</Badge>;
    if (role === 'MANAGER') return <Badge variant="approved">Manager</Badge>;
    return <Badge variant="pending">Employee</Badge>;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 font-display">Team Management</h1>
          <p className="text-slate-500">Manage your company's users and roles.</p>
        </div>
        <Button onClick={openNewUser} leftIcon={<Plus className="w-4 h-4" />}>
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="py-10 text-center text-sm text-slate-500">Loading team members...</div>
          )}
          {!isLoading && error && (
            <div className="py-10 text-center text-sm text-rose-600">{error}</div>
          )}
          {!isLoading && !error && users.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">No team members found.</div>
          )}
          {!isLoading && !error && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/60">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-slate-400" />
                          {getRoleBadge(user.role)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
          setError(null);
        }}
        title="Add New User"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formState.email}
              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="john@company.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={formState.password}
              onChange={(e) => setFormState({ ...formState, password: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Min. 6 characters"
              required
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
              Role
            </label>
            <select
              id="role"
              value={formState.role}
              onChange={(e) => setFormState({ ...formState, role: e.target.value as 'MANAGER' | 'EMPLOYEE' })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

