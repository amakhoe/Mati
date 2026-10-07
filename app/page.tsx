'use client';

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Navbar, ActiveTab } from '@/components/Navbar';
import { AuthScreen } from '@/components/AuthScreen';
import { DashboardOverview } from '@/components/DashboardOverview';
import { ClientsManager } from '@/components/ClientsManager';
import { ClientModal } from '@/components/ClientModal';
import { InvoicesManager } from '@/components/InvoicesManager';
import { InvoiceModal } from '@/components/InvoiceModal';
import { InvoicePrintModal } from '@/components/InvoicePrintModal';
import { WaterStationManager } from '@/components/WaterStationManager';
import { StationRecordModal } from '@/components/StationRecordModal';
import { SettingsManager } from '@/components/SettingsManager';
import {
  subscribeClients,
  createClient,
  updateClient,
  deleteClient,
  subscribeInvoices,
  createInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  subscribeStationConsumptions,
  createStationConsumption,
  updateStationConsumption,
  deleteStationConsumption,
  getSystemSettings,
  saveSystemSettings,
  seedManhicaSampleData,
  fetchClientsOnce,
  fetchInvoicesOnce,
  fetchStationConsumptionsOnce,
} from '@/lib/water-service';
import {
  Client,
  Invoice,
  WaterStationConsumption,
  SystemSettings,
  DEFAULT_SETTINGS,
  InvoiceStatus,
} from '@/types/water-system';
import { Droplets, Sparkles, Loader2, Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { User } from 'firebase/auth';

function AuthenticatedWaterApp({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stations, setStations] = useState<WaterStationConsumption[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loadingData, setLoadingData] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Modal States
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [preselectedClient, setPreselectedClient] = useState<Client | null>(null);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);

  const [stationModalOpen, setStationModalOpen] = useState(false);
  const [editingStationRecord, setEditingStationRecord] = useState<WaterStationConsumption | null>(null);

  // Toast / notification
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Subscribe to real-time collections
  useEffect(() => {
    let isMounted = true;

    // Load settings
    getSystemSettings().then((s) => {
      if (isMounted) setSettings(s);
    });

    // Listen to Clients
    const unsubClients = subscribeClients(
      (data) => {
        if (isMounted) {
          setClients(data);
          setLoadingData(false);
        }
      },
      (err) => console.error('Clients subscription error:', err)
    );

    // Listen to Invoices
    const unsubInvoices = subscribeInvoices(
      (data) => {
        if (isMounted) setInvoices(data);
      },
      (err) => console.error('Invoices subscription error:', err)
    );

    // Listen to Station Consumptions
    const unsubStations = subscribeStationConsumptions(
      (data) => {
        if (isMounted) setStations(data);
      },
      (err) => console.error('Stations subscription error:', err)
    );

    return () => {
      isMounted = false;
      if (unsubClients) unsubClients();
      if (unsubInvoices) unsubInvoices();
      if (unsubStations) unsubStations();
    };
  }, [user.uid]);

  // Handlers for Clients
  const handleSaveClient = async (clientData: Omit<Client, 'id'>) => {
    if (editingClient) {
      await updateClient(editingClient.id, clientData);
      notify('Cliente atualizado com sucesso.');
    } else {
      await createClient({
        ...clientData,
        createdBy: user.email || undefined,
      });
      notify('Cliente registado com sucesso.');
    }
  };

  const handleDeleteClient = async (id: string) => {
    await deleteClient(id);
    notify('Cliente eliminado.');
  };

  const handleInvoiceForClient = (client: Client) => {
    setPreselectedClient(client);
    setInvoiceModalOpen(true);
  };

  // Handlers for Invoices
  const handleSaveInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
    await createInvoice({
      ...invoiceData,
      createdBy: user.email || undefined,
    });
    notify(`Fatura ${invoiceData.invoiceNumber} emitida com sucesso!`);
  };

  const handleUpdateInvoiceStatus = async (
    id: string,
    status: InvoiceStatus,
    method?: string
  ) => {
    await updateInvoiceStatus(id, status, method);
    notify(status === 'paid' ? 'Fatura marcada como PAGA.' : 'Fatura marcada como PENDENTE.');
  };

  const handleDeleteInvoice = async (id: string) => {
    await deleteInvoice(id);
    notify('Fatura eliminada.');
  };

  const handlePrintInvoice = (inv: Invoice) => {
    setSelectedInvoiceForPrint(inv);
    setPrintModalOpen(true);
  };

  // Handlers for Stations
  const handleSaveStationRecord = async (data: Omit<WaterStationConsumption, 'id'>) => {
    if (editingStationRecord) {
      await updateStationConsumption(editingStationRecord.id, data);
      notify('Registo mensal do posto atualizado com sucesso.');
    } else {
      await createStationConsumption({
        ...data,
        recordedBy: user.email || undefined,
      });
      notify('Registo mensal do posto de abastecimento guardado com sucesso.');
    }
  };

  const handleDeleteStationRecord = async (id: string) => {
    await deleteStationConsumption(id);
    notify('Registo do posto eliminado.');
  };

  // Handlers for Settings
  const handleSaveSettings = async (newSettings: SystemSettings) => {
    await saveSystemSettings(newSettings);
    setSettings(newSettings);
    notify('Configurações atualizadas.');
  };

  const handleSyncFromFirebase = async () => {
    setSyncing(true);
    try {
      const [c, inv, st] = await Promise.all([
        fetchClientsOnce(),
        fetchInvoicesOnce(),
        fetchStationConsumptionsOnce(),
      ]);
      setClients(c);
      setInvoices(inv);
      setStations(st);
      notify(`Sincronização concluída: ${c.length} clientes, ${inv.length} faturas e ${st.length} postos recuperados do Firebase Firestore.`);
    } catch (err: any) {
      notify(`Erro ao sincronizar com Firebase: ${err?.message || 'Falha de conexão'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSeedDemoData = async () => {
    const res = await seedManhicaSampleData(user.email || undefined);
    notify(
      `Dados gravados no Firebase: ${res.clientsCount} clientes, ${res.invoicesCount} faturas e ${res.stationRecordsCount} registos de postos.`
    );
  };

  const pendingInvoicesCount = invoices.filter((i) => i.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Droplets className="w-4 h-4 text-sky-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingInvoicesCount={pendingInvoicesCount}
      />

      {/* Firebase Database Live Sync Bar */}
      <div className="bg-sky-950 text-sky-100 text-xs py-2 px-4 border-b border-sky-900 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              Firebase Firestore Ligado:
            </span>
            <span className="font-mono text-[11px] bg-sky-900/80 px-2 py-0.5 rounded-md text-sky-200 border border-sky-800">
              ai-studio-guamanhiamanager-015ca5cd-6b60-4fd2-8474-3ba5c1b9a468
            </span>
            <span className="hidden md:inline text-sky-400 font-medium text-[11px]">
              • {clients.length} clientes • {invoices.length} faturas • {stations.length} registos de postos
            </span>
          </div>

          <button
            onClick={handleSyncFromFirebase}
            disabled={syncing}
            title="Recarregar e verificar dados diretamente da nuvem do Firebase Firestore"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-800 hover:bg-sky-700 text-white text-[11px] font-bold border border-sky-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 text-sky-300 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'A sincronizar...' : 'Recarregar do Firebase'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Quick helper when database is empty */}
        {clients.length === 0 && !loadingData && (
          <div className="mb-6 p-4 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sky-950 text-sm">
                  Base de dados da Manhiça pronta e inicializada!
                </h4>
                <p className="text-xs text-sky-800">
                  Deseja carregar dados de demonstração com clientes dos bairros Ribínguè, Sede e Nhambalo, faturas e leituras do posto?
                </p>
              </div>
            </div>
            <button
              onClick={handleSeedDemoData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-sm transition-colors shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Carregar Dados da Manhiça</span>
            </button>
          </div>
        )}

        {/* Tab 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardOverview
            clients={clients}
            invoices={invoices}
            stations={stations}
            settings={settings}
            setActiveTab={setActiveTab}
            onOpenNewClient={() => {
              setEditingClient(null);
              setClientModalOpen(true);
            }}
            onOpenNewInvoice={() => {
              setPreselectedClient(null);
              setInvoiceModalOpen(true);
            }}
            onOpenNewStationRecord={() => {
              setEditingStationRecord(null);
              setStationModalOpen(true);
            }}
          />
        )}

        {/* Tab 2: Clients */}
        {activeTab === 'clients' && (
          <ClientsManager
            clients={clients}
            onOpenNewClient={() => {
              setEditingClient(null);
              setClientModalOpen(true);
            }}
            onEditClient={(client) => {
              setEditingClient(client);
              setClientModalOpen(true);
            }}
            onDeleteClient={handleDeleteClient}
            onInvoiceForClient={handleInvoiceForClient}
          />
        )}

        {/* Tab 3: Invoices */}
        {activeTab === 'invoices' && (
          <InvoicesManager
            invoices={invoices}
            settings={settings}
            onOpenNewInvoice={() => {
              setPreselectedClient(null);
              setInvoiceModalOpen(true);
            }}
            onPrintInvoice={handlePrintInvoice}
            onUpdateStatus={handleUpdateInvoiceStatus}
            onDeleteInvoice={handleDeleteInvoice}
          />
        )}

        {/* Tab 4: Water Stations */}
        {activeTab === 'stations' && (
          <WaterStationManager
            records={stations}
            invoices={invoices}
            onOpenNewRecord={() => {
              setEditingStationRecord(null);
              setStationModalOpen(true);
            }}
            onEditRecord={(record) => {
              setEditingStationRecord(record);
              setStationModalOpen(true);
            }}
            onDeleteRecord={handleDeleteStationRecord}
          />
        )}

        {/* Tab 5: Settings */}
        {activeTab === 'settings' && (
          <SettingsManager
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onSeedDemoData={handleSeedDemoData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Droplets className="w-4 h-4 text-sky-600" />
            <span>Águas da Manhiça • Sistema Integrado de Gestão de Abastecimento</span>
          </div>
          <div>
            Comunidade da Manhiça, Província de Maputo • Moçambique
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ClientModal
        key={editingClient ? `edit-${editingClient.id}` : 'new-client'}
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onSave={handleSaveClient}
        editingClient={editingClient}
      />

      <InvoiceModal
        key={preselectedClient ? `inv-${preselectedClient.id}` : 'new-invoice'}
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        onSave={handleSaveInvoice}
        clients={clients}
        settings={settings}
        preselectedClient={preselectedClient}
      />

      <InvoicePrintModal
        invoice={selectedInvoiceForPrint}
        onClose={() => setPrintModalOpen(false)}
        settings={settings}
      />

      <StationRecordModal
        key={editingStationRecord ? `st-${editingStationRecord.id}` : 'new-station'}
        isOpen={stationModalOpen}
        onClose={() => setStationModalOpen(false)}
        onSave={handleSaveStationRecord}
        editingRecord={editingStationRecord}
      />
    </div>
  );
}

function WaterAppRoot() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto shadow-md animate-bounce">
            <Droplets className="w-6 h-6" />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
            <span>A inicializar Águas da Manhiça...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <AuthenticatedWaterApp user={user} />;
}

export default function HomePage() {
  return (
    <AuthProvider>
      <WaterAppRoot />
    </AuthProvider>
  );
}
