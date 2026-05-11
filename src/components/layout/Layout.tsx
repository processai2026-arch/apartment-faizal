import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import { useScanSync } from '@/hooks/useScanSync';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { sidebarCollapsed } = useAppStore();
  // Enable real-time sync from scan pages
  useScanSync();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <Header />
      <main
        className={cn(
          'min-h-screen pt-16 transition-all duration-300',
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[240px]'
        )}
      >
        <div className="p-6 fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
