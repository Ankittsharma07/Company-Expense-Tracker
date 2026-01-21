import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { fetchMe, getAuthToken } from '../lib/api';

export type Role = 'admin' | 'manager' | 'employee';

interface UserProfile {
  id?: string;
  name: string;
  role: Role;
  email?: string;
  avatar: string;
}

interface UserContextType {
  role: Role;
  setRole: (role: Role) => void;
  user: UserProfile;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>('admin');
  const [user, setUser] = useState<UserProfile>({
    name: 'Guest',
    role: 'admin',
    avatar: 'https://i.pravatar.cc/150?u=guest',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        const me = await fetchMe();
        const normalizedRole = (me.role || 'EMPLOYEE').toLowerCase() as Role;
        setRole(normalizedRole);
        setUser({
          id: me.id,
          name: me.name,
          role: normalizedRole,
          email: me.email,
          avatar: `https://i.pravatar.cc/150?u=${me.id}`,
        });
      } catch (error) {
        setUser({
          name: 'User',
          role: 'admin',
          avatar: 'https://i.pravatar.cc/150?u=fallback',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (token) return;
    setUser((prev) => ({
      ...prev,
      role,
      name: role === 'admin' ? 'Admin' : role === 'manager' ? 'Manager' : 'Employee',
      avatar: `https://i.pravatar.cc/150?u=${role}`,
    }));
  }, [role]);

  const value = useMemo(() => ({ role, setRole, user, isLoading }), [role, user, isLoading]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
