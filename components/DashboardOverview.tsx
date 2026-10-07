'use client';

import React from 'react';
import {
  Users,
  FileText,
  Droplets,
  Coins,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  Clock,
  Gauge,
  Activity,
} from 'lucide-react';
import { Client, Invoice, WaterStationConsumption, SystemSettings } from '@/types/water-system';
import { ActiveTab } from '@/components/Navbar';

interface DashboardOverviewProps {
  clients: Client[];
  invoices: Invoice[];
  stations: WaterStationConsumption[];
  settings: SystemSettings;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewClient: () => void;
  onOpenNewInvoice: () => void;
  onOpenNewStationRecord: () => void;
}

export function DashboardOverview({
  clients,
  invoices,
  stations,
  settings,
  setActiveTab,
  onOpenNewClient,
  onOpenNewInvoice,
  onOpenNewStationRecord,
}: DashboardOverviewProps) {
  const currentMonth = new Date().toISOString().substring(0, 7);

  // Stats calculation
  const activeClientsCount = clients.filter((c) => c.status === 'active').length;
  const currentMonthInvoices = invoices.filter((i) => i.periodMonth === currentMonth);

  const totalInvoicedM3 = currentMonthInvoices.reduce((acc, curr) => acc + (curr.consumptionM3 || 0), 0);
  const totalBilledMT = currentMonthInvoices.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalCollectedMT = invoices
    .filter((i) => i.status === 'paid' && i.periodMonth === currentMonth)
    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const pendingInvoices = invoices.filter((i) => i.status === 'pending');

  // Station pumped volume for current month
  const currentMonthStations = stations.filter((s) => s.periodMonth === currentMonth);
  const totalPumpedM3 = currentMonthStations.reduce((acc, curr) => acc + (curr.pumpedVolumeM3 || 0), 0);

  // Water balance / Efficiency
  let waterLossM3 = 0;
  let lossPercentage = 0;
  let efficiencyRate = 100;
  if (totalPumpedM3 > 0) {
    waterLossM3 = Math.max(0, totalPumpedM3 - totalInvoicedM3);
    lossPercentage = Math.round((waterLossM3 / totalPumpedM3) * 100);
    efficiencyRate = Math.min(100, Math.round((totalInvoicedM3 / totalPumpedM3) * 100));
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner & Community context */}
      <div className="bg-linear-to-r from-sky-700 via-blue-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-sky-900/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/30 text-sky-100 border border-sky-400/30">
              <Droplets className="w-3.5 h-3.5 text-sky-200" />
              <span>Rede de Distribuição de Água Comunitária</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {settings.companyName || 'Águas da Manhiça'}
            </h2>
            <p className="text-sky-100/90 text-sm leading-relaxed">
              Gestão de hidrómetros e clientes nos bairros da Manhiça (Ribínguè, Sede, Nhambalo, Maluana, Xinavane).
              Faturamento com base no preço por m³ e acompanhamento contínuo dos postos de bombagem.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenNewInvoice}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-sky-800 font-bold text-sm shadow-md hover:bg-sky-50 hover:shadow-lg transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-sky-600" />
              <span>Nova Fatura (m³)</span>
            </button>
            <button
              onClick={onOpenNewClient}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600/60 hover:bg-sky-600/80 text-white font-semibold text-sm border border-sky-400/40 backdrop-blur-xs transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Novo Cliente</span>
            </button>
            <button
              onClick={onOpenNewStationRecord}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-900/60 hover:bg-sky-900/80 text-white font-semibold text-sm border border-sky-400/30 backdrop-blur-xs transition-all cursor-pointer"
            >
              <Gauge className="w-4 h-4" />
              <span>Registar Posto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Clientes */}
        <div
          onClick={() => setActiveTab('clients')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Clientes Ligados
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{clients.length}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span className="text-emerald-600 font-semibold">{activeClientsCount} ativos</span>
              <span>•</span>
              <span>{clients.length - activeClientsCount} inativos</span>
            </div>
          </div>
        </div>

        {/* Consumo Faturado Clientes */}
        <div
          onClick={() => setActiveTab('invoices')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Consumo Faturado (m³)
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Droplets className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalInvoicedM3.toLocaleString()} <span className="text-base font-bold text-slate-500">m³</span>
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
              <span>{currentMonthInvoices.length} faturas emitidas no mês</span>
            </div>
          </div>
        </div>

        {/* Volume Bombeado Posto */}
        <div
          onClick={() => setActiveTab('stations')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Volume Posto Bombagem
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalPumpedM3.toLocaleString()} <span className="text-base font-bold text-slate-500">m³</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              <span>{currentMonthStations.length} postos registados no mês</span>
            </div>
          </div>
        </div>

        {/* Faturamento Financeiro */}
        <div
          onClick={() => setActiveTab('invoices')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Faturamento do Mês
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {totalBilledMT.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-base font-bold text-slate-500">{settings.currency}</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              <span className="text-emerald-600 font-semibold">
                {totalCollectedMT.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} {settings.currency} arrecadados
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Water Balance & Supply Station Efficiency Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Balanço Hídrico & Eficiência da Rede da Manhiça
              </h3>
              <p className="text-xs text-slate-500">
                Comparativo de volume bombeado no posto vs volume medido e faturado aos clientes
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('stations')}
            className="text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors self-start sm:self-auto cursor-pointer"
          >
            Ver Detalhes dos Postos →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="text-xs font-semibold text-slate-500 mb-1">Volume Injetado na Rede (Postos)</div>
            <div className="text-2xl font-black text-slate-900">
              {totalPumpedM3.toLocaleString()} <span className="text-sm font-semibold text-slate-500">m³</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total medido nos hidrómetros principais dos postos</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="text-xs font-semibold text-slate-500 mb-1">Volume Faturado aos Clientes</div>
            <div className="text-2xl font-black text-sky-700">
              {totalInvoicedM3.toLocaleString()} <span className="text-sm font-semibold text-slate-500">m³</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Soma do consumo lido nos hidrómetros individuais</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">Eficiência de Faturamento</span>
              <span
                className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                  efficiencyRate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {totalPumpedM3 > 0 ? `${efficiencyRate}%` : 'N/D'}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {totalPumpedM3 > 0 ? (
                <>
                  {waterLossM3.toLocaleString()}{' '}
                  <span className="text-sm font-semibold text-rose-500">m³ perda ({lossPercentage}%)</span>
                </>
              ) : (
                <span className="text-sm text-slate-400 font-medium">Registe o posto para calcular</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Água não faturada / perdas técnicas e comerciais</p>
          </div>
        </div>

        {/* Progress bar */}
        {totalPumpedM3 > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <span>Água Faturada: {totalInvoicedM3} m³</span>
              <span>Perdas na Rede: {waterLossM3} m³</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="bg-sky-600 h-full transition-all"
                style={{ width: `${Math.min(100, efficiencyRate)}%` }}
                title={`Faturado: ${efficiencyRate}%`}
              />
              <div
                className="bg-rose-400 h-full transition-all"
                style={{ width: `${Math.min(100, lossPercentage)}%` }}
                title={`Perdas: ${lossPercentage}%`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Two columns: Recent Invoices & Pending Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices list */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Faturas Recentes de Água</h3>
              <p className="text-xs text-slate-500">Últimas leituras e faturas calculadas com base no m³</p>
            </div>
            <button
              onClick={() => setActiveTab('invoices')}
              className="text-xs font-bold text-sky-600 hover:text-sky-800 cursor-pointer"
            >
              Ver Todas ({invoices.length}) →
            </button>
          </div>

          {invoices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              Nenhuma fatura emitida ainda. Clique em &quot;Nova Fatura&quot; para começar.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5">Fatura</th>
                    <th className="py-2.5">Cliente</th>
                    <th className="py-2.5 text-center">Consumo (m³)</th>
                    <th className="py-2.5 text-right">Preço/m³</th>
                    <th className="py-2.5 text-right">Total</th>
                    <th className="py-2.5 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {invoices.slice(0, 5).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-bold text-sky-700">{inv.invoiceNumber}</td>
                      <td className="py-3">
                        <div className="font-semibold text-slate-900">{inv.clientName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{inv.meterNumber}</div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="font-bold text-slate-900">{inv.consumptionM3}</span>{' '}
                        <span className="text-[10px] text-slate-500">m³</span>
                      </td>
                      <td className="py-3 text-right font-mono">
                        {inv.unitPriceM3.toFixed(2)} {settings.currency}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900">
                        {inv.totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
                        {settings.currency}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status === 'paid' ? 'Pago' : inv.status === 'pending' ? 'Pendente' : inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pending & Quick Action Summary */}
        <div className="space-y-6">
          {/* Pending Alerts */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm">Cobranças Pendentes</h3>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-amber-900 mb-4">
              <div className="text-xl font-black">{pendingInvoices.length}</div>
              <p className="text-xs text-amber-800 mt-0.5">
                Total pendente de:{' '}
                <span className="font-bold">
                  {pendingInvoices
                    .reduce((a, b) => a + (b.totalAmount || 0), 0)
                    .toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
                  {settings.currency}
                </span>
              </p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pode marcar pagamentos como recebidos (M-Pesa, E-Mola ou Numerário) e emitir recibos com quitação no módulo de faturas.
            </p>
          </div>

          {/* Manhiça Neighborhoods representation */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-2">Bairros Atendidos na Manhiça</h3>
            <div className="flex flex-wrap gap-1.5">
              {['Ribínguè', 'Manhiça Sede', 'Nhambalo', 'Maluana', 'Xinavane', 'Chibututuine'].map((b) => (
                <span
                  key={b}
                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-100"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
