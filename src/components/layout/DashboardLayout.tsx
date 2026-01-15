import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
