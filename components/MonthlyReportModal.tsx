'use client';

import React from 'react';
import { X, Printer, Droplets, Download, FileSpreadsheet, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { Invoice, SystemSettings } from '@/types/water-system';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  settings: SystemSettings;
  selectedMonth: string;
}

export function MonthlyReportModal({
  isOpen,
  onClose,
  invoices,
  settings,
  selectedMonth,
}: MonthlyReportModalProps) {
  if (!isOpen) return null;

  const totalVolume = invoices.reduce((a, b) => a + (b.consumptionM3 || 0), 0);
  const totalAmount = invoices.reduce((a, b) => a + (b.totalAmount || 0), 0);
  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const totalPaid = paidInvoices.reduce((a, b) => a + (b.totalAmount || 0), 0);
  const pendingInvoices = invoices.filter((i) => i.status === 'pending');
  const totalPending = pendingInvoices.reduce((a, b) => a + (b.totalAmount || 0), 0);
  const recoveryRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-sky-100 flex flex-col">
        {/* Controls Bar (hidden during print) */}
        <div className="print:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-800">
              Relatório Executivo de Faturamento (Exportar PDF)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Section */}
        <div className="p-8 space-y-6 text-slate-900 bg-white">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-sky-600 pb-5">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                <Droplets className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {settings.companyName || 'Águas da Manhiça'}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {settings.communityName || 'Vila da Manhiça, Província de Maputo'}
                </p>
                <div className="text-[11px] text-slate-500 mt-1 flex gap-4">
                  <span><strong>NUIT:</strong> {settings.companyNuit}</span>
                  <span><strong>Contacto:</strong> {settings.companyPhone}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs uppercase font-extrabold tracking-wider text-sky-700 block">
                RELATÓRIO MENSAL DE FATURAMENTO
              </span>
              <div className="text-sm font-bold text-slate-700 mt-1">
                Período: {selectedMonth === 'ALL' ? 'Todos os Meses' : selectedMonth}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Emitido a: {new Date().toLocaleDateString('pt-MZ')}
              </div>
            </div>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Faturas Emitidas</span>
              <span className="text-lg font-black text-slate-900">{invoices.length}</span>
              <span className="text-[10px] text-slate-500 block">Consumidores</span>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Volume Total (m³)</span>
              <span className="text-lg font-black text-sky-700">
                {totalVolume.toLocaleString()} <span className="text-xs font-normal">m³</span>
              </span>
              <span className="text-[10px] text-slate-500 block">Faturado em hidrómetros</span>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor Faturado</span>
              <span className="text-lg font-black text-slate-900">
                {totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
                <span className="text-xs font-normal">{settings.currency}</span>
              </span>
              <span className="text-[10px] text-slate-500 block">Total líquido</span>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Valor Cobrado</span>
              <span className="text-lg font-black text-emerald-600">
                {totalPaid.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
                <span className="text-xs font-normal">{settings.currency}</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                {recoveryRate}% de arrecadação
              </span>
            </div>
          </div>

          {/* Detailed Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Listagem Discriminada de Faturas do Período
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-sky-50/80 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 border-b border-slate-200">Nº Fatura</th>
                    <th className="p-2.5 border-b border-slate-200">Cliente</th>
                    <th className="p-2.5 border-b border-slate-200">Hidrómetro</th>
                    <th className="p-2.5 text-center border-b border-slate-200">Leituras (m³)</th>
                    <th className="p-2.5 text-center border-b border-slate-200">Consumo (m³)</th>
                    <th className="p-2.5 text-right border-b border-slate-200">Preço/m³</th>
                    <th className="p-2.5 text-right border-b border-slate-200">Total ({settings.currency})</th>
                    <th className="p-2.5 text-center border-b border-slate-200">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono font-bold text-sky-800 text-[11px]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="p-2 font-semibold text-slate-900">{inv.clientName}</td>
                      <td className="p-2 font-mono text-slate-500 text-[11px]">{inv.meterNumber}</td>
                      <td className="p-2 text-center text-[11px] text-slate-600 font-mono">
                        {inv.previousReading} → {inv.currentReading}
                      </td>
                      <td className="p-2 text-center font-bold text-slate-900">
                        {inv.consumptionM3} m³
                      </td>
                      <td className="p-2 text-right font-mono text-[11px]">
                        {inv.unitPriceM3.toFixed(2)}
                      </td>
                      <td className="p-2 text-right font-black font-mono text-slate-900">
                        {inv.totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={4} className="p-2.5 text-right uppercase text-[10px]">
                      Totais Gerais:
                    </td>
                    <td className="p-2.5 text-center font-black text-sky-900">
                      {totalVolume.toLocaleString()} m³
                    </td>
                    <td></td>
                    <td className="p-2.5 text-right font-black font-mono text-slate-900">
                      {totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
                      {settings.currency}
                    </td>
                    <td className="p-2.5 text-center text-[10px] text-slate-600">
                      {paidInvoices.length} pagos / {pendingInvoices.length} pendentes
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Signature & Validation Box */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-xs border-t border-slate-200">
            <div className="text-center pt-8 border-t border-dashed border-slate-400">
              <span className="font-bold text-slate-800 block">Responsável pelo Faturamento</span>
              <span className="text-[11px] text-slate-400">Operador do Sistema • Manhiça</span>
            </div>
            <div className="text-center pt-8 border-t border-dashed border-slate-400">
              <span className="font-bold text-slate-800 block">Aprovação da Gerência</span>
              <span className="text-[11px] text-slate-400">
                Águas da Manhiça • Carimbo & Data
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
