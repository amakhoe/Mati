'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  Ban,
  X,
  ShieldCheck,
  Coins,
  Droplets,
  FileSpreadsheet,
  Mail,
  AlertTriangle,
  BellRing,
} from 'lucide-react';
import {
  Invoice,
  Client,
  SystemSettings,
  InvoiceStatus,
  isInvoiceOverdue,
  getDaysOverdue,
} from '@/types/water-system';
import { MonthlyReportModal } from '@/components/MonthlyReportModal';
import { EmailReminderModal } from '@/components/EmailReminderModal';

interface InvoicesManagerProps {
  invoices: Invoice[];
  clients?: Client[];
  settings: SystemSettings;
  onOpenNewInvoice: () => void;
  onPrintInvoice: (invoice: Invoice) => void;
  onUpdateStatus: (id: string, status: InvoiceStatus, method?: string) => Promise<void>;
  onCancelInvoice?: (id: string, reason?: string) => Promise<void>;
  onDeleteInvoice?: (id: string) => Promise<void>;
  onReminderSent?: (invoiceId: string, email: string) => Promise<void>;
  onUpdateClientEmail?: (clientId: string, email: string) => Promise<void>;
}

export function InvoicesManager({
  invoices,
  clients = [],
  settings,
  onOpenNewInvoice,
  onPrintInvoice,
  onUpdateStatus,
  onCancelInvoice,
  onDeleteInvoice,
  onReminderSent,
  onUpdateClientEmail,
}: InvoicesManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Cancellation modal state (invoices cannot be deleted, only cancelled)
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<Invoice | null>(null);
  const [cancellationReason, setCancellationReason] = useState('Retificação de leitura do hidrómetro');

  // Email reminder modal state
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedInvoiceForReminder, setSelectedInvoiceForReminder] = useState<Invoice | null>(null);

  // Current date in YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().substring(0, 10), []);

  // Extract distinct months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((i) => {
      if (i.periodMonth) set.add(i.periodMonth);
    });
    return Array.from(set).sort().reverse();
  }, [invoices]);

  // Separate active invoices from cancelled invoices
  const activeInvoices = useMemo(() => invoices.filter((i) => i.status !== 'cancelled'), [invoices]);
  const cancelledCount = useMemo(() => invoices.filter((i) => i.status === 'cancelled').length, [invoices]);

  // Overdue calculations based on current date (excludes cancelled)
  const overdueInvoices = useMemo(() => {
    return activeInvoices.filter((i) => isInvoiceOverdue(i, todayStr));
  }, [activeInvoices, todayStr]);

  const overdueCount = overdueInvoices.length;
  const overdueAmount = overdueInvoices.reduce((a, b) => a + (b.totalAmount || 0), 0);

  const pendingCount = useMemo(() => {
    return activeInvoices.filter((i) => i.status === 'pending' && !isInvoiceOverdue(i, todayStr)).length;
  }, [activeInvoices, todayStr]);

  const paidCount = useMemo(() => {
    return activeInvoices.filter((i) => i.status === 'paid').length;
  }, [activeInvoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      const matchesSearch =
        i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.meterNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMonth = monthFilter === 'ALL' || i.periodMonth === monthFilter;

      let matchesStatus = true;
      if (statusFilter === 'ALL') {
        matchesStatus = true;
      } else if (statusFilter === 'active_only') {
        matchesStatus = i.status !== 'cancelled';
      } else if (statusFilter === 'cancelled') {
        matchesStatus = i.status === 'cancelled';
      } else if (statusFilter === 'overdue') {
        matchesStatus = isInvoiceOverdue(i, todayStr);
      } else if (statusFilter === 'pending') {
        matchesStatus = i.status === 'pending' && !isInvoiceOverdue(i, todayStr);
      } else if (statusFilter === 'all_pending') {
        matchesStatus = (i.status === 'pending' || isInvoiceOverdue(i, todayStr)) && i.status !== 'cancelled';
      } else if (statusFilter === 'paid') {
        matchesStatus = i.status === 'paid';
      } else {
        matchesStatus = i.status === statusFilter;
      }

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [invoices, searchTerm, statusFilter, monthFilter, todayStr]);

  const handleTogglePaid = async (inv: Invoice) => {
    if (inv.status === 'cancelled') return; // Cancelled invoices cannot be toggled
    const newStatus: InvoiceStatus = inv.status === 'paid' ? 'pending' : 'paid';
    const method = newStatus === 'paid' ? 'M-Pesa' : undefined;
    setProcessingId(inv.id);
    try {
      await onUpdateStatus(inv.id, newStatus, method);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenCancelModal = (inv: Invoice) => {
    setInvoiceToCancel(inv);
    setCancellationReason('Retificação de leitura do hidrómetro');
    setCancelModalOpen(true);
  };

  const handleConfirmCancellation = async () => {
    if (!invoiceToCancel) return;
    setProcessingId(invoiceToCancel.id);
    try {
      if (onCancelInvoice) {
        await onCancelInvoice(invoiceToCancel.id, cancellationReason.trim() || 'Cancelada no sistema');
      } else if (onDeleteInvoice) {
        await onDeleteInvoice(invoiceToCancel.id);
      }
      setCancelModalOpen(false);
      setInvoiceToCancel(null);
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenReminder = (inv: Invoice) => {
    setSelectedInvoiceForReminder(inv);
    setReminderModalOpen(true);
  };

  // Find client record for selected invoice to pass contact/email
  const selectedClient = useMemo(() => {
    if (!selectedInvoiceForReminder) return null;
    return clients.find((c) => c.id === selectedInvoiceForReminder.clientId) || null;
  }, [selectedInvoiceForReminder, clients]);

  // Export CSV handler
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      alert('Não existem faturas para exportar com os filtros atuais.');
      return;
    }

    const headers = [
      'Nº Fatura',
      'Cliente',
      'Email do Cliente',
      'Nº Contador / Hidrómetro',
      'Mês de Referência',
      'Data de Leitura',
      'Data Limite',
      'Estado de Vencimento',
      'Dias em Atraso',
      'Leitura Anterior (m³)',
      'Leitura Atual (m³)',
      'Consumo (m³)',
      `Preço Unitário / m³ (${settings.currency})`,
      `Subtotal Consumo (${settings.currency})`,
      `Taxa Fixa (${settings.currency})`,
      `Total Faturado (${settings.currency})`,
      'Estado',
      'Lembrete Enviado em',
      'Data de Pagamento',
      'Método de Pagamento',
      'Observações',
    ];

    const rows = filteredInvoices.map((inv) => {
      const overdue = isInvoiceOverdue(inv, todayStr);
      const days = overdue ? getDaysOverdue(inv.dueDate, todayStr) : 0;
      return [
        `"${inv.invoiceNumber}"`,
        `"${inv.clientName.replace(/"/g, '""')}"`,
        `"${inv.clientEmail || ''}"`,
        `"${inv.meterNumber}"`,
        `"${inv.periodMonth}"`,
        `"${inv.readingDate || ''}"`,
        `"${inv.dueDate || ''}"`,
        `"${overdue ? 'VENCIDA' : inv.status === 'paid' ? 'PAGA' : 'NO PRAZO'}"`,
        days,
        inv.previousReading,
        inv.currentReading,
        inv.consumptionM3,
        inv.unitPriceM3.toFixed(2),
        inv.subtotal.toFixed(2),
        inv.fixedFee.toFixed(2),
        inv.totalAmount.toFixed(2),
        `"${inv.status === 'paid' ? 'Pago' : inv.status === 'cancelled' ? 'Cancelada' : overdue ? 'Vencido' : 'Pendente'}"`,
        `"${inv.reminderSentAt ? inv.reminderSentAt.substring(0, 19).replace('T', ' ') : ''}"`,
        `"${inv.paidAt ? inv.paidAt.substring(0, 10) : ''}"`,
        `"${inv.paymentMethod || ''}"`,
        `"${(inv.cancellationReason ? `[Cancelada: ${inv.cancellationReason}] ` : '') + (inv.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const periodLabel = monthFilter === 'ALL' ? 'todas' : monthFilter;
    const dateLabel = new Date().toISOString().substring(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `faturas_aguas_manhica_${periodLabel}_${dateLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Summary of filtered active invoices (excluding cancelled ones)
  const activeFiltered = filteredInvoices.filter((i) => i.status !== 'cancelled');
  const totalVolume = activeFiltered.reduce((a, b) => a + (b.consumptionM3 || 0), 0);
  const totalAmount = activeFiltered.reduce((a, b) => a + (b.totalAmount || 0), 0);
  const totalPaid = activeFiltered
    .filter((i) => i.status === 'paid')
    .reduce((a, b) => a + (b.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-slate-900">Faturamento & Cobranças de Água</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              {invoices.length} Registadas
            </span>
            {overdueCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>{overdueCount} em Atraso</span>
              </span>
            )}
            {cancelledCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                <Ban className="w-3 h-3 text-slate-500" />
                <span>{cancelledCount} Canceladas</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Numeração padronizada (ex: 0012026), arquivo fiscal protegido contra eliminação e cobranças de água
          </p>
        </div>

        {/* Action Buttons: New Invoice, Export CSV, Export PDF */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <button
            onClick={handleExportCSV}
            title="Descarregar ficheiro CSV compatível com Excel / Sheets com dados de vencimento e lembretes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 shadow-xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setReportModalOpen(true)}
            title="Gerar e imprimir relatório executivo em PDF com discriminação de faturas"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Exportar PDF</span>
          </button>

          <button
            onClick={onOpenNewInvoice}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Fatura (m³)</span>
          </button>
        </div>
      </div>

      {/* Audit & Compliance Policy Callout */}
      <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-sky-950 gap-3 shadow-2xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="leading-relaxed">
            <span className="font-bold block text-slate-900">
              Conformidade Contábil: Registo Contínuo e Auditável de Faturas
            </span>
            <span className="text-[11px] text-slate-600">
              O número da fatura segue o padrão oficial (Nº e ano fiscal, ex: <strong>0012026</strong>). Por segurança jurídica e auditoria, as faturas <strong>não podem ser apagadas do sistema</strong>, apenas canceladas formalmente.
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-sky-800 text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap self-start sm:self-auto shadow-2xs">
          processado por computador
        </span>
      </div>

      {/* Metric Cards including Overdue Highlight Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overdue Card */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'ALL' : 'overdue')}
          className={`p-4 rounded-xl border shadow-xs transition-all cursor-pointer ${
            statusFilter === 'overdue'
              ? 'bg-rose-100/80 border-rose-400 ring-2 ring-rose-400'
              : 'bg-rose-50/70 hover:bg-rose-100/60 border-rose-200'
          }`}
          title="Clique para filtrar faturas vencidas em relação à data atual"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Faturas Vencidas</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
              {overdueCount}
            </span>
          </div>
          <div className="text-lg font-black text-rose-900 mt-2">
            {overdueAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
            <span className="text-xs font-bold text-rose-700">{settings.currency}</span>
          </div>
          <div className="text-[11px] text-rose-700 font-medium mt-1 flex items-center justify-between">
            <span>Ultrapassaram a data limite ({todayStr})</span>
            <span className="underline font-bold text-[10px]">
              {statusFilter === 'overdue' ? 'Limpar filtro' : 'Filtrar'}
            </span>
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Volume Faturado</div>
            <div className="text-lg font-black text-slate-900">
              {totalVolume.toLocaleString()} <span className="text-xs text-slate-500 font-bold">m³</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Na seleção atual</div>
          </div>
        </div>

        {/* Total Faturado */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Valor Total Faturado</div>
            <div className="text-lg font-black text-slate-900">
              {totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs text-slate-500 font-bold">{settings.currency}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{filteredInvoices.length} faturas listadas</div>
          </div>
        </div>

        {/* Quitado / Recebido */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Valor Recebido / Quitado</div>
            <div className="text-lg font-black text-emerald-700">
              {totalPaid.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
              <span className="text-xs text-emerald-600 font-bold">{settings.currency}</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
              {paidCount} liquidadas
            </div>
          </div>
        </div>
      </div>

      {/* Quick Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Todas ({invoices.length})
        </button>

        <button
          onClick={() => setStatusFilter('overdue')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'overdue'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Vencidas / Em Atraso ({overdueCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('pending')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>No Prazo ({pendingCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter('paid')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'paid'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Pagas ({paidCount})</span>
        </button>

        {cancelledCount > 0 && (
          <button
            onClick={() => setStatusFilter(statusFilter === 'cancelled' ? 'ALL' : 'cancelled')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'cancelled'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <Ban className="w-3.5 h-3.5 text-slate-500" />
            <span>Canceladas ({cancelledCount})</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por fatura, cliente ou contador..."
            className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
          />
        </div>

        <div>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="ALL">Todos os Meses</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                Mês: {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white font-medium"
          >
            <option value="ALL">Filtro: Todas as Faturas ({invoices.length})</option>
            <option value="active_only">Ativas / Sem Canceladas ({activeInvoices.length})</option>
            <option value="overdue">⚠️ Apenas Vencidas (Em Atraso) ({overdueCount})</option>
            <option value="pending">⏳ Apenas Pendentes no Prazo ({pendingCount})</option>
            <option value="all_pending">📋 Todas as Pendentes ({pendingCount + overdueCount})</option>
            <option value="paid">✅ Pagas / Liquidadas ({paidCount})</option>
            <option value="cancelled">🚫 Canceladas ({cancelledCount})</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Nenhuma fatura encontrada</p>
            <p className="text-xs text-slate-400 mt-1">
              {statusFilter === 'overdue'
                ? 'Excelente notícia! Não existem faturas em atraso com base na data atual.'
                : 'Altere os filtros de pesquisa ou emita uma nova fatura.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Fatura / Mês</th>
                  <th className="py-3.5 px-4">Cliente / Hidrómetro</th>
                  <th className="py-3.5 px-4 text-center">Vencimento</th>
                  <th className="py-3.5 px-4 text-center">Leituras (m³)</th>
                  <th className="py-3.5 px-4 text-center">Consumo (m³)</th>
                  <th className="py-3.5 px-4 text-right">Preço / m³</th>
                  <th className="py-3.5 px-4 text-right">Total Faturado</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredInvoices.map((inv) => {
                  const overdue = isInvoiceOverdue(inv, todayStr);
                  const daysOverdue = overdue ? getDaysOverdue(inv.dueDate, todayStr) : 0;

                  const isCancelled = inv.status === 'cancelled';

                  return (
                    <tr
                      key={inv.id}
                      className={`transition-colors ${
                        isCancelled
                          ? 'bg-slate-50/90 text-slate-500 opacity-80'
                          : overdue
                          ? 'bg-rose-50/70 hover:bg-rose-100/60 border-l-4 border-l-rose-500'
                          : 'hover:bg-sky-50/40'
                      }`}
                    >
                      {/* Fatura */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono font-bold text-xs ${
                            isCancelled ? 'text-slate-500 line-through' : 'text-sky-800'
                          }`}>
                            {inv.invoiceNumber}
                          </span>
                          {isCancelled ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-200 text-slate-700 uppercase tracking-tight border border-slate-300">
                              Cancelada
                            </span>
                          ) : overdue ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-600 text-white uppercase tracking-tight">
                              Atraso
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Mês: <strong>{inv.periodMonth}</strong>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3.5 px-4">
                        <div className={`font-bold text-xs ${isCancelled ? 'text-slate-600' : 'text-slate-900'}`}>
                          {inv.clientName}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>Contador: {inv.meterNumber}</span>
                          {inv.clientEmail && (
                            <span className="text-slate-400 font-sans">({inv.clientEmail})</span>
                          )}
                        </div>
                        {inv.reminderSentAt && !isCancelled && (
                          <div className="mt-1">
                            <span
                              title={`Lembrete enviado em ${new Date(inv.reminderSentAt).toLocaleString('pt-MZ')}`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-100 text-sky-800 border border-sky-200"
                            >
                              <BellRing className="w-2.5 h-2.5 text-sky-600" />
                              <span>Lembrete ({inv.reminderCount || 1}x)</span>
                            </span>
                          </div>
                        )}
                        {isCancelled && inv.cancellationReason && (
                          <div className="mt-1 text-[10px] text-rose-700 italic">
                            Motivo: {inv.cancellationReason}
                          </div>
                        )}
                      </td>

                      {/* Vencimento e Destaque de Atraso */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-xs font-semibold ${
                              isCancelled
                                ? 'text-slate-400'
                                : overdue
                                ? 'text-rose-700 font-bold'
                                : 'text-slate-700'
                            }`}
                          >
                            {inv.dueDate || 'N/D'}
                          </span>
                          {isCancelled ? (
                            <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                              Sem efeito fiscal
                            </span>
                          ) : overdue ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 mt-0.5">
                              <AlertTriangle className="w-3 h-3 text-rose-500" />
                              <span>{daysOverdue} dias em atraso</span>
                            </span>
                          ) : inv.status === 'paid' ? (
                            <span className="text-[10px] text-emerald-600 font-medium mt-0.5">
                              Liquidado
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 mt-0.5">Dentro do prazo</span>
                          )}
                        </div>
                      </td>

                      {/* Leituras */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="text-[11px] text-slate-500">
                          {inv.previousReading} → <strong>{inv.currentReading}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400">m³ lidos</div>
                      </td>

                      {/* Consumo */}
                      <td className="py-3.5 px-4 text-center">
                        <div className={`font-black text-sm ${isCancelled ? 'text-slate-500' : 'text-sky-900'}`}>
                          {inv.consumptionM3} <span className="text-[10px] text-slate-500 font-normal">m³</span>
                        </div>
                      </td>

                      {/* Preço Unitário Manual */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        <div className="font-bold text-amber-950 bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200 text-xs">
                          {inv.unitPriceM3.toFixed(2)} {settings.currency}/m³
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 text-right">
                        <div className={`font-black text-sm ${
                          isCancelled ? 'text-slate-400 line-through' : 'text-slate-900'
                        }`}>
                          {inv.totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
                          {settings.currency}
                        </div>
                        {inv.fixedFee > 0 && (
                          <div className="text-[10px] text-slate-400">
                            (inclui taxa {inv.fixedFee} {settings.currency})
                          </div>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 text-center">
                        {isCancelled ? (
                          <span
                            title={`Fatura cancelada: ${inv.cancellationReason || 'Cancelada no sistema'}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300"
                          >
                            <Ban className="w-3 h-3 text-slate-500" />
                            <span>CANCELADA</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleTogglePaid(inv)}
                            disabled={processingId === inv.id}
                            title="Clique para alternar entre Pago e Pendente"
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 ${
                              inv.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : overdue
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 font-black ring-1 ring-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {inv.status === 'paid' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>PAGO ({inv.paymentMethod || 'OK'})</span>
                              </>
                            ) : overdue ? (
                              <>
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>VENCIDA ({daysOverdue}d)</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>PENDENTE</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão Enviar Lembrete por Email */}
                          {!isCancelled && (
                            <button
                              onClick={() => handleOpenReminder(inv)}
                              title={
                                inv.status === 'paid'
                                  ? 'Enviar recibo / confirmação por email ao cliente'
                                  : overdue
                                  ? 'Enviar notificação de cobrança de fatura em atraso por email'
                                  : 'Enviar lembrete de pagamento por email ao cliente'
                              }
                              className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                overdue
                                  ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 shadow-2xs'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                              }`}
                            >
                              <Mail className="w-3.5 h-3.5 text-amber-600" />
                              <span className="hidden md:inline">Lembrete</span>
                            </button>
                          )}

                          {/* Botão Baixar / Ver Fatura */}
                          <button
                            onClick={() => onPrintInvoice(inv)}
                            title="Baixar Fatura (PDF / HTML) ou Imprimir"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sky-800 hover:text-white hover:bg-sky-600 bg-sky-50 rounded-lg transition-all border border-sky-200 text-xs font-bold cursor-pointer shadow-2xs hover:shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Baixar / Ver</span>
                          </button>

                          {/* Botão Cancelar Fatura (Faturas não podem ser apagadas, apenas canceladas) */}
                          {isCancelled ? (
                            <span
                              title={`Fatura já cancelada no sistema (${inv.cancelledAt ? new Date(inv.cancelledAt).toLocaleDateString('pt-MZ') : 'data anterior'}) - Mantida no arquivo para auditoria`}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed text-xs"
                            >
                              <Ban className="w-3.5 h-3.5 text-slate-400" />
                              <span className="hidden lg:inline text-[10px]">Cancelada</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleOpenCancelModal(inv)}
                              disabled={processingId === inv.id}
                              title="Cancelar Fatura (por lei, faturas não podem ser apagadas do sistema, apenas canceladas)"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Rodapé Fiscal Obrigatório */}
            <div className="text-center text-xs font-semibold tracking-wider uppercase text-slate-400 py-3 border-t border-slate-200 bg-slate-50/40">
              processado por computador
            </div>
          </div>
        )}
      </div>

      {/* Monthly Report PDF Modal */}
      <MonthlyReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        invoices={filteredInvoices}
        settings={settings}
        selectedMonth={monthFilter}
      />

      {/* Email Reminder Modal */}
      <EmailReminderModal
        isOpen={reminderModalOpen}
        onClose={() => {
          setReminderModalOpen(false);
          setSelectedInvoiceForReminder(null);
        }}
        invoice={selectedInvoiceForReminder}
        client={selectedClient}
        settings={settings}
        onReminderSent={onReminderSent}
        onUpdateClientEmail={onUpdateClientEmail}
      />

      {/* Invoice Cancellation Modal (Invoices cannot be deleted, only cancelled) */}
      {cancelModalOpen && invoiceToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-rose-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-rose-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cancelar Fatura de Água</h3>
                  <p className="text-[11px] text-rose-700">
                    Fatura nº <strong className="font-mono">{invoiceToCancel.invoiceNumber}</strong> • {invoiceToCancel.clientName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCancelModalOpen(false);
                  setInvoiceToCancel(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Compliance & Audit Policy Warning */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block font-bold">Documento protegido contra eliminação:</strong>
                  Por conformidade regulamentar e fiscal, as faturas de água <strong>não podem ser apagadas do sistema</strong>, apenas canceladas formalmente. O registo é preservado no histórico de auditoria com estado &quot;Cancelada&quot;.
                </div>
              </div>

              {/* Invoice details recap */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Valor da Fatura:</span>
                  <span className="font-black font-mono text-slate-900 text-sm">
                    {invoiceToCancel.totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} {settings.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Mês de Referência:</span>
                  <span className="font-bold text-slate-800">{invoiceToCancel.periodMonth}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Hidrómetro do Cliente:</span>
                  <span className="font-mono text-slate-800">{invoiceToCancel.meterNumber}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Volume Faturado:</span>
                  <span className="font-semibold text-slate-800">{invoiceToCancel.consumptionM3} m³</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Motivo Formal do Cancelamento *
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Ex: Erro de introdução na leitura do hidrómetro; Emissão em duplicado; Substituída por refaturação correta..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  O motivo ficará gravado no registo da fatura para efeito de consulta fiscal e auditoria.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                  processado por computador
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCancelModalOpen(false);
                      setInvoiceToCancel(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    disabled={!cancellationReason.trim() || processingId === invoiceToCancel.id}
                    onClick={handleConfirmCancellation}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {processingId === invoiceToCancel.id ? (
                      <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                    ) : (
                      <Ban className="w-3.5 h-3.5" />
                    )}
                    <span>Confirmar Cancelamento</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
