'use client';

import React, { useState } from 'react';
import { Save, Settings, Database, CheckCircle2, AlertCircle, Building2, Phone, Coins, Sparkles } from 'lucide-react';
import { SystemSettings, DEFAULT_SETTINGS } from '@/types/water-system';

interface SettingsManagerProps {
  settings: SystemSettings;
  onSaveSettings: (settings: SystemSettings) => Promise<void>;
  onSeedDemoData: () => Promise<void>;
}

export function SettingsManager({
  settings,
  onSaveSettings,
  onSeedDemoData,
}: SettingsManagerProps) {
  const [formData, setFormData] = useState<SystemSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await onSaveSettings(formData);
      setMessage({ type: 'success', text: 'Configurações guardadas com sucesso!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao guardar configurações.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    if (
      confirm(
        'Deseja carregar dados de demonstração da comunidade da Manhiça (clientes, faturas e registos de postos de água)?'
      )
    ) {
      setSeeding(true);
      setMessage(null);
      try {
        await onSeedDemoData();
        setMessage({
          type: 'success',
          text: 'Dados de demonstração da Manhiça carregados com sucesso!',
        });
      } catch (err: any) {
        setMessage({ type: 'error', text: err?.message || 'Erro ao carregar dados de demonstração.' });
      } finally {
        setSeeding(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Configurações do Sistema</h2>
            <p className="text-xs text-slate-500">
              Parametrização da empresa de água, tarifário base por m³ e dados de emissão de faturas
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-sky-600" />
            <span>Identificação da Empresa / Entidade Gestora de Água</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome da Empresa / Operador
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NUIT da Empresa
              </label>
              <input
                type="text"
                value={formData.companyNuit}
                onChange={(e) => setFormData({ ...formData, companyNuit: e.target.value })}
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Comunidade / Localização
              </label>
              <input
                type="text"
                value={formData.communityName}
                onChange={(e) => setFormData({ ...formData, communityName: e.target.value })}
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone de Atendimento / M-Pesa
              </label>
              <input
                type="text"
                value={formData.companyPhone}
                onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Coins className="w-4 h-4 text-amber-600" />
            <span>Tarifário Padrão & Moeda</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preço Padrão por m³ (MT/m³)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                required
                value={formData.defaultUnitPriceM3}
                onChange={(e) =>
                  setFormData({ ...formData, defaultUnitPriceM3: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs py-2 px-3 font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Valor sugerido na emissão (permanece editável manualmente por fatura)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Taxa Fixa Mensal de Conservação (MT)
              </label>
              <input
                type="number"
                step="5"
                min="0"
                value={formData.fixedMonthlyFee}
                onChange={(e) =>
                  setFormData({ ...formData, fixedMonthlyFee: parseFloat(e.target.value) || 0 })
                }
                className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Taxa de conservação de rede e hidrómetro
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Símbolo da Moeda
              </label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full text-xs py-2 px-3 font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Instruções de Pagamento (Impressas na Fatura)
          </label>
          <textarea
            rows={2}
            value={formData.paymentInstructions}
            onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
            className="w-full text-xs py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex justify-end pt-3">
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
            <span>Guardar Configurações</span>
          </button>
        </div>
      </form>

      {/* Firebase Database Architecture & Status */}
      <div className="bg-white p-6 rounded-2xl border border-sky-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Integração com a Base de Dados Firebase Firestore
              </h3>
              <p className="text-xs text-slate-500">
                Todos os dados são registados e retirados em tempo real na nuvem do Firebase
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Firestore Ativo
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
          <div>
            <span className="text-slate-400 block text-[10px] font-sans font-semibold uppercase">
              ID da Base de Dados Firestore
            </span>
            <span className="font-bold text-sky-900 break-all">
              ai-studio-guamanhiamanager-015ca5cd-6b60-4fd2-8474-3ba5c1b9a468
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[10px] font-sans font-semibold uppercase">
              Projeto Firebase
            </span>
            <span className="font-bold text-slate-900">
              gen-lang-client-0163897685
            </span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="font-semibold text-slate-800">Coleções Persistentes no Firestore:</div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <li className="p-2 rounded-lg bg-sky-50/60 border border-sky-100">
              <code className="font-bold text-sky-800">/clients</code> — Clientes, números de hidrómetro e leituras
            </li>
            <li className="p-2 rounded-lg bg-sky-50/60 border border-sky-100">
              <code className="font-bold text-sky-800">/invoices</code> — Faturas com preço por m³ manual e recibos
            </li>
            <li className="p-2 rounded-lg bg-sky-50/60 border border-sky-100">
              <code className="font-bold text-sky-800">/stationConsumptions</code> — Consumo e bombeamento dos postos
            </li>
            <li className="p-2 rounded-lg bg-sky-50/60 border border-sky-100">
              <code className="font-bold text-sky-800">/settings/general</code> — Tarifário e dados institucionais
            </li>
          </ul>
        </div>
      </div>

      {/* Demo Data Seeding Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Gravar Dados Iniciais de Demonstração no Firebase
          </h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Pode carregar dados realistas de exemplo incluindo clientes nos bairros Ribínguè, Manhiça Sede, Nhambalo, Maluana, faturas com cálculo por m³ e registos dos postos de abastecimento para testar e validar o sistema imediatamente no Firestore.
        </p>
        <div>
          <button
            type="button"
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {seeding ? (
              <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-indigo-700 border-t-transparent" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>Gravar Registos de Exemplo no Firebase</span>
          </button>
        </div>
      </div>
    </div>
  );
}
