import React from 'react';
import { 
  Activity, 
  ShieldAlert, 
  Languages, 
  UserCheck, 
  Wifi, 
  WifiOff, 
  Sparkles,
  Building2,
  Boxes,
  TrendingUp,
  ArrowRightLeft,
  Stethoscope,
  Bell,
  LineChart
} from 'lucide-react';
import { UserRole, LanguageCode, HealthFacility } from '../types';
import { LANGUAGES, TRANSLATIONS } from '../i18n/translations';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  criticalAlertCount: number;
  onOpenCopilot: () => void;
  facilities: HealthFacility[];
  selectedFacilityId: string;
  onSelectFacility: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  currentLanguage,
  onLanguageChange,
  activeTab,
  onTabChange,
  isOffline,
  onToggleOffline,
  criticalAlertCount,
  onOpenCopilot,
  facilities,
  selectedFacilityId,
  onSelectFacility,
}) => {
  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  const navItems = [
    { id: 'command', label: t.navCommandCenter, icon: Building2, showBadge: criticalAlertCount > 0 },
    { id: 'inventory', label: t.navInventory, icon: Boxes },
    { id: 'forecasting', label: t.navForecasting, icon: TrendingUp },
    { id: 'trends', label: t.navTrends || '30-Day Trends', icon: LineChart },
    { id: 'redistribution', label: t.navRedistribution, icon: ArrowRightLeft },
    { id: 'facilityOps', label: t.navFacilityOps, icon: Stethoscope },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      {/* Top Banner / Ticker for Critical Health Alerts */}
      {criticalAlertCount > 0 && (
        <div className="bg-gradient-to-r from-rose-900/90 via-red-800/90 to-amber-900/90 border-b border-rose-500/30 px-4 py-1.5 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2 text-rose-100 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-rose-300" />
            <span>
              <strong>DISTRICT SURGE ALERT:</strong> {criticalAlertCount} health centres flagged for severe medicine stockout or 90%+ bed saturation. Immediate reallocation active.
            </span>
          </div>
          <button 
            onClick={() => onTabChange('redistribution')}
            className="text-[11px] bg-rose-950/80 hover:bg-rose-900 text-rose-200 px-2.5 py-0.5 rounded border border-rose-400/30 flex items-center gap-1 transition"
          >
            Review Reallocation Plan →
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-400/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-teal-100 to-teal-400 bg-clip-text text-transparent">
                  {t.appTitle}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-teal-500/15 text-teal-300 border border-teal-500/30 rounded-full">
                  AI GovHealth
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Center Facility Selector (shows when viewing facility specific details) */}
          {(currentRole === 'FACILITY_INCHARGE' || activeTab === 'facilityOps') && (
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs">
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-slate-400">Current Center:</span>
              <select
                value={selectedFacilityId}
                onChange={(e) => onSelectFacility(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id} className="bg-slate-800 text-slate-100">
                    {fac.name} ({fac.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Right Tools: Offline toggle, Language, Role, AI Copilot trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sync / Offline Simulation */}
            <button
              onClick={onToggleOffline}
              title={isOffline ? t.offlineMode : t.onlineMode}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border transition ${
                isOffline 
                  ? 'bg-amber-950/40 border-amber-600/50 text-amber-300 hover:bg-amber-900/40' 
                  : 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/30'
              }`}
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline">{t.offlineMode}</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden lg:inline">{t.onlineMode}</span>
                </>
              )}
            </button>

            {/* Language Switcher */}
            <div className="relative flex items-center bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs">
              <Languages className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <select
                value={currentLanguage}
                onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-800 text-slate-100">
                    {lang.flag} {lang.localName}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Switcher */}
            <div className="relative flex items-center bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-teal-400 mr-1.5" />
              <select
                value={currentRole}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="CMO_ADMIN" className="bg-slate-800 text-slate-100">{t.roleCmo}</option>
                <option value="FACILITY_INCHARGE" className="bg-slate-800 text-slate-100">{t.roleInCharge}</option>
                <option value="SUPPLY_PHARMACIST" className="bg-slate-800 text-slate-100">{t.rolePharmacist}</option>
              </select>
            </div>

            {/* AI Advisor Button */}
            <button
              onClick={onOpenCopilot}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-semibold px-3 py-1.5 rounded-lg shadow-md shadow-teal-500/20 text-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-800/80 py-1.5 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.showBadge && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
