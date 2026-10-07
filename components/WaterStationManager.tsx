'use client';

import React, { useState, useMemo } from 'react';
import {
  Gauge,
  Plus,
  Zap,
  Fuel,
  TestTube2,
  Calendar,
  Activity,
  Edit2,
  Trash2,
  TrendingDown,
  Droplets,
  Search,
} from 'lucide-react';
import { WaterStationConsumption, Invoice } from '@/types/water-system';

interface WaterStationManagerProps {
  records: WaterStationConsumption[];
  invoices: Invoice[];
  onOpenNewRecord: () => void;
  onEditRecord: (record: WaterStationConsumption) => void;
  onDeleteRecord: (id: string) => Promise<void>;
}

export function WaterStationManager({
  records,
  invoices,
  onOpenNewRecord,
  onEditRecord,
  onDeleteRecord,
}: WaterStationManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Available months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.periodMonth) set.add(r.periodMonth);
    });
    return Array.from(set).sort().reverse();
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.stationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.notes && r.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesMonth = selectedMonth === 'ALL' || r.periodMonth === selectedMonth;
      return matchesSearch && matchesMonth;
    });
  }, [records, searchTerm, selectedMonth]);

  // Overall calculations for selected month (or all)
  const totalPumped = filteredRecords.reduce((a, b) => a + (b.pumpedVolumeM3 || 0), 0);
  const totalEnergy = filteredRecords.reduce((a, b) => a + (b.energyKwh || 0), 0);
  const totalOperatingHours = filteredRecords.reduce((a, b) => a + (b.operatingHours || 0), 0);

  // Cross reference with client invoices for water loss analysis
  const relevantInvoices = invoices.filter(
    (i) => selectedMonth === 'ALL' || i.periodMonth === selectedMonth
  );
  const totalClientBilledM3 = relevantInvoices.reduce((a, b) => a + (b.consumptionM3 || 0), 0);

  const waterLossM3 = totalPumped > 0 ? Math.max(0, totalPumped - totalClientBilledM3) : 0;
  const lossPercentage = totalPumped > 0 ? Math.round((waterLossM3 / totalPumped) * 100) : 0;
  const efficiency = totalPumped > 0 ? Math.min(100, Math.round((totalClientBilledM3 / totalPumped) * 100)) : 100;

  const handleDelete = async (r: WaterStationConsumption) => {
    if (confirm(`Eliminar registo mensal de "${r.stationName}" (${r.periodMonth})?`)) {
      setDeletingId(r.id);
      try {
        await onDeleteRecord(r.id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">
              Postos de Abastecimento & Bombagem
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              {records.length} Registos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registo manual mensal do volume bombeado nos furos e estações de captação da Manhiça
          </p>
        </div>

        <button
          onClick={onOpenNewRecord}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registar Consumo Mensal do Posto</span>
        </button>
      </div>

      {/* Water Balance / Loss Analysis Banner */}
      <div className="bg-linear-to-r from-slate-900 to-sky-950 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Balanço Hídrico & Controlo de Perdas
            </span>
            <h3 className="text-lg font-extrabold mt-1">
              Eficiência Técnica do Sistema de Distribuição
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filtrar Mês do Balanço:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-800 text-white text-xs py-1.5 px-3 rounded-lg border border-slate-700 focus:ring-1 focus:ring-sky-400"
            >
              <option value="ALL">Todos os Meses</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  Mês {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Volume Bombeado nos Postos</div>
            <div className="text-2xl font-black text-white mt-1">
              {totalPumped.toLocaleString()} <span className="text-xs text-slate-400">m³</span>
            </div>
            <span className="text-[10px] text-slate-400">Lido nos macromedidores</span>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Volume Faturado aos Clientes</div>
            <div className="text-2xl font-black text-sky-400 mt-1">
              {totalClientBilledM3.toLocaleString()} <span className="text-xs text-sky-200">m³</span>
            </div>
            <span className="text-[10px] text-slate-400">Soma de hidrómetros nos bairros</span>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Perdas de Água na Rede</div>
            <div className="text-2xl font-black text-rose-400 mt-1">
              {waterLossM3.toLocaleString()} <span className="text-xs text-rose-300">m³</span>
            </div>
            <span className="text-[10px] text-rose-400 font-semibold">
              Taxa de perda: {lossPercentage}%
            </span>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Eficiência da Rede</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {efficiency}%
            </div>
            <span className="text-[10px] text-emerald-400">
              {efficiency >= 80 ? 'Eficiência recomendada' : 'Atenção a possíveis fugas'}
            </span>
          </div>
        </div>

        {totalPumped > 0 && (
          <div className="mt-5 pt-3 border-t border-slate-800/80">
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Água Faturada: {totalClientBilledM3} m³ ({efficiency}%)</span>
              <span>Água Não Faturada / Perdas: {waterLossM3} m³ ({lossPercentage}%)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${efficiency}%` }} className="bg-sky-500 h-full" />
              <div style={{ width: `${lossPercentage}%` }} className="bg-rose-500 h-full" />
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por posto de abastecimento ou notas..."
            className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Gauge className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Nenhum registo de posto encontrado</p>
            <p className="text-xs text-slate-400 mt-1">
              Clique em &quot;Registar Consumo Mensal do Posto&quot; para adicionar leituras de furos e bombas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Posto / Furo de Água</th>
                  <th className="py-3.5 px-4">Mês de Referência</th>
                  <th className="py-3.5 px-4 text-center">Macromedidor (Início → Fim)</th>
                  <th className="py-3.5 px-4 text-center">Volume Bombeado (m³)</th>
                  <th className="py-3.5 px-4 text-center">Operação & Energia</th>
                  <th className="py-3.5 px-4">Notas / Manutenção</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-sky-50/40 transition-colors">
                    {/* Posto */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">{r.stationName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Registo: {r.recordedAt ? r.recordedAt.substring(0, 10) : 'N/D'}
                      </div>
                    </td>

                    {/* Mês */}
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-800">
                      {r.periodMonth}
                    </td>

                    {/* Leituras */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-mono text-slate-600 text-xs">
                        {r.initialPumpReading} → <strong>{r.finalPumpReading}</strong> m³
                      </div>
                    </td>

                    {/* Volume Bombeado */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-black text-sky-900 text-sm">
                        {r.pumpedVolumeM3.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">m³</span>
                      </div>
                    </td>

                    {/* Energia e horas */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600">
                        {r.operatingHours ? <span>{r.operatingHours}h bomba</span> : null}
                        {r.energyKwh ? (
                          <span className="flex items-center gap-0.5 text-amber-700 font-semibold">
                            <Zap className="w-3 h-3" /> {r.energyKwh} kWh
                          </span>
                        ) : null}
                      </div>
                      {r.chlorineKg ? (
                        <div className="text-[10px] text-cyan-700 mt-0.5">
                          {r.chlorineKg} kg cloro
                        </div>
                      ) : null}
                    </td>

                    {/* Notas */}
                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-600 max-w-xs truncate">
                        {r.notes || 'Sem observações'}
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditRecord(r)}
                          title="Editar Registo"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          disabled={deletingId === r.id}
                          title="Eliminar Registo"
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
