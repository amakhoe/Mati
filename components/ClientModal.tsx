'use client';

import React, { useState } from 'react';
import { X, Save, User } from 'lucide-react';
import { Client, MANHICA_NEIGHBORHOODS, ClientStatus } from '@/types/water-system';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Omit<Client, 'id'>) => Promise<void>;
  editingClient?: Client | null;
}

export function ClientModal({ isOpen, onClose, onSave, editingClient }: ClientModalProps) {
  if (!isOpen) return null;

  return (
    <ClientModalForm
      onClose={onClose}
      onSave={onSave}
      editingClient={editingClient}
    />
  );
}

function ClientModalForm({
  onClose,
  onSave,
  editingClient,
}: {
  onClose: () => void;
  onSave: (clientData: Omit<Client, 'id'>) => Promise<void>;
  editingClient?: Client | null;
}) {
  const isEditing = !!editingClient;

  const [name, setName] = useState(() => editingClient?.name || '');
  const [meterNumber, setMeterNumber] = useState(() => {
    if (editingClient?.meterNumber) return editingClient.meterNumber;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `HID-MAN-${randomSuffix}`;
  });
  const [phone, setPhone] = useState(() => editingClient?.phone || '+258 8');
  const [identityNumber, setIdentityNumber] = useState(() => editingClient?.identityNumber || '');

  const [neighborhood, setNeighborhood] = useState<string>(() => {
    if (editingClient?.neighborhood) {
      if (MANHICA_NEIGHBORHOODS.includes(editingClient.neighborhood as any)) {
        return editingClient.neighborhood;
      }
      return 'Outro';
    }
    return MANHICA_NEIGHBORHOODS[0];
  });

  const [customNeighborhood, setCustomNeighborhood] = useState(() => {
    if (editingClient?.neighborhood && !MANHICA_NEIGHBORHOODS.includes(editingClient.neighborhood as any)) {
      return editingClient.neighborhood;
    }
    return '';
  });

  const [address, setAddress] = useState(() => editingClient?.address || '');
  const [status, setStatus] = useState<ClientStatus>(() => editingClient?.status || 'active');
  const [joinDate, setJoinDate] = useState(() => editingClient?.joinDate || new Date().toISOString().substring(0, 10));
  const [initialMeterReading, setInitialMeterReading] = useState<number>(() => editingClient?.initialMeterReading || 0);
  const [currentMeterReading, setCurrentMeterReading] = useState<number>(() => editingClient?.currentMeterReading || 0);
  const [notes, setNotes] = useState(() => editingClient?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor insira o nome completo do cliente.');
      return;
    }
    if (!meterNumber.trim()) {
      setError('Por favor insira o número do hidrómetro/contador.');
      return;
    }

    const finalNeighborhood = neighborhood === 'Outro' ? customNeighborhood.trim() || 'Manhiça' : neighborhood;

    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        meterNumber: meterNumber.trim().toUpperCase(),
        phone: phone.trim(),
        identityNumber: identityNumber.trim(),
        neighborhood: finalNeighborhood,
        address: address.trim(),
        status,
        joinDate,
        initialMeterReading: Number(initialMeterReading) || 0,
        currentMeterReading: Number(currentMeterReading) || Number(initialMeterReading) || 0,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao guardar dados do cliente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-sky-100">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-sky-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEditing ? 'Editar Cliente' : 'Registar Novo Cliente'}
              </h3>
              <p className="text-xs text-slate-500">Comunidade e Bairros de Manhiça</p>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo do Cliente *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ex: Armando Bento Sitoe"
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* Hidrometro / Contador */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nº de Hidrómetro (Contador) *
              </label>
              <input
                type="text"
                required
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                placeholder="ex: HID-MAN-0106"
                className="w-full text-sm py-2 px-3 font-mono uppercase border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* Contacto / Telefone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contacto Telefónico (M-Pesa / E-Mola)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ex: +258 84 123 4567"
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* BI ou NUIT */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nº de BI ou NUIT
              </label>
              <input
                type="text"
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
                placeholder="ex: 1102938472M"
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* Bairro em Manhiça */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bairro da Manhiça *
              </label>
              <select
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
              >
                {MANHICA_NEIGHBORHOODS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
                <option value="Outro">Outro Bairro...</option>
              </select>
            </div>

            {neighborhood === 'Outro' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Outro Bairro
                </label>
                <input
                  type="text"
                  value={customNeighborhood}
                  onChange={(e) => setCustomNeighborhood(e.target.value)}
                  placeholder="Nome da zona/bairro na Manhiça"
                  className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            {/* Endereço / Ponto de Referência */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Endereço / Ponto de Referência
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ex: Rua das Mangueiras, Quarteirão 4, Casa 12"
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* Leitura Inicial (m³) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Leitura Inicial do Hidrómetro (m³)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={initialMeterReading}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setInitialMeterReading(val);
                  if (!isEditing) setCurrentMeterReading(val);
                }}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* Leitura Atual (m³) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Leitura Atual do Hidrómetro (m³)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={currentMeterReading}
                onChange={(e) => setCurrentMeterReading(parseFloat(e.target.value) || 0)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* Data de Adesão */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Ligação / Adesão
              </label>
              <input
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* Estado do Cliente */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado da Ligação
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ClientStatus)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
              >
                <option value="active">Ativo (Abastecimento Normal)</option>
                <option value="inactive">Inativo (Sem consumo)</option>
                <option value="suspended">Suspenso (Corte temporário)</option>
              </select>
            </div>

            {/* Observações */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observações Técnicas / Notas
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tipo de instalação, diâmetro do tubo, observações sobre pressão..."
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
          </div>

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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isEditing ? 'Atualizar Cliente' : 'Guardar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
