'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  FilePlus,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Client, MANHICA_NEIGHBORHOODS } from '@/types/water-system';

interface ClientsManagerProps {
  clients: Client[];
  onOpenNewClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (id: string) => Promise<void>;
  onInvoiceForClient: (client: Client) => void;
}

export function ClientsManager({
  clients,
  onOpenNewClient,
  onEditClient,
  onDeleteClient,
  onInvoiceForClient,
}: ClientsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.meterNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.identityNumber && c.identityNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.neighborhood && c.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesNeighborhood =
        neighborhoodFilter === 'ALL' || c.neighborhood === neighborhoodFilter;

      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

      return matchesSearch && matchesNeighborhood && matchesStatus;
    });
  }, [clients, searchTerm, neighborhoodFilter, statusFilter]);

  const handleDelete = async (client: Client) => {
    if (confirm(`Tem a certeza que deseja eliminar o registo do cliente "${client.name}" (${client.meterNumber})?`)) {
      setDeletingId(client.id);
      try {
        await onDeleteClient(client.id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">Registo de Clientes</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              {clients.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de consumidores e contadores de água na comunidade da Manhiça
          </p>
        </div>

        <button
          onClick={onOpenNewClient}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registar Novo Cliente</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, contador, BI, telefone..."
            className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
          />
        </div>

        {/* Neighborhood Filter */}
        <div className="relative">
          <select
            value={neighborhoodFilter}
            onChange={(e) => setNeighborhoodFilter(e.target.value)}
            className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
          >
            <option value="ALL">Todos os Bairros da Manhiça</option>
            {MANHICA_NEIGHBORHOODS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs py-2.5 px-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
          >
            <option value="ALL">Todos os Estados</option>
            <option value="active">Apenas Ativos</option>
            <option value="inactive">Apenas Inativos</option>
            <option value="suspended">Apenas Suspensos</option>
          </select>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Nenhum cliente encontrado</p>
            <p className="text-xs text-slate-400 mt-1">
              Tente alterar os termos de pesquisa ou registe um novo consumidor.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Cliente / Contato</th>
                  <th className="py-3.5 px-4">Hidrómetro (Contador)</th>
                  <th className="py-3.5 px-4">Bairro / Localização</th>
                  <th className="py-3.5 px-4 text-center">Leitura Atual</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-sky-50/40 transition-colors">
                    {/* Nome & Contato */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{client.name}</div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-sky-600" />
                            {client.phone}
                          </span>
                        )}
                        {client.identityNumber && (
                          <span className="font-mono text-slate-400">BI: {client.identityNumber}</span>
                        )}
                      </div>
                    </td>

                    {/* Hidrómetro */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-sky-800 bg-sky-50 px-2 py-1 rounded-md inline-block border border-sky-100">
                        {client.meterNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Adesão: {client.joinDate || 'N/D'}
                      </div>
                    </td>

                    {/* Bairro */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{client.neighborhood}</span>
                      </div>
                      {client.address && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {client.address}
                        </div>
                      )}
                    </td>

                    {/* Leitura Atual */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-bold text-slate-900 text-sm">
                        {client.currentMeterReading ?? client.initialMeterReading ?? 0}
                      </div>
                      <div className="text-[10px] text-slate-400">m³ acumulados</div>
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          client.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : client.status === 'suspended'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {client.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                        {client.status === 'suspended' && <AlertTriangle className="w-3 h-3" />}
                        {client.status === 'inactive' && <XCircle className="w-3 h-3" />}
                        <span>
                          {client.status === 'active'
                            ? 'Ativo'
                            : client.status === 'suspended'
                            ? 'Suspenso'
                            : 'Inativo'}
                        </span>
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onInvoiceForClient(client)}
                          title="Emitir Fatura para este cliente"
                          className="p-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors border border-sky-200"
                        >
                          <FilePlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditClient(client)}
                          title="Editar Cliente"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client)}
                          disabled={deletingId === client.id}
                          title="Eliminar Cliente"
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
