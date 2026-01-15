import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Role, USERS } from '../data/mockData';

interface UserContextType {
  role: Role;
  setRole: (role: Role) => void;
  user: typeof USERS['admin'];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>('admin');

  const user = USERS[role];

  return (
    <UserContext.Provider value={{ role, setRole, user }}>
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
