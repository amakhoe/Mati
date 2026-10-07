'use client';

import React, { useState } from 'react';
import { X, Save, FileText, Coins } from 'lucide-react';
import { Client, Invoice, SystemSettings, InvoiceStatus } from '@/types/water-system';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoiceData: Omit<Invoice, 'id'>) => Promise<void>;
  clients: Client[];
  settings: SystemSettings;
  preselectedClient?: Client | null;
}

export function InvoiceModal({
  isOpen,
  onClose,
  onSave,
  clients,
  settings,
  preselectedClient,
}: InvoiceModalProps) {
  if (!isOpen) return null;

  return (
    <InvoiceModalForm
      onClose={onClose}
      onSave={onSave}
      clients={clients}
      settings={settings}
      preselectedClient={preselectedClient}
    />
  );
}

function InvoiceModalForm({
  onClose,
  onSave,
  clients,
  settings,
  preselectedClient,
}: {
  onClose: () => void;
  onSave: (invoiceData: Omit<Invoice, 'id'>) => Promise<void>;
  clients: Client[];
  settings: SystemSettings;
  preselectedClient?: Client | null;
}) {
  const defaultClient = preselectedClient || (clients.length > 0 ? clients[0] : null);

  const [clientId, setClientId] = useState<string>(() => defaultClient?.id || '');

  const [invoiceNumber, setInvoiceNumber] = useState(() => {
    const now = new Date();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    return `FAT-${now.getFullYear()}-${randomCode}`;
  });

  const [periodMonth, setPeriodMonth] = useState(() => new Date().toISOString().substring(0, 7));

  const [previousReading, setPreviousReading] = useState<number>(() => {
    return defaultClient ? defaultClient.currentMeterReading ?? defaultClient.initialMeterReading ?? 0 : 0;
  });

  const [currentReading, setCurrentReading] = useState<number>(() => {
    const prev = defaultClient ? defaultClient.currentMeterReading ?? defaultClient.initialMeterReading ?? 0 : 0;
    return prev + 12;
  });

  // Manual unit price per m³ as explicitly requested by user
  const [unitPriceM3, setUnitPriceM3] = useState<number>(() => settings.defaultUnitPriceM3 || 45.0);
  const [fixedFee, setFixedFee] = useState<number>(() => settings.fixedMonthlyFee || 50.0);
  const [status, setStatus] = useState<InvoiceStatus>('pending');
  const [paymentMethod, setPaymentMethod] = useState('M-Pesa');
  const [readingDate, setReadingDate] = useState(() => new Date().toISOString().substring(0, 10));

  const [dueDate, setDueDate] = useState(() => {
    const due = new Date();
    due.setDate(due.getDate() + 20);
    return due.toISOString().substring(0, 10);
  });

  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === clientId) || defaultClient;

  const handleClientChange = (cId: string) => {
    setClientId(cId);
    const cl = clients.find((c) => c.id === cId);
    if (cl) {
      const prev = cl.currentMeterReading ?? cl.initialMeterReading ?? 0;
      setPreviousReading(prev);
      if (currentReading <= prev) {
        setCurrentReading(prev + 12);
      }
    }
  };

  // Calculations
  const consumptionM3 = Math.max(0, Number((currentReading - previousReading).toFixed(2)));
  const subtotal = Math.max(0, Number((consumptionM3 * (unitPriceM3 || 0)).toFixed(2)));
  const totalAmount = Math.max(0, Number((subtotal + (fixedFee || 0)).toFixed(2)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      setError('Por favor selecione um cliente da lista.');
      return;
    }
    if (currentReading < previousReading) {
      setError('A leitura atual não pode ser inferior à leitura anterior do hidrómetro.');
      return;
    }
    if (unitPriceM3 < 0) {
      setError('O preço por metro cúbico não pode ser negativo.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        invoiceNumber,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        meterNumber: selectedClient.meterNumber,
        periodMonth,
        previousReading: Number(previousReading),
        currentReading: Number(currentReading),
        consumptionM3,
        unitPriceM3: Number(unitPriceM3),
        subtotal,
        fixedFee: Number(fixedFee),
        totalAmount,
        status,
        readingDate,
        dueDate,
        paidAt: status === 'paid' ? new Date().toISOString() : null,
        paymentMethod: status === 'paid' ? paymentMethod : undefined,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao emitir a fatura.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-sky-100">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-sky-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Nova Fatura de Água</h3>
              <p className="text-xs text-slate-500">
                Faturamento com inserção manual do preço por metro cúbico (m³)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="m-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Cliente Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selecionar Cliente Consumidor *
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white font-medium"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.meterNumber} ({c.neighborhood})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nº da Fatura
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full text-sm py-2 px-3 font-mono font-bold text-sky-800 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {selectedClient && (
            <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-100 flex flex-wrap items-center justify-between text-xs text-sky-900 gap-2">
              <div>
                <span className="font-semibold">Bairro:</span> {selectedClient.neighborhood}
              </div>
              <div>
                <span className="font-semibold">Hidrómetro:</span> {selectedClient.meterNumber}
              </div>
              <div>
                <span className="font-semibold">Telefone:</span> {selectedClient.phone || 'Sem contacto'}
              </div>
            </div>
          )}

          {/* Dates & Reference Month */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mês de Referência *
              </label>
              <input
                type="month"
                required
                value={periodMonth}
                onChange={(e) => setPeriodMonth(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data da Leitura
              </label>
              <input
                type="date"
                required
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data Limite de Pagamento
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
          </div>

          {/* Readings: Previous vs Current */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Leitura Anterior (m³)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={previousReading}
                onChange={(e) => setPreviousReading(parseFloat(e.target.value) || 0)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400">Leitura do mês anterior</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Leitura Atual (m³) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={currentReading}
                onChange={(e) => setCurrentReading(parseFloat(e.target.value) || 0)}
                className="w-full text-sm py-2 px-3 border border-sky-400 ring-1 ring-sky-300 rounded-lg bg-white font-bold text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-[10px] text-sky-600 font-medium">Lida no hidrómetro do cliente</span>
            </div>

            <div className="bg-sky-100/60 p-3 rounded-lg flex flex-col justify-center border border-sky-200">
              <span className="text-[11px] font-semibold text-sky-800">Consumo Calculado:</span>
              <div className="text-xl font-black text-sky-950">
                {consumptionM3} <span className="text-xs font-bold text-sky-700">m³</span>
              </div>
              <span className="text-[10px] text-sky-700">(= Atual - Anterior)</span>
            </div>
          </div>

          {/* MANUAL PRICE PER M3 SECTION */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>Preço por Metro Cúbico (Inserção Manual)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900">
                Entrada Manual Livre
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Preço por m³ ({settings.currency} / m³) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={unitPriceM3}
                    onChange={(e) => setUnitPriceM3(parseFloat(e.target.value) || 0)}
                    className="w-full text-base font-bold py-2 px-3 border border-amber-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    {settings.currency}/m³
                  </span>
                </div>
                {/* Shortcut buttons */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-amber-800 font-medium">Atalhos:</span>
                  {[35, 40, 45, 50, 60].map((pr) => (
                    <button
                      key={pr}
                      type="button"
                      onClick={() => setUnitPriceM3(pr)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                        unitPriceM3 === pr
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      {pr} MT
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Taxa Fixa de Manutenção ({settings.currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={fixedFee}
                    onChange={(e) => setFixedFee(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm font-semibold py-2 px-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    {settings.currency}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Taxa fixa de disponibilidade e conservação
                </span>
              </div>
            </div>
          </div>

          {/* Total Summary Breakdown Box */}
          <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Resumo do Faturamento
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span>
                Consumo: {consumptionM3} m³ × {unitPriceM3.toFixed(2)} {settings.currency}/m³
              </span>
              <span className="font-mono">{subtotal.toFixed(2)} {settings.currency}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-300">
              <span>Taxa Fixa de Conservação</span>
              <span className="font-mono">{fixedFee.toFixed(2)} {settings.currency}</span>
            </div>
            <div className="pt-2 border-t border-slate-700 flex justify-between items-baseline text-white">
              <span className="text-sm font-bold">Total a Pagar:</span>
              <span className="text-xl font-black text-sky-400 font-mono">
                {totalAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}{' '}
                {settings.currency}
              </span>
            </div>
          </div>

          {/* Status & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado da Fatura
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white font-medium"
              >
                <option value="pending">Pendente de Pagamento</option>
                <option value="paid">Pago (Cobrado no Momento)</option>
                <option value="overdue">Vencido</option>
              </select>
            </div>

            {status === 'paid' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Método de Pagamento Utilizado
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="M-Pesa">M-Pesa (Vodacom)</option>
                  <option value="E-Mola">E-Mola (Movitel)</option>
                  <option value="Numerário / Caixa">Numerário / Caixa (Guiché)</option>
                  <option value="Transferência Bancária">Transferência Bancária / Ponto 24</option>
                </select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações da Fatura
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Leitura confirmada pelo leitor de campo; Notificado por SMS"
              className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Emitir Fatura</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
