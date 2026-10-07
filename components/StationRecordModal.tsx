'use client';

import React, { useState } from 'react';
import { X, Save, Gauge, Zap, Fuel, TestTube2 } from 'lucide-react';
import { WaterStationConsumption } from '@/types/water-system';

interface StationRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<WaterStationConsumption, 'id'>) => Promise<void>;
  editingRecord?: WaterStationConsumption | null;
}

const COMMON_STATIONS = [
  'Posto Central de Captação & Abastecimento (Manhiça Sede)',
  'Furo Comunitário de Ribínguè - Estação 01',
  'Furo Comunitário de Ribínguè - Estação 02',
  'Posto de Abastecimento de Nhambalo',
  'Estação de Bombeamento da Maluana',
  'Furo de Xinavane Sede',
  'Estação Elevatória de Chibututuine',
];

export function StationRecordModal({
  isOpen,
  onClose,
  onSave,
  editingRecord,
}: StationRecordModalProps) {
  if (!isOpen) return null;

  return (
    <StationRecordModalForm
      onClose={onClose}
      onSave={onSave}
      editingRecord={editingRecord}
    />
  );
}

function StationRecordModalForm({
  onClose,
  onSave,
  editingRecord,
}: {
  onClose: () => void;
  onSave: (data: Omit<WaterStationConsumption, 'id'>) => Promise<void>;
  editingRecord?: WaterStationConsumption | null;
}) {
  const isEditing = !!editingRecord;

  const [stationName, setStationName] = useState(() => {
    if (editingRecord?.stationName) {
      if (COMMON_STATIONS.includes(editingRecord.stationName)) {
        return editingRecord.stationName;
      }
      return 'Outro';
    }
    return COMMON_STATIONS[0];
  });

  const [customStationName, setCustomStationName] = useState(() => {
    if (editingRecord?.stationName && !COMMON_STATIONS.includes(editingRecord.stationName)) {
      return editingRecord.stationName;
    }
    return '';
  });

  const [periodMonth, setPeriodMonth] = useState(() => {
    return editingRecord?.periodMonth || new Date().toISOString().substring(0, 7);
  });

  const [initialPumpReading, setInitialPumpReading] = useState<number>(() => {
    return editingRecord?.initialPumpReading ?? 10000;
  });

  const [finalPumpReading, setFinalPumpReading] = useState<number>(() => {
    return editingRecord?.finalPumpReading ?? 11200;
  });

  const [operatingHours, setOperatingHours] = useState<number>(() => {
    return editingRecord?.operatingHours ?? 220;
  });

  const [energyKwh, setEnergyKwh] = useState<number>(() => {
    return editingRecord?.energyKwh ?? 1400;
  });

  const [fuelLiters, setFuelLiters] = useState<number>(() => {
    return editingRecord?.fuelLiters ?? 0;
  });

  const [chlorineKg, setChlorineKg] = useState<number>(() => {
    return editingRecord?.chlorineKg ?? 6.0;
  });

  const [notes, setNotes] = useState(() => editingRecord?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pumpedVolumeM3 = Math.max(0, Number((finalPumpReading - initialPumpReading).toFixed(2)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = stationName === 'Outro' ? customStationName.trim() : stationName;

    if (!finalName) {
      setError('Por favor indique o nome do posto ou furo de abastecimento.');
      return;
    }

    if (finalPumpReading < initialPumpReading) {
      setError('A leitura final do macromedidor da bomba não pode ser inferior à leitura inicial.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        stationId: finalName.toLowerCase().replace(/\s+/g, '-'),
        stationName: finalName,
        periodMonth,
        initialPumpReading: Number(initialPumpReading),
        finalPumpReading: Number(finalPumpReading),
        pumpedVolumeM3,
        operatingHours: Number(operatingHours) || 0,
        energyKwh: Number(energyKwh) || 0,
        fuelLiters: Number(fuelLiters) || 0,
        chlorineKg: Number(chlorineKg) || 0,
        notes: notes.trim(),
        recordedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao gravar o registo do posto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-sky-100">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-sky-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEditing ? 'Editar Registo Mensal do Posto' : 'Registo Mensal do Posto de Abastecimento'}
              </h3>
              <p className="text-xs text-slate-500">
                Medição de volume bombeado e consumo operacional na Manhiça
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Posto de Abastecimento / Furo de Água *
            </label>
            <select
              value={stationName}
              onChange={(e) => setStationName(e.target.value)}
              className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 bg-white"
            >
              {COMMON_STATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="Outro">Outro Posto / Furo...</option>
            </select>
          </div>

          {stationName === 'Outro' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Posto
              </label>
              <input
                type="text"
                required
                value={customStationName}
                onChange={(e) => setCustomStationName(e.target.value)}
                placeholder="ex: Furo Comunitário Bairro 3"
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          )}

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

          {/* Macrometer Readings */}
          <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Leitura Inicial (m³) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={initialPumpReading}
                onChange={(e) => setInitialPumpReading(parseFloat(e.target.value) || 0)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg bg-white"
              />
              <span className="text-[10px] text-slate-400">Início do mês</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Leitura Final (m³) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={finalPumpReading}
                onChange={(e) => setFinalPumpReading(parseFloat(e.target.value) || 0)}
                className="w-full text-sm py-2 px-3 border border-sky-400 ring-1 ring-sky-300 rounded-lg bg-white font-bold"
              />
              <span className="text-[10px] text-slate-400">Fim do mês</span>
            </div>

            <div className="bg-sky-100/70 p-3 rounded-lg flex flex-col justify-center border border-sky-200">
              <span className="text-[10px] font-bold text-sky-800 uppercase">Volume Bombeado</span>
              <div className="text-xl font-black text-sky-950">
                {pumpedVolumeM3.toLocaleString()} <span className="text-xs font-bold text-sky-700">m³</span>
              </div>
              <span className="text-[10px] text-sky-700">Injetado na rede</span>
            </div>
          </div>

          {/* Operational metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Energia Elétrica EDM (kWh)</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={energyKwh}
                onChange={(e) => setEnergyKwh(parseFloat(e.target.value) || 0)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-rose-500" />
                <span>Combustível Gerador (Litros)</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={fuelLiters}
                onChange={(e) => setFuelLiters(parseFloat(e.target.value) || 0)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horas de Funcionamento da Bomba (h)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={operatingHours}
                onChange={(e) => setOperatingHours(parseFloat(e.target.value) || 0)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <TestTube2 className="w-3.5 h-3.5 text-cyan-600" />
                <span>Cloro de Tratamento (kg)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={chlorineKg}
                onChange={(e) => setChlorineKg(parseFloat(e.target.value) || 0)}
                className="w-full text-sm py-2 px-3 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações / Manutenção do Posto
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Estado da bomba, avarias, reparação de tubagens, nível do lençol freático..."
              className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg"
            />
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
              <span>Guardar Registo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
