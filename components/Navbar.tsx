'use client';

import React from 'react';
import { Droplets, Users, FileText, Gauge, Settings, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type ActiveTab = 'dashboard' | 'clients' | 'invoices' | 'stations' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingInvoicesCount: number;
}

export function Navbar({ activeTab, setActiveTab, pendingInvoicesCount }: NavbarProps) {
  const { user, logOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Company identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-linear-to-br from-sky-500 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 ring-2 ring-sky-200">
              <Droplets className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
                  Águas da Manhiça
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                  SIGA-M
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Sistema de Gestão & Abastecimento Comunitário • Manhiça, Maputo
              </p>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-sky-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Gauge className="w-4 h-4" />
              <span>Painel Geral</span>
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'clients'
                  ? 'bg-white text-sky-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clientes</span>
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === 'invoices'
                  ? 'bg-white text-sky-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Faturas (m³)</span>
              {pendingInvoicesCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {pendingInvoicesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('stations')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'stations'
                  ? 'bg-white text-sky-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Droplets className="w-4 h-4 text-sky-600" />
              <span>Posto Abastecimento</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-sky-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </button>
          </nav>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[170px]">
                    {user.email}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-600 flex items-center justify-end gap-1">
                    <ShieldCheck className="w-3 h-3" /> Operador Firebase
                  </span>
                </div>
                <div className="w-9 h-9 rounded-full bg-sky-100 border border-sky-300 text-sky-700 flex items-center justify-center font-bold text-sm shadow-xs">
                  {user.email ? user.email[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <button
                  onClick={() => logOut()}
                  title="Terminar Sessão"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs ${
              activeTab === 'dashboard' ? 'text-sky-600 font-bold bg-sky-50' : 'text-slate-600'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Painel</span>
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs ${
              activeTab === 'clients' ? 'text-sky-600 font-bold bg-sky-50' : 'text-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes</span>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs relative ${
              activeTab === 'invoices' ? 'text-sky-600 font-bold bg-sky-50' : 'text-slate-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Faturas</span>
          </button>
          <button
            onClick={() => setActiveTab('stations')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs ${
              activeTab === 'stations' ? 'text-sky-600 font-bold bg-sky-50' : 'text-slate-600'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>Posto</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs ${
              activeTab === 'settings' ? 'text-sky-600 font-bold bg-sky-50' : 'text-slate-600'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Ajustes</span>
          </button>
        </div>
      </div>
    </header>
  );
}
