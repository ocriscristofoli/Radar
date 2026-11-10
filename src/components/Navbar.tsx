import React from 'react';
import {
  Radar,
  LayoutDashboard,
  MapPin,
  KanbanSquare,
  PlusCircle,
  Network,
  Users,
  SlidersHorizontal,
  FileSpreadsheet,
  Building2,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { User, UserRole } from '../types/index.ts';

export type NavTab =
  | 'dashboard'
  | 'radar'
  | 'map'
  | 'crm'
  | 'import'
  | 'connectors'
  | 'team'
  | 'search-configs'
  | 'reports';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  onOpenImportModal: () => void;
  totalListings: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  users,
  onSelectUser,
  onOpenImportModal,
  totalListings,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'radar', label: 'Radar de Anúncios', icon: Radar, badge: totalListings },
    { id: 'map', label: 'Mapa de Oportunidades', icon: MapPin },
    { id: 'crm', label: 'CRM de Captação', icon: KanbanSquare },
    { id: 'connectors', label: 'Fontes & Conectores', icon: Network },
    { id: 'team', label: 'Equipe', icon: Users },
    { id: 'search-configs', label: 'Config. Buscas', icon: SlidersHorizontal },
    { id: 'reports', label: 'Relatórios & LGPD', icon: FileSpreadsheet },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/40 text-slate-950">
              <Radar className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                  RADAR DE PROPRIETÁRIOS
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  IA v3.8
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                <Building2 className="w-3 h-3 text-emerald-400" />
                <span className="font-medium">Connect Imóveis</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">Costa Esmeralda / SC</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & User Switcher */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenImportModal}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Importar Anúncio</span>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-left text-xs transition cursor-pointer"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-emerald-500/50"
                />
                <div className="hidden md:block">
                  <div className="font-medium text-slate-200 leading-tight">{currentUser.name}</div>
                  <div className="text-[10px] text-emerald-400 flex items-center space-x-1">
                    <span>{currentUser.role}</span>
                    {currentUser.creci && <span>• {currentUser.creci}</span>}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-2 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-slate-700 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Alternar Perfil Ativo
                  </div>
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full flex items-center space-x-2.5 px-3 py-2 text-left hover:bg-slate-700/60 transition cursor-pointer ${
                        u.id === currentUser.id ? 'bg-emerald-950/40 text-emerald-300 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                      <div className="flex-1 truncate">
                        <div className="truncate">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.role}</div>
                      </div>
                      {u.id === currentUser.id && (
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      )}
                    </button>
                  ))}
                  <div className="px-3 py-1.5 mt-1 border-t border-slate-700 text-[10px] text-slate-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Conexão Segura Connect CRM</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-2 border-t border-slate-800/80">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
