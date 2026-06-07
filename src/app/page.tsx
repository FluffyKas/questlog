'use client';

import { HeroSection } from '@/components/dashboard/HeroSection';
import { ActiveQuests } from '@/components/dashboard/ActiveQuests';
import { SidePanel } from '@/components/dashboard/SidePanel';

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <HeroSection />
          <ActiveQuests />
        </div>
        <div className="xl:w-80 flex-shrink-0">
          <SidePanel />
        </div>
      </div>
    </div>
  );
}
