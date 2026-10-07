'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  CheckCircle2,
  Clock,
  Trash2,
  Coins,
  Droplets,
  DollarSign,
  Download,
} from 'lucide-react';
import { Invoice, SystemSettings, InvoiceStatus } from '@/types/water-system';

interface InvoicesManagerProps {
  invoices: Invoice[];
  settings: SystemSettings;
  onOpenNewInvoice: () => void;
  onPrintInvoice: (invoice: Invoice) => void;
  onUpdateStatus: (id: string, status: InvoiceStatus, method?: string) => Promise<void>;
  onDeleteInvoice: (id: string) => Promise<void>;
}

export function InvoicesManager({
  invoices,
  settings,
  onOpenNewInvoice,
  onPrintInvoice,
  onUpdateStatus,
  onDeleteInvoice,
}: InvoicesManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Extract distinct months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((i) => {
      if (i.periodMonth) set.add(i.periodMonth);
    });
    return Array.from(set).sort().reverse();
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((i) => {
      const matchesSearch =
        i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.meterNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
      const matchesMonth = monthFilter === 'ALL' || i.periodMonth === monthFilter;

      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [invoices, searchTerm, statusFilter, monthFilter]);

  const handleTogglePaid = async (inv: Invoice) => {
    const newStatus: InvoiceStatus = inv.status === 'paid' ? 'pending' : 'paid';
    const method = newStatus === 'paid' ? 'M-Pesa' : undefined;
    setProcessingId(inv.id);
    try {
      await onUpdateStatus(inv.id, newStatus, method);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (inv: Invoice) => {
    if (confirm(`Eliminar a fatura ${inv.invoiceNumber} do cliente ${inv.clientName}?`)) {
      setProcessingId(inv.id);
      try {
        await onDeleteInvoice(inv.id);
      } finally {
        setProcessingId(null);
      }
    }
  };

  // Summary of filtered invoices
  const totalVolume = filteredInvoices.reduce((a, b) => a + (b.consumptionM3 || 0), 0);
  const totalAmount = filteredInvoices.reduce((a, b) => a + (b.totalAmount || 0), 0);
  const totalPaid = filteredInvoices
    .filter((i) => i.status === 'paid')
    .reduce((a, b) => a + (b.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Faturamento & Cobranças de Água</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              {invoices.length} Emitidas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cálculo de consumo em m³ com inserção manual do tarifário por metro cúbico
          </p>
        </div>

        <button
          onClick={onOpenNewInvoice}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Emitir Nova Fatura (m³)</span>
        </button>
      </div>

      {/* Mini metric pills for filtered view */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Volume Faturado na Seleção</div>
            <div className="text-lg font-black text-slate-900">
              {totalVolume.toLocaleString()} <span className="text-xs text-slate-500 font-bold">m³</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Valor Total Faturado</div>
            <div className="text-lg font-black text-slate-900">
              {totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} {settings.currency}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Valor Recebido / Quitado</div>
            <div className="text-lg font-black text-emerald-700">
              {totalPaid.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} {settings.currency}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
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
            className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="ALL">Todos os Estados</option>
            <option value="pending">Pendente</option>
            <option value="paid">Pago (Quitado)</option>
            <option value="overdue">Vencido</option>
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
              Emita a primeira fatura para iniciar o controlo de cobranças.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Fatura / Mês</th>
                  <th className="py-3.5 px-4">Cliente / Hidrómetro</th>
                  <th className="py-3.5 px-4 text-center">Leituras (m³)</th>
                  <th className="py-3.5 px-4 text-center">Consumo (m³)</th>
                  <th className="py-3.5 px-4 text-right">Preço Manual / m³</th>
                  <th className="py-3.5 px-4 text-right">Total Facturado</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-sky-50/40 transition-colors">
                    {/* Fatura */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-sky-800 text-xs">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Mês: <strong>{inv.periodMonth}</strong>
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">{inv.clientName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Contador: {inv.meterNumber}
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
                      <div className="font-black text-sky-900 text-sm">
                        {inv.consumptionM3} <span className="text-[10px] text-slate-500 font-normal">m³</span>
                      </div>
                    </td>

                    {/* Preço Unitário Manual */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <div className="font-bold text-amber-950 bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200">
                        {inv.unitPriceM3.toFixed(2)} {settings.currency}/m³
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-black text-slate-900 text-sm">
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
                      <button
                        onClick={() => handleTogglePaid(inv)}
                        disabled={processingId === inv.id}
                        title="Clique para alternar entre Pago e Pendente"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {inv.status === 'paid' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>PAGO ({inv.paymentMethod || 'OK'})</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>PENDENTE</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onPrintInvoice(inv)}
                          title="Imprimir Fatura / Ver Recibo Oficial"
                          className="p-1.5 text-sky-700 hover:text-sky-900 hover:bg-sky-100 rounded-lg transition-colors border border-sky-200"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv)}
                          disabled={processingId === inv.id}
                          title="Eliminar Fatura"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
