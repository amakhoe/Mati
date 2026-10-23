'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Download,
  FileDown,
  Droplets,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Invoice, SystemSettings } from '@/types/water-system';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  settings: SystemSettings;
}

export function InvoicePrintModal({ invoice, onClose, settings }: InvoicePrintModalProps) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Allow closing via Escape key
  useEffect(() => {
    if (!invoice) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [invoice, onClose]);

  if (!invoice) return null;

  // Handle direct PDF generation and download
  const handleDownloadPdf = async () => {
    const element = document.getElementById('printable-invoice');
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
      pdf.save(`Fatura-${invoice.invoiceNumber}.pdf`);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Falha ao gerar PDF via canvas, a usar fallback HTML:', err);
      handleDownloadHtml();
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Fallback: download standalone self-contained printable document (.html)
  const handleDownloadHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <title>Fatura ${invoice.invoiceNumber} - ${settings.companyName || 'Águas da Manhiça'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; color: #1e293b; background: #f8fafc; }
    .card { max-width: 720px; margin: 0 auto; background: white; padding: 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px; }
    .company { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; }
    .subtitle { font-size: 12px; color: #64748b; margin: 4px 0 0 0; }
    .inv-title { font-size: 11px; font-weight: 800; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; }
    .inv-num { font-size: 18px; font-weight: 900; font-family: monospace; color: #0f172a; }
    .grid-info { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 12px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
    th { background: #f0f9ff; color: #334155; font-weight: 700; padding: 10px; text-align: left; border-bottom: 1px solid #cbd5e1; font-size: 10px; text-transform: uppercase; }
    td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-family: monospace; }
    .total-box { background: #0c4a6e; color: white; padding: 16px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .total-amount { font-size: 22px; font-weight: 900; font-family: monospace; }
    .footer-stamp { text-align: center; font-size: 11px; text-transform: uppercase; font-weight: 600; color: #64748b; padding-top: 12px; border-top: 1px solid #e2e8f0; }
    .cancelled-banner { background: #ffe4e6; border: 2px dashed #f43f5e; color: #881337; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 12px; }
    @media print { body { background: white; margin: 0; } .card { box-shadow: none; border: none; padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <h1 class="company">${settings.companyName || 'Águas da Manhiça'}</h1>
        <p class="subtitle">${settings.communityName || 'Vila da Manhiça, Província de Maputo'}</p>
        <p class="subtitle"><strong>NUIT:</strong> ${settings.companyNuit || 'N/D'} | <strong>Tel:</strong> ${settings.companyPhone || 'N/D'}</p>
      </div>
      <div style="text-align: right;">
        <div class="inv-title">FATURA DE ÁGUA</div>
        <div class="inv-num">${invoice.invoiceNumber}</div>
        <div class="subtitle">Mês Ref.: <strong>${invoice.periodMonth}</strong></div>
      </div>
    </div>

    ${
      invoice.status === 'cancelled'
        ? `<div class="cancelled-banner"><strong>FATURA CANCELADA NO SISTEMA</strong><br>Motivo: ${
            invoice.cancellationReason || 'Cancelamento formal'
          } (Sem efeito fiscal)</div>`
        : ''
    }

    <div class="grid-info">
      <div>
        <strong>Cliente Consumidor:</strong> ${invoice.clientName}<br>
        <strong>Nº do Hidrómetro:</strong> ${invoice.meterNumber}
      </div>
      <div style="text-align: right;">
        <strong>Data de Leitura:</strong> ${invoice.readingDate || 'N/D'}<br>
        <strong>Data Limite:</strong> ${invoice.dueDate || 'N/D'}<br>
        <strong>Estado:</strong> ${
          invoice.status === 'paid'
            ? 'PAGO / QUITADO'
            : invoice.status === 'cancelled'
            ? 'CANCELADA'
            : 'PENDENTE'
        }
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Leitura Anterior</th>
          <th>Leitura Atual</th>
          <th style="text-align: center;">Consumo</th>
          <th style="text-align: right;">Preço/m³</th>
          <th style="text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${invoice.previousReading} m³</td>
          <td><strong>${invoice.currentReading} m³</strong></td>
          <td style="text-align: center; font-weight: bold; color: #0369a1;">${invoice.consumptionM3} m³</td>
          <td style="text-align: right;">${invoice.unitPriceM3.toFixed(2)} ${settings.currency}</td>
          <td style="text-align: right; font-weight: bold;">${invoice.subtotal.toFixed(2)} ${settings.currency}</td>
        </tr>
        ${
          invoice.fixedFee > 0
            ? `<tr>
                <td colspan="4" style="text-align: right; font-family: sans-serif; font-size: 11px;">Taxa Fixa de Conservação e Disponibilidade:</td>
                <td style="text-align: right; font-weight: bold;">${invoice.fixedFee.toFixed(2)} ${settings.currency}</td>
               </tr>`
            : ''
        }
      </tbody>
    </table>

    <div class="total-box">
      <div>
        <div style="font-size: 11px; text-transform: uppercase; color: #bae6fd;">Total da Fatura</div>
        <div style="font-size: 11px; color: #e0f2fe;">${
          invoice.status === 'paid'
            ? 'Quitado / Confirmado'
            : invoice.status === 'cancelled'
            ? 'Cancelada no Sistema'
            : settings.paymentInstructions || 'Pagar dentro do prazo limite'
        }</div>
      </div>
      <div class="total-amount">${invoice.totalAmount.toFixed(2)} ${settings.currency}</div>
    </div>

    <div class="footer-stamp">
      processado por computador
    </div>
  </div>
  <script>
    window.onload = function() {
      // Auto-focus print option if desired
    };
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Fatura-${invoice.invoiceNumber}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
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
        // Exit/close modal if user clicks the backdrop overlay
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[94vh] flex flex-col border border-sky-100 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
        {/* Sticky Top Controls Bar (Never scrolls out of view) */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onClose}
              title="Sair da Fatura / Voltar para a lista (ou prima ESC)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Sair</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-800 truncate">
              <span className="text-slate-400">•</span>
              <span className="font-mono text-sky-800 font-black">{invoice.invoiceNumber}</span>
              <span className="text-slate-500 font-normal truncate">({invoice.clientName})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Action: Baixar Fatura (PDF) */}
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              title="Baixar Fatura oficial em ficheiro PDF para o computador ou telemóvel"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>A baixar...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Baixado!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar PDF</span>
                </>
              )}
            </button>

            {/* Print / Save */}
            <button
              onClick={handlePrint}
              title="Imprimir fatura ou salvar via diálogo do navegador"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            {/* Prominent Exit (X) Button */}
            <button
              onClick={onClose}
              title="Sair da fatura (ESC)"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
          <div
            id="printable-invoice"
            className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white rounded-xl shadow-xs border border-slate-200"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-sky-600 pb-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Droplets className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    {settings.companyName || 'Águas da Manhiça'}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    {settings.communityName || 'Vila da Manhiça, Província de Maputo'}
                  </p>
                  <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-4">
                    <span><strong>NUIT:</strong> {settings.companyNuit}</span>
                    <span><strong>Tel:</strong> {settings.companyPhone}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-sky-700">
                  FATURA DE CONSUMO DE ÁGUA
                </div>
                <div className="text-lg sm:text-xl font-black font-mono text-slate-900">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Mês Ref.: <strong>{invoice.periodMonth}</strong>
                </div>
              </div>
            </div>

            {/* Client & Period Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Dados do Consumidor
                </span>
                <div className="font-extrabold text-sm text-slate-900 mt-0.5">
                  {invoice.clientName}
                </div>
                <div className="mt-1 font-mono text-slate-700">
                  <strong>Hidrómetro:</strong> {invoice.meterNumber}
                </div>
                {invoice.clientEmail && (
                  <div className="mt-0.5 text-slate-500 font-sans">
                    <strong>Email:</strong> {invoice.clientEmail}
                  </div>
                )}
              </div>

              <div className="sm:text-right space-y-0.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Prazos & Datas
                </span>
                <div>
                  <strong>Data de Leitura:</strong> {invoice.readingDate || 'N/D'}
                </div>
                <div>
                  <strong>Data Limite:</strong>{' '}
                  <span className="font-bold text-rose-600">{invoice.dueDate || 'N/D'}</span>
                </div>
                <div>
                  <strong>Estado:</strong>{' '}
                  <span
                    className={`font-extrabold uppercase ${
                      invoice.status === 'cancelled'
                        ? 'text-rose-600'
                        : invoice.status === 'paid'
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {invoice.status === 'paid'
                      ? 'PAGO / QUITADO'
                      : invoice.status === 'cancelled'
                      ? 'CANCELADA (SEM EFEITO FISCAL)'
                      : 'PENDENTE DE PAGAMENTO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancelled Banner if applicable */}
            {invoice.status === 'cancelled' && (
              <div className="p-3.5 bg-rose-50 border-2 border-dashed border-rose-300 rounded-xl text-rose-900 text-xs flex items-center justify-between">
                <div>
                  <span className="font-black uppercase tracking-wider block">Fatura Cancelada no Sistema</span>
                  <span className="text-[11px] text-rose-700">
                    Motivo: {invoice.cancellationReason || 'Cancelamento administrativo'}
                    {invoice.cancelledAt ? ` • Data: ${invoice.cancelledAt.substring(0, 10)}` : ''}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider shrink-0 ml-2">
                  Sem Efeito
                </span>
              </div>
            )}

            {/* Water Meter Readings & Consumption Details */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Discriminação de Consumo de Água (m³)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-sky-50 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 text-left border-b border-slate-200">Leitura Anterior</th>
                      <th className="p-2.5 text-left border-b border-slate-200">Leitura Atual</th>
                      <th className="p-2.5 text-center border-b border-slate-200">Volume Consumido</th>
                      <th className="p-2.5 text-right border-b border-slate-200">Preço / m³ (MT)</th>
                      <th className="p-2.5 text-right border-b border-slate-200">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
                    <tr>
                      <td className="p-2.5">{invoice.previousReading} m³</td>
                      <td className="p-2.5 font-bold">{invoice.currentReading} m³</td>
                      <td className="p-2.5 text-center font-black text-sky-800 bg-sky-50/40">
                        {invoice.consumptionM3} m³
                      </td>
                      <td className="p-2.5 text-right font-bold text-amber-900">
                        {invoice.unitPriceM3.toFixed(2)} {settings.currency}
                      </td>
                      <td className="p-2.5 text-right font-bold">
                        {invoice.subtotal.toFixed(2)} {settings.currency}
                      </td>
                    </tr>
                    {invoice.fixedFee > 0 && (
                      <tr className="text-slate-600 bg-slate-50/50">
                        <td colSpan={4} className="p-2.5 text-right font-sans text-xs">
                          Taxa Fixa de Disponibilidade e Conservação da Rede:
                        </td>
                        <td className="p-2.5 text-right font-bold font-mono">
                          {invoice.fixedFee.toFixed(2)} {settings.currency}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total & Status Stamp */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl text-white gap-3 ${
                invoice.status === 'cancelled'
                  ? 'bg-slate-700'
                  : 'bg-sky-900'
              }`}
            >
              <div>
                {invoice.status === 'cancelled' ? (
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs uppercase tracking-wider">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span>Fatura Cancelada • Registo Preservado para Auditoria</span>
                  </div>
                ) : invoice.status === 'paid' ? (
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>
                      Fatura Paga ({invoice.paymentMethod || 'Caixa'}) •{' '}
                      {invoice.paidAt ? invoice.paidAt.substring(0, 10) : ''}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-5 h-5 shrink-0" />
                    <span>Pendente de Pagamento • Pague até {invoice.dueDate}</span>
                  </div>
                )}
                <div className="text-[11px] text-sky-200 mt-0.5">
                  {settings.paymentInstructions}
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-white/20">
                <span className="text-[11px] text-sky-300 uppercase font-semibold">Total da Fatura</span>
                <div className="text-2xl font-black font-mono text-white">
                  {invoice.totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
                  {settings.currency}
                </div>
              </div>
            </div>

            {/* Rodapé da Fatura Principal Obrigatório */}
            <div className="text-center text-xs font-semibold tracking-wider uppercase text-slate-500 pt-3 border-t border-slate-200">
              processado por computador
            </div>

            {/* Tear-off slip for receipt */}
            <div className="pt-4 border-t-2 border-dashed border-slate-300 text-xs">
              <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-semibold mb-2">
                <span>Talão Destacável • Recibo do Cliente / Caixa</span>
                <span>Águas da Manhiça</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div>
                      <strong>Fatura:</strong> {invoice.invoiceNumber} • <strong>Mês:</strong> {invoice.periodMonth}
                    </div>
                    <div>
                      <strong>Cliente:</strong> {invoice.clientName} (Contador: {invoice.meterNumber})
                    </div>
                  </div>
                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <div className="text-base font-black font-mono text-slate-900">
                      {invoice.totalAmount.toFixed(2)} {settings.currency}
                    </div>
                    <div className="text-[10px] font-bold">
                      {invoice.status === 'paid'
                        ? 'QUITADO'
                        : invoice.status === 'cancelled'
                        ? 'CANCELADO'
                        : 'A PAGAR'}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Recibo / Talão Obrigatório */}
                <div className="text-center text-[10px] font-semibold tracking-wider uppercase text-slate-500 pt-2 mt-2 border-t border-dashed border-slate-200">
                  processado por computador
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions Bar (Guarantees user can always exit or download) */}
        <div className="sticky bottom-0 z-30 flex items-center justify-between p-3.5 sm:p-4 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-lg print:hidden">
          {/* Sair da Fatura */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-300 shadow-xs cursor-pointer hover:shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Sair da Fatura</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Fallback download HTML */}
            <button
              type="button"
              onClick={handleDownloadHtml}
              title="Baixar cópia da fatura em ficheiro HTML completo (offline)"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Baixar HTML</span>
            </button>

            {/* Main Download PDF */}
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
                  <span>Baixar Fatura (PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
