import React, { useState, useEffect } from 'react';
import { SupportedLanguage, HouseholdStats, ProtocolStatus } from './types';
import { apiService } from './services/api';
import { Header } from './components/Header';
import { StatusStrip } from './components/StatusStrip';
import { DashboardCards } from './components/DashboardCards';
import { AskProtocols } from './components/AskProtocols';
import { VisitList } from './components/VisitList';
import { DisclaimerBanner } from './components/DisclaimerModal';

export const App: React.FC = () => {
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [activeTab, setActiveTab] = useState<'ask' | 'visits'>('ask');
  const [stats, setStats] = useState<HouseholdStats | null>(null);
  const [protocolStatus, setProtocolStatus] = useState<ProtocolStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [initialVisitFilter, setInitialVisitFilter] = useState<string>('all');

  const fetchStatusAndStats = async () => {
    setIsLoadingStatus(true);
    try {
      const [protoRes, statsRes] = await Promise.allSettled([
        apiService.getProtocolStatus(),
        apiService.getStats(),
      ]);

      if (protoRes.status === 'fulfilled') {
        setProtocolStatus(protoRes.value);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
    } catch (err) {
      console.error('Failed to fetch initial status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatusAndStats();
  }, []);

  const handleCardFilterClick = (filter: string) => {
    setInitialVisitFilter(filter);
    setActiveTab('visits');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header with minimal 2-tab navigation and emergency quick dial */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Status Strip: Online/Offline live detection & local protocol readiness */}
      <StatusStrip
        language={language}
        protocolStatus={protocolStatus}
        isLoadingStatus={isLoadingStatus}
      />

      {/* Main Field Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-4 py-4 md:py-6">
        {/* Lightweight Summary Dashboard */}
        <DashboardCards
          language={language}
          stats={stats}
          protocolStatus={protocolStatus}
          onFilterDueStatus={handleCardFilterClick}
        />

        {/* Tab 1: Protocol Q&A with Deterministic Escalation */}
        {activeTab === 'ask' && (
          <div className="animate-in fade-in duration-150">
            <AskProtocols language={language} />
          </div>
        )}

        {/* Tab 2: Prioritized Household Follow-up Visits */}
        {activeTab === 'visits' && (
          <div className="animate-in fade-in duration-150">
            <VisitList
              language={language}
              initialDueFilter={initialVisitFilter}
              onVisitUpdated={fetchStatusAndStats}
            />
          </div>
        )}
      </main>

      {/* Persistent Medical Safety Disclaimer Notice */}
      <DisclaimerBanner language={language} />
    </div>
  );
};

export default App;
