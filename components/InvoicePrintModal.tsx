'use client';

import React from 'react';
import { X, Printer, Droplets, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Invoice, SystemSettings } from '@/types/water-system';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  settings: SystemSettings;
}

export function InvoicePrintModal({ invoice, onClose, settings }: InvoicePrintModalProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-sky-100 flex flex-col">
        {/* Modal Controls Bar (hidden during print) */}
        <div className="print:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-bold text-slate-800">Visualizar / Imprimir Fatura de Água</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
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

        {/* Printable Invoice Document */}
        <div id="printable-invoice" className="p-8 space-y-6 text-slate-800 bg-white">
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
                <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-x-4">
                  <span><strong>NUIT:</strong> {settings.companyNuit}</span>
                  <span><strong>Tel:</strong> {settings.companyPhone}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs uppercase font-extrabold tracking-wider text-sky-700">
                FATURA DE CONSUMO DE ÁGUA
              </div>
              <div className="text-lg font-black font-mono text-slate-900">
                {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Mês Ref.: <strong>{invoice.periodMonth}</strong>
              </div>
            </div>
          </div>

          {/* Client & Period Information */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
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
            </div>

            <div className="text-right space-y-0.5">
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
                <span className="font-extrabold uppercase">
                  {invoice.status === 'paid' ? 'PAGO / QUITADO' : 'PENDENTE DE PAGAMENTO'}
                </span>
              </div>
            </div>
          </div>

          {/* Water Meter Readings & Consumption Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Discriminação de Consumo de Água (m³)
            </h4>
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

          {/* Total & Status Stamp */}
          <div className="flex items-center justify-between p-4 bg-sky-900 text-white rounded-xl">
            <div>
              {invoice.status === 'paid' ? (
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    Fatura Paga ({invoice.paymentMethod || 'Caixa'}) •{' '}
                    {invoice.paidAt ? invoice.paidAt.substring(0, 10) : ''}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Clock className="w-5 h-5" />
                  <span>Pendente de Pagamento • Pague até {invoice.dueDate}</span>
                </div>
              )}
              <div className="text-[11px] text-sky-200 mt-0.5">
                {settings.paymentInstructions}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-sky-300 uppercase font-semibold">Total da Fatura</span>
              <div className="text-2xl font-black font-mono text-white">
                {invoice.totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
                {settings.currency}
              </div>
            </div>
          </div>

          {/* Tear-off slip for receipt */}
          <div className="pt-4 border-t-2 border-dashed border-slate-300 text-xs">
            <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-semibold mb-2">
              <span>Talão Destacável • Recibo do Cliente / Caixa</span>
              <span>Águas da Manhiça</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center text-slate-700">
              <div>
                <div><strong>Fatura:</strong> {invoice.invoiceNumber} • <strong>Mês:</strong> {invoice.periodMonth}</div>
                <div><strong>Cliente:</strong> {invoice.clientName} (Contador: {invoice.meterNumber})</div>
              </div>
              <div className="text-right">
                <div className="text-base font-black font-mono text-slate-900">
                  {invoice.totalAmount.toFixed(2)} {settings.currency}
                </div>
                <div className="text-[10px] text-slate-500">
                  {invoice.status === 'paid' ? 'QUITADO' : 'A PAGAR'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
