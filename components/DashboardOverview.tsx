'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  FileText,
  Droplets,
  Coins,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Mail,
  PlusCircle,
  CheckCircle2,
  Clock,
  Gauge,
  Activity,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Client,
  Invoice,
  WaterStationConsumption,
  SystemSettings,
  isInvoiceOverdue,
} from '@/types/water-system';
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

  // Stats calculation (excludes cancelled invoices)
  const activeClientsCount = clients.filter((c) => c.status === 'active').length;
  const currentMonthInvoices = invoices.filter((i) => i.periodMonth === currentMonth && i.status !== 'cancelled');

  const totalInvoicedM3 = currentMonthInvoices.reduce((acc, curr) => acc + (curr.consumptionM3 || 0), 0);
  const totalBilledMT = currentMonthInvoices.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalCollectedMT = invoices
    .filter((i) => i.status === 'paid' && i.periodMonth === currentMonth)
    .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const pendingInvoices = invoices.filter((i) => i.status === 'pending');
  const overdueInvoices = useMemo(
    () => invoices.filter((i) => i.status !== 'cancelled' && isInvoiceOverdue(i)),
    [invoices]
  );
  const overdueTotalAmount = useMemo(
    () => overdueInvoices.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0),
    [overdueInvoices]
  );

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

  // Hydration safety for Recharts ResponsiveContainer in Next.js using useSyncExternalStore
  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [chartMode, setChartMode] = useState<'all' | 'clients' | 'stations'>('all');

  const formatMonthLabel = (m: string) => {
    if (!m) return '';
    const parts = m.split('-');
    if (parts.length === 2) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${months[monthIndex] || parts[1]}/${year.slice(2)}`;
    }
    return m;
  };

  // Compute monthly trend data for the bar chart
  const chartData = useMemo(() => {
    const monthsSet = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.periodMonth) monthsSet.add(inv.periodMonth);
    });
    stations.forEach((st) => {
      if (st.periodMonth) monthsSet.add(st.periodMonth);
    });

    // If database has very little historical data, ensure at least current and previous months show up
    if (monthsSet.size === 0) {
      monthsSet.add(currentMonth);
    }

    const sortedMonths = Array.from(monthsSet).sort();
    const recentMonths = sortedMonths.slice(-12);

    return recentMonths.map((m) => {
      const clientVolume = invoices
        .filter((inv) => inv.periodMonth === m)
        .reduce((acc, curr) => acc + (curr.consumptionM3 || 0), 0);
      const stationVolume = stations
        .filter((st) => st.periodMonth === m)
        .reduce((acc, curr) => acc + (curr.pumpedVolumeM3 || 0), 0);
      const billingMT = invoices
        .filter((inv) => inv.periodMonth === m)
        .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

      return {
        periodMonth: m,
        monthLabel: formatMonthLabel(m),
        consumoClientes: Math.round(clientVolume * 10) / 10,
        volumeBombeado: Math.round(stationVolume * 10) / 10,
        faturamentoMT: billingMT,
      };
    });
  }, [invoices, stations, currentMonth]);

  // Key trend metrics
  const totalTrackedClientVolume = chartData.reduce((acc, curr) => acc + curr.consumoClientes, 0);
  const averageClientVolume =
    chartData.length > 0 ? Math.round(totalTrackedClientVolume / chartData.length) : 0;
  const peakMonthItem = [...chartData].sort((a, b) => b.consumoClientes - a.consumoClientes)[0];

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

      {/* Overdue Invoices Alert Banner */}
      {overdueInvoices.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-rose-950 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900">
                  {overdueInvoices.length} Fatura{overdueInvoices.length > 1 ? 's' : ''} Vencida{overdueInvoices.length > 1 ? 's' : ''} em Atraso
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                  Ação Necessária
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-0.5">
                Total acumulado em dívida de{' '}
                <strong>
                  {overdueTotalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
                  {settings.currency}
                </strong>
                . Pode filtrar faturas atrasadas e enviar lembretes formais por email aos clientes.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('invoices')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm hover:shadow"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Ver Faturas & Enviar Lembretes</span>
          </button>
        </div>
      )}

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

      {/* Monthly Water Consumption Trend Bar Chart (Recharts) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Consumo e Tendência Mensal de Água (m³)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                  Recharts Analytics
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evolução do volume consumido em hidrómetros de clientes vs volume injetado pelos postos de bombagem
              </p>
            </div>
          </div>

          {/* Chart Controls & Filter Pill */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setChartMode('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                chartMode === 'all'
                  ? 'bg-white text-sky-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Comparativo Geral
            </button>
            <button
              type="button"
              onClick={() => setChartMode('clients')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                chartMode === 'clients'
                  ? 'bg-white text-sky-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Apenas Clientes (m³)
            </button>
            <button
              type="button"
              onClick={() => setChartMode('stations')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                chartMode === 'stations'
                  ? 'bg-white text-sky-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Apenas Postos (m³)
            </button>
          </div>
        </div>

        {/* Quick summary metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-sky-50/50 p-3.5 rounded-xl border border-sky-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Consumo Médio Mensal</span>
            <span className="text-xl font-black text-sky-900">
              {averageClientVolume.toLocaleString()} <span className="text-xs font-bold text-slate-500">m³ / mês</span>
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Média calculada sobre o histórico registrado</span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block">Pico de Consumo Registrado</span>
            <span className="text-xl font-black text-slate-900">
              {peakMonthItem?.consumoClientes?.toLocaleString() || 0} <span className="text-xs font-bold text-slate-500">m³</span>
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Mês: {peakMonthItem?.monthLabel || 'N/D'}
            </span>
          </div>

          <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
            <span className="text-[11px] font-semibold text-slate-500 block">Volume Total Acumulado</span>
            <span className="text-xl font-black text-indigo-950">
              {totalTrackedClientVolume.toLocaleString()} <span className="text-xs font-bold text-indigo-700">m³</span>
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Soma de todo o histórico no gráfico</span>
          </div>
        </div>

        {/* Recharts Bar Chart Container */}
        <div className="pt-2">
          {!isMounted ? (
            <div className="h-72 w-full flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400 animate-pulse">
              A carregar gráfico de tendência de consumo...
            </div>
          ) : chartData.length === 0 || (totalTrackedClientVolume === 0 && totalPumpedM3 === 0) ? (
            <div className="h-64 w-full flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-100 text-center p-6 text-slate-400">
              <BarChart3 className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Sem histórico suficiente para exibir o gráfico</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Registe novas faturas com consumo em m³ ou carregue os dados de demonstração nas configurações para visualizar a tendência mensal.
              </p>
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  barGap={8}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    unit=" m³"
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[210px]">
                            <div className="font-bold border-b border-slate-800 pb-1.5 flex items-center justify-between text-slate-200">
                              <span>Período:</span>
                              <span className="font-mono text-sky-400">{data.monthLabel} ({data.periodMonth})</span>
                            </div>
                            <div className="space-y-1">
                              {(chartMode === 'all' || chartMode === 'clients') && (
                                <div className="flex items-center justify-between gap-3 text-sky-200">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 inline-block" />
                                    Consumo Clientes:
                                  </span>
                                  <span className="font-bold font-mono text-white">
                                    {data.consumoClientes.toLocaleString()} m³
                                  </span>
                                </div>
                              )}
                              {(chartMode === 'all' || chartMode === 'stations') && (
                                <div className="flex items-center justify-between gap-3 text-indigo-200">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500 inline-block" />
                                    Volume Bombeado:
                                  </span>
                                  <span className="font-bold font-mono text-white">
                                    {data.volumeBombeado.toLocaleString()} m³
                                  </span>
                                </div>
                              )}
                            </div>
                            {data.faturamentoMT > 0 && (
                              <div className="pt-1.5 border-t border-slate-800 text-[11px] text-emerald-400 flex items-center justify-between">
                                <span>Faturamento:</span>
                                <span className="font-bold font-mono">
                                  {data.faturamentoMT.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} {settings.currency}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 16, fontSize: '12px' }}
                    formatter={(value) => <span className="text-slate-700 font-semibold text-xs">{value}</span>}
                  />
                  {(chartMode === 'all' || chartMode === 'clients') && (
                    <Bar
                      dataKey="consumoClientes"
                      name="Consumo dos Clientes (m³)"
                      fill="#0284c7"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  )}
                  {(chartMode === 'all' || chartMode === 'stations') && (
                    <Bar
                      dataKey="volumeBombeado"
                      name="Volume Bombeado no Posto (m³)"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
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
