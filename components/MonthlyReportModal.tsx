'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Droplets,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Calendar,
  ArrowLeft,
  Loader2,
  FileDown,
} from 'lucide-react';
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
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeInvoices = invoices.filter((i) => i.status !== 'cancelled');
  const totalVolume = activeInvoices.reduce((a, b) => a + (b.consumptionM3 || 0), 0);
  const totalAmount = activeInvoices.reduce((a, b) => a + (b.totalAmount || 0), 0);
  const paidInvoices = activeInvoices.filter((i) => i.status === 'paid');
  const totalPaid = paidInvoices.reduce((a, b) => a + (b.totalAmount || 0), 0);
  const pendingInvoices = activeInvoices.filter((i) => i.status === 'pending');
  const cancelledCount = invoices.filter((i) => i.status === 'cancelled').length;
  const totalPending = pendingInvoices.reduce((a, b) => a + (b.totalAmount || 0), 0);
  const recoveryRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  const handleDownloadPdf = async () => {
    const element = document.getElementById('printable-report');
    if (!element) return;

    setDownloadingPdf(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Relatorio-Faturamento-${selectedMonth}.pdf`);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Falha ao gerar PDF, a usar fallback para impressão:', err);
      handlePrint();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      handleDownloadPdf();
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col border border-sky-100 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
        {/* Sticky Header Bar (Always visible) */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              title="Sair do Relatório (ESC)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Sair</span>
            </button>
            <span className="text-xs font-bold text-slate-800 hidden sm:inline">
              Relatório Executivo de Faturamento
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>A baixar...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Baixado!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              title="Sair (ESC)"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Section */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
          <div
            id="printable-report"
            className="p-6 sm:p-8 space-y-6 text-slate-900 bg-white rounded-xl shadow-xs border border-slate-200"
          >
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
                  <p className="text-[11px] text-slate-400 mt-1">
                    NUIT: {settings.companyNuit} • Tel: {settings.companyPhone}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase font-extrabold tracking-wider text-sky-700">
                  RELATÓRIO MENSAL DE FATURAÇÃO
                </div>
                <div className="text-base font-black text-slate-900 mt-1">
                  Mês de Referência: {selectedMonth === 'ALL' ? 'Geral / Consolidado' : selectedMonth}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Emitido em: {new Date().toLocaleDateString('pt-MZ')}
                </div>
              </div>
            </div>

            {/* Summary KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Volume Consumido
                </span>
                <span className="text-lg font-black text-slate-900">
                  {totalVolume.toLocaleString()}{' '}
                  <span className="text-xs font-normal text-slate-500">m³</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Total Faturado
                </span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  {totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
                  <span className="text-xs font-normal text-slate-500">{settings.currency}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 uppercase font-bold block">
                  Total Recebido
                </span>
                <span className="text-lg font-black text-emerald-700 font-mono">
                  {totalPaid.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
                  <span className="text-xs font-normal text-emerald-600">{settings.currency}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-sky-700 uppercase font-bold block">
                  Taxa de Cobrança
                </span>
                <span className="text-lg font-black text-sky-800">{recoveryRate}%</span>
              </div>
            </div>

            {/* Invoices Breakdown Table */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3">
                Discriminação Detalhada de Faturas ({invoices.length} registos)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 font-bold uppercase text-[10px] text-slate-700">
                    <tr>
                      <th className="p-2.5 text-left">Fatura</th>
                      <th className="p-2.5 text-left">Cliente</th>
                      <th className="p-2.5 text-left">Contador</th>
                      <th className="p-2.5 text-center">Leitura</th>
                      <th className="p-2.5 text-center">Consumo (m³)</th>
                      <th className="p-2.5 text-right">Preço/m³</th>
                      <th className="p-2.5 text-right">Total ({settings.currency})</th>
                      <th className="p-2.5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className={inv.status === 'cancelled' ? 'bg-slate-50 text-slate-400 line-through' : ''}
                      >
                        <td className="p-2.5 font-bold text-sky-800">{inv.invoiceNumber}</td>
                        <td className="p-2.5 font-sans font-medium text-slate-900">{inv.clientName}</td>
                        <td className="p-2.5">{inv.meterNumber}</td>
                        <td className="p-2.5 text-center">
                          {inv.previousReading} → {inv.currentReading}
                        </td>
                        <td className="p-2.5 text-center font-bold">{inv.consumptionM3}</td>
                        <td className="p-2.5 text-right">{inv.unitPriceM3.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-black">
                          {inv.totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-center font-sans font-bold text-[10px]">
                          {inv.status === 'paid' ? (
                            <span className="text-emerald-700">PAGO</span>
                          ) : inv.status === 'cancelled' ? (
                            <span className="text-rose-600">CANCELADA</span>
                          ) : (
                            <span className="text-amber-700">PENDENTE</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={4} className="p-2.5 text-right uppercase text-[10px]">
                        Totais Gerais (Ativas):
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
                        {cancelledCount > 0 ? ` (${cancelledCount} canceladas)` : ''}
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

            {/* Rodapé Oficial Requerido */}
            <div className="text-center text-xs font-semibold tracking-wider uppercase text-slate-500 pt-4 border-t border-slate-200 mt-6">
              processado por computador
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions Bar */}
        <div className="sticky bottom-0 z-30 flex items-center justify-between p-3.5 sm:p-4 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-300 shadow-xs cursor-pointer hover:shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Sair do Relatório</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            {downloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>A Gerar PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar Relatório (PDF)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
