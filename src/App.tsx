import React, { useEffect, useState } from 'react';
import { Navbar, NavTab } from './components/Navbar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { RadarView } from './components/RadarView.tsx';
import { MapView } from './components/MapView.tsx';
import { PipelineView } from './components/PipelineView.tsx';
import { ConnectorsView } from './components/ConnectorsView.tsx';
import { TeamView } from './components/TeamView.tsx';
import { SearchConfigView } from './components/SearchConfigView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { ImportModal } from './components/ImportModal.tsx';
import { PropertyDetailModal } from './components/PropertyDetailModal.tsx';
import { ContactModal } from './components/ContactModal.tsx';
import {
  Property,
  User,
  Connector,
  SearchConfig,
  DashboardMetrics,
  PipelineStage,
  SourcePlatform,
} from './types/index.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [properties, setProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [connectorLogs, setConnectorLogs] = useState<any[]>([]);
  const [searchConfigs, setSearchConfigs] = useState<SearchConfig[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([
    'Porto Belo',
    'Itapema',
    'Bombinhas',
    'Balneário Camboriú',
    'Camboriú',
    'Itajaí',
    'Tijucas',
  ]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [detailProperty, setDetailProperty] = useState<Property | null>(null);
  const [contactProperty, setContactProperty] = useState<Property | null>(null);

  // Dashboard drill-down filters for Radar tab
  const [selectedCityFilter, setSelectedCityFilter] = useState<string | undefined>(undefined);
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string | undefined>(undefined);
  const [selectedStageFilter, setSelectedStageFilter] = useState<string | undefined>(undefined);

  // Fetch initial data
  const refreshAllData = async () => {
    try {
      const [propsRes, usersRes, metricsRes, connRes, configsRes, auditRes] = await Promise.all([
        fetch('/api/properties').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
        fetch('/api/dashboard/metrics').then(r => r.json()),
        fetch('/api/connectors').then(r => r.json()),
        fetch('/api/search-configs').then(r => r.json()),
        fetch('/api/audit-logs').then(r => r.json()),
      ]);

      if (propsRes.properties) setProperties(propsRes.properties);
      if (usersRes.users) {
        setUsers(usersRes.users);
        if (!currentUser && usersRes.users.length > 0) {
          setCurrentUser(usersRes.users[0]);
        }
      }
      if (metricsRes) setMetrics(metricsRes);
      if (connRes.connectors) setConnectors(connRes.connectors);
      if (connRes.logs) setConnectorLogs(connRes.logs);
      if (configsRes.configs) setSearchConfigs(configsRes.configs);
      if (configsRes.availableCities) setAvailableCities(configsRes.availableCities);
      if (auditRes.logs) setAuditLogs(auditRes.logs);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Handlers
  const handleToggleFavorite = async (propertyId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !current }),
      });
      if (res.ok) {
        setProperties(prev =>
          prev.map(p => (p.id === propertyId ? { ...p, isFavorite: !current } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStage = async (propertyId: string, stage: PipelineStage) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crmStage: stage,
          currentUserId: currentUser?.id,
          currentUserName: currentUser?.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProperties(prev => prev.map(p => (p.id === propertyId ? data.property : p)));
        // Refresh metrics
        fetch('/api/dashboard/metrics')
          .then(r => r.json())
          .then(m => setMetrics(m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignUser = async (propertyId: string, userId: string) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedToUserId: userId,
          currentUserId: currentUser?.id,
          currentUserName: currentUser?.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProperties(prev => prev.map(p => (p.id === propertyId ? data.property : p)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReanalyzeAi = async (propertyId: string) => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/ai-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: currentUser?.id,
          currentUserName: currentUser?.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProperties(prev => prev.map(p => (p.id === propertyId ? data.property : p)));
        setDetailProperty(data.property);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleContactLogged = async (payload: any) => {
    if (!contactProperty) return;
    try {
      const res = await fetch(`/api/properties/${contactProperty.id}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setProperties(prev => prev.map(p => (p.id === contactProperty.id ? data.property : p)));
        // Refresh metrics
        fetch('/api/dashboard/metrics')
          .then(r => r.json())
          .then(m => setMetrics(m));
        // Refresh audit logs
        fetch('/api/audit-logs')
          .then(r => r.json())
          .then(a => setAuditLogs(a.logs));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerSync = async (connectorId: string) => {
    try {
      const res = await fetch(`/api/connectors/${connectorId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUserId: currentUser?.id,
          currentUserName: currentUser?.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConnectors(prev => prev.map(c => (c.id === connectorId ? data.connector : c)));
        setConnectorLogs(prev => [data.log, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserCreated = async (userData: any) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => [...prev, data.user]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCity = async (city: string) => {
    try {
      const res = await fetch('/api/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city }),
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableCities(data.availableCities);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddConfig = async (configData: any) => {
    try {
      const res = await fetch('/api/search-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchConfigs(prev => [...prev, data.config]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePropertyCreated = (newProp: Property) => {
    setProperties(prev => [newProp, ...prev]);
    // Refresh metrics
    fetch('/api/dashboard/metrics')
      .then(r => r.json())
      .then(m => setMetrics(m));
  };

  // Drilldown navigators from Dashboard
  const handleFilterByCity = (city: string) => {
    setSelectedCityFilter(city);
    setCurrentTab('radar');
  };

  const handleFilterBySource = (source: SourcePlatform) => {
    setSelectedSourceFilter(source);
    setCurrentTab('radar');
  };

  const handleFilterByStage = (stage: PipelineStage) => {
    setSelectedStageFilter(stage);
    setCurrentTab('radar');
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Navbar with Brand & Tabs */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={tab => {
          // Reset quick filters when tab changed directly
          if (tab !== 'radar') {
            setSelectedCityFilter(undefined);
            setSelectedSourceFilter(undefined);
            setSelectedStageFilter(undefined);
          }
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        users={users}
        onSelectUser={setCurrentUser}
        onOpenImportModal={() => setIsImportOpen(true)}
        totalListings={properties.length}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            metrics={metrics}
            onFilterByCity={handleFilterByCity}
            onFilterBySource={handleFilterBySource}
            onFilterByStage={handleFilterByStage}
            onOpenImportModal={() => setIsImportOpen(true)}
          />
        )}

        {currentTab === 'radar' && (
          <RadarView
            properties={properties}
            users={users}
            availableCities={availableCities}
            onOpenDetailModal={setDetailProperty}
            onOpenContactModal={setContactProperty}
            onToggleFavorite={handleToggleFavorite}
            onUpdateStage={handleUpdateStage}
            onAssignUser={handleAssignUser}
            onDiscard={id => handleUpdateStage(id, 'Descartado')}
            onOpenImportModal={() => setIsImportOpen(true)}
            selectedCityFilter={selectedCityFilter}
            selectedSourceFilter={selectedSourceFilter}
            selectedStageFilter={selectedStageFilter}
          />
        )}

        {currentTab === 'map' && (
          <MapView
            properties={properties}
            availableCities={availableCities}
            onOpenDetailModal={setDetailProperty}
            onOpenContactModal={setContactProperty}
          />
        )}

        {currentTab === 'crm' && (
          <PipelineView
            properties={properties}
            users={users}
            onOpenDetailModal={setDetailProperty}
            onOpenContactModal={setContactProperty}
            onUpdateStage={handleUpdateStage}
            onAssignUser={handleAssignUser}
          />
        )}

        {currentTab === 'connectors' && (
          <ConnectorsView
            connectors={connectors}
            logs={connectorLogs}
            onTriggerSync={handleTriggerSync}
          />
        )}

        {currentTab === 'team' && (
          <TeamView
            users={users}
            currentUser={currentUser}
            onUserCreated={handleUserCreated}
          />
        )}

        {currentTab === 'search-configs' && (
          <SearchConfigView
            configs={searchConfigs}
            availableCities={availableCities}
            onAddCity={handleAddCity}
            onAddConfig={handleAddConfig}
          />
        )}

        {currentTab === 'reports' && <ReportsView auditLogs={auditLogs} />}
      </main>

      {/* Global Modals */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        availableCities={availableCities}
        users={users}
        currentUser={currentUser}
        onPropertyCreated={handlePropertyCreated}
      />

      <PropertyDetailModal
        property={detailProperty}
        isOpen={!!detailProperty}
        onClose={() => setDetailProperty(null)}
        users={users}
        onOpenContactModal={prop => {
          setDetailProperty(null);
          setContactProperty(prop);
        }}
        onUpdateStage={handleUpdateStage}
        onAssignUser={handleAssignUser}
        onReanalyzeAi={handleReanalyzeAi}
      />

      <ContactModal
        property={contactProperty}
        isOpen={!!contactProperty}
        onClose={() => setContactProperty(null)}
        currentUser={currentUser}
        onContactLogged={handleContactLogged}
      />
    </div>
  );
}
