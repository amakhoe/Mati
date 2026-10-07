import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import {
  Client,
  Invoice,
  WaterStationConsumption,
  SystemSettings,
  DEFAULT_SETTINGS,
} from '@/types/water-system';

// ----------------------------------------------------
// CLIENTS SERVICE
// ----------------------------------------------------

export async function fetchClientsOnce(): Promise<Client[]> {
  const path = 'clients';
  try {
    const q = query(collection(db, path), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    const clients: Client[] = [];
    snapshot.forEach((docSnap) => {
      clients.push({ id: docSnap.id, ...(docSnap.data() as Omit<Client, 'id'>) });
    });
    return clients;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeClients(
  onData: (clients: Client[]) => void,
  onError?: (error: Error) => void
) {
  const path = 'clients';
  try {
    const q = query(collection(db, path), orderBy('name', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const clients: Client[] = [];
        snapshot.forEach((docSnap) => {
          clients.push({ id: docSnap.id, ...(docSnap.data() as Omit<Client, 'id'>) });
        });
        onData(clients);
      },
      (error) => {
        if (onError) onError(error as Error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createClient(clientData: Omit<Client, 'id'>): Promise<string> {
  const path = 'clients';
  const newId = `cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    await setDoc(doc(db, path, newId), {
      ...clientData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return newId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${newId}`);
  }
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<void> {
  const path = `clients/${id}`;
  try {
    await updateDoc(doc(db, 'clients', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteClient(id: string): Promise<void> {
  const path = `clients/${id}`;
  try {
    await deleteDoc(doc(db, 'clients', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ----------------------------------------------------
// INVOICES SERVICE
// ----------------------------------------------------

export async function fetchInvoicesOnce(): Promise<Invoice[]> {
  const path = 'invoices';
  try {
    const q = query(collection(db, path), orderBy('periodMonth', 'desc'));
    const snapshot = await getDocs(q);
    const invoices: Invoice[] = [];
    snapshot.forEach((docSnap) => {
      invoices.push({ id: docSnap.id, ...(docSnap.data() as Omit<Invoice, 'id'>) });
    });
    return invoices;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeInvoices(
  onData: (invoices: Invoice[]) => void,
  onError?: (error: Error) => void
) {
  const path = 'invoices';
  try {
    const q = query(collection(db, path), orderBy('periodMonth', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const invoices: Invoice[] = [];
        snapshot.forEach((docSnap) => {
          invoices.push({ id: docSnap.id, ...(docSnap.data() as Omit<Invoice, 'id'>) });
        });
        onData(invoices);
      },
      (error) => {
        if (onError) onError(error as Error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createInvoice(invoiceData: Omit<Invoice, 'id'>): Promise<string> {
  const path = 'invoices';
  const newId = `fat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    await setDoc(doc(db, path, newId), {
      ...invoiceData,
      createdAt: new Date().toISOString(),
    });

    // Also update client's current reading if applicable
    if (invoiceData.clientId && invoiceData.currentReading !== undefined) {
      try {
        await updateDoc(doc(db, 'clients', invoiceData.clientId), {
          currentMeterReading: invoiceData.currentReading,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Could not auto-update client meter reading:', e);
      }
    }

    return newId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${newId}`);
  }
}

export async function updateInvoiceStatus(
  id: string,
  status: Invoice['status'],
  paymentMethod?: string
): Promise<void> {
  const path = `invoices/${id}`;
  try {
    const updateData: any = { status };
    if (status === 'paid') {
      updateData.paidAt = new Date().toISOString();
      if (paymentMethod) updateData.paymentMethod = paymentMethod;
    } else {
      updateData.paidAt = null;
    }
    await updateDoc(doc(db, 'invoices', id), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  const path = `invoices/${id}`;
  try {
    await deleteDoc(doc(db, 'invoices', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ----------------------------------------------------
// WATER STATION CONSUMPTIONS (POSTO DE ABASTECIMENTO)
// ----------------------------------------------------

export async function fetchStationConsumptionsOnce(): Promise<WaterStationConsumption[]> {
  const path = 'stationConsumptions';
  try {
    const q = query(collection(db, path), orderBy('periodMonth', 'desc'));
    const snapshot = await getDocs(q);
    const records: WaterStationConsumption[] = [];
    snapshot.forEach((docSnap) => {
      records.push({ id: docSnap.id, ...(docSnap.data() as Omit<WaterStationConsumption, 'id'>) });
    });
    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeStationConsumptions(
  onData: (records: WaterStationConsumption[]) => void,
  onError?: (error: Error) => void
) {
  const path = 'stationConsumptions';
  try {
    const q = query(collection(db, path), orderBy('periodMonth', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const records: WaterStationConsumption[] = [];
        snapshot.forEach((docSnap) => {
          records.push({ id: docSnap.id, ...(docSnap.data() as Omit<WaterStationConsumption, 'id'>) });
        });
        onData(records);
      },
      (error) => {
        if (onError) onError(error as Error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createStationConsumption(
  recordData: Omit<WaterStationConsumption, 'id'>
): Promise<string> {
  const path = 'stationConsumptions';
  const newId = `st_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  try {
    await setDoc(doc(db, path, newId), {
      ...recordData,
      recordedAt: new Date().toISOString(),
    });
    return newId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${newId}`);
  }
}

export async function updateStationConsumption(
  id: string,
  recordData: Partial<WaterStationConsumption>
): Promise<void> {
  const path = `stationConsumptions/${id}`;
  try {
    await updateDoc(doc(db, 'stationConsumptions', id), recordData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStationConsumption(id: string): Promise<void> {
  const path = `stationConsumptions/${id}`;
  try {
    await deleteDoc(doc(db, 'stationConsumptions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ----------------------------------------------------
// SETTINGS SERVICE
// ----------------------------------------------------

export async function getSystemSettings(): Promise<SystemSettings> {
  const path = 'settings/general';
  try {
    const snap = await getDoc(doc(db, 'settings', 'general'));
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...snap.data() } as SystemSettings;
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    // Return default settings gracefully if initial get fails
    return DEFAULT_SETTINGS;
  }
}

export async function saveSystemSettings(settings: SystemSettings): Promise<void> {
  const path = 'settings/general';
  try {
    await setDoc(doc(db, 'settings', 'general'), settings);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------------------------------------------
// DEMO SEED DATA (MANHIÇA COMMUNITY SAMPLES)
// ----------------------------------------------------

export async function seedManhicaSampleData(operatorEmail?: string): Promise<{
  clientsCount: number;
  invoicesCount: number;
  stationRecordsCount: number;
}> {
  const sampleClients: Omit<Client, 'id'>[] = [
    {
      name: 'Armando Bento Sitoe',
      meterNumber: 'HID-MAN-0101',
      phone: '+258 84 412 8890',
      identityNumber: '1102938472M',
      neighborhood: 'Ribínguè',
      address: 'Rua das Mangueiras, Próximo ao Campo de Futebol',
      status: 'active',
      joinDate: '2025-02-10',
      initialMeterReading: 120,
      currentMeterReading: 148,
      notes: 'Ligação doméstica standard. Hidrómetro em bom estado.',
      createdBy: operatorEmail || 'sistema',
    },
    {
      name: 'Maria Esperança Cossa',
      meterNumber: 'HID-MAN-0102',
      phone: '+258 87 220 9011',
      identityNumber: '0812903819F',
      neighborhood: 'Manhiça Sede - Centro',
      address: 'Av. Eduardo Mondlane, Q. 04, Casa 12',
      status: 'active',
      joinDate: '2024-11-05',
      initialMeterReading: 310,
      currentMeterReading: 342,
      notes: 'Comércio / Padaria local. Consumo regular.',
      createdBy: operatorEmail || 'sistema',
    },
    {
      name: 'Joaquim Alberto Mondlane',
      meterNumber: 'HID-MAN-0103',
      phone: '+258 82 710 4432',
      identityNumber: '1098471203M',
      neighborhood: 'Nhambalo',
      address: 'Bairro Nhambalo, Estrada Velha para Xinavane',
      status: 'active',
      joinDate: '2025-01-18',
      initialMeterReading: 85,
      currentMeterReading: 104,
      notes: 'Residencial. Pagamento pontual via M-Pesa.',
      createdBy: operatorEmail || 'sistema',
    },
    {
      name: 'Graça Teresa Matsinhe',
      meterNumber: 'HID-MAN-0104',
      phone: '+258 84 890 1234',
      identityNumber: '0912384721F',
      neighborhood: 'Maluana',
      address: 'Próximo ao Centro Tecnológico da Maluana',
      status: 'active',
      joinDate: '2025-03-01',
      initialMeterReading: 40,
      currentMeterReading: 58,
      notes: 'Ligação nova residencial.',
      createdBy: operatorEmail || 'sistema',
    },
    {
      name: 'António Salomão Nhantumbo',
      meterNumber: 'HID-MAN-0105',
      phone: '+258 86 331 7765',
      identityNumber: '1209384756M',
      neighborhood: 'Chibututuine',
      address: 'Estrada Nacional N1, Km 72',
      status: 'suspended',
      joinDate: '2024-09-15',
      initialMeterReading: 200,
      currentMeterReading: 215,
      notes: 'Ligação temporariamente suspensa a pedido por ausência de viagem.',
      createdBy: operatorEmail || 'sistema',
    },
  ];

  const createdClients: Client[] = [];
  for (const clientData of sampleClients) {
    const id = await createClient(clientData);
    createdClients.push({ ...clientData, id });
  }

  // Sample Invoices with manual m³ price as requested (ex: 45 MT / m³)
  const currentMonth = new Date().toISOString().substring(0, 7); // e.g. 2026-10
  const prevMonth = '2026-09';

  const sampleInvoices: Omit<Invoice, 'id'>[] = [
    {
      invoiceNumber: `FAT-MAN-${new Date().getFullYear()}-001`,
      clientId: createdClients[0].id,
      clientName: createdClients[0].name,
      meterNumber: createdClients[0].meterNumber,
      periodMonth: currentMonth,
      previousReading: 132,
      currentReading: 148,
      consumptionM3: 16,
      unitPriceM3: 45.0, // Preço inserido manualmente
      subtotal: 16 * 45.0, // 720 MT
      fixedFee: 50.0,
      totalAmount: 770.0,
      status: 'pending',
      readingDate: `${currentMonth}-05`,
      dueDate: `${currentMonth}-25`,
      paymentMethod: 'M-Pesa',
      notes: 'Fatura de água de consumo regular.',
      createdBy: operatorEmail || 'sistema',
    },
    {
      invoiceNumber: `FAT-MAN-${new Date().getFullYear()}-002`,
      clientId: createdClients[1].id,
      clientName: createdClients[1].name,
      meterNumber: createdClients[1].meterNumber,
      periodMonth: currentMonth,
      previousReading: 310,
      currentReading: 342,
      consumptionM3: 32,
      unitPriceM3: 48.0, // Preço comercial diferenciado inserido manualmente
      subtotal: 32 * 48.0, // 1536 MT
      fixedFee: 50.0,
      totalAmount: 1586.0,
      status: 'paid',
      readingDate: `${currentMonth}-03`,
      dueDate: `${currentMonth}-20`,
      paidAt: `${currentMonth}-10T14:30:00Z`,
      paymentMethod: 'Numerário / Caixa',
      notes: 'Pago no guiché central da Manhiça.',
      createdBy: operatorEmail || 'sistema',
    },
    {
      invoiceNumber: `FAT-MAN-${new Date().getFullYear()}-003`,
      clientId: createdClients[2].id,
      clientName: createdClients[2].name,
      meterNumber: createdClients[2].meterNumber,
      periodMonth: currentMonth,
      previousReading: 85,
      currentReading: 104,
      consumptionM3: 19,
      unitPriceM3: 45.0,
      subtotal: 19 * 45.0,
      fixedFee: 50.0,
      totalAmount: 905.0,
      status: 'pending',
      readingDate: `${currentMonth}-06`,
      dueDate: `${currentMonth}-26`,
      paymentMethod: 'E-Mola',
      notes: 'Notificado por SMS / Telefone.',
      createdBy: operatorEmail || 'sistema',
    },
    {
      invoiceNumber: `FAT-MAN-2026-PREV-091`,
      clientId: createdClients[0].id,
      clientName: createdClients[0].name,
      meterNumber: createdClients[0].meterNumber,
      periodMonth: prevMonth,
      previousReading: 120,
      currentReading: 132,
      consumptionM3: 12,
      unitPriceM3: 45.0,
      subtotal: 12 * 45.0,
      fixedFee: 50.0,
      totalAmount: 590.0,
      status: 'paid',
      readingDate: `${prevMonth}-05`,
      dueDate: `${prevMonth}-25`,
      paidAt: `${prevMonth}-18T10:15:00Z`,
      paymentMethod: 'M-Pesa',
      createdBy: operatorEmail || 'sistema',
    },
  ];

  for (const inv of sampleInvoices) {
    await createInvoice(inv);
  }

  // Sample Water Station Bulk Consumptions (Posto de Abastecimento Manhiça)
  const sampleStationRecords: Omit<WaterStationConsumption, 'id'>[] = [
    {
      stationId: 'posto-central-manhica',
      stationName: 'Posto Central de Captação & Abastecimento (Manhiça Sede)',
      periodMonth: currentMonth,
      initialPumpReading: 12450,
      finalPumpReading: 13980,
      pumpedVolumeM3: 1530, // 1530 m³ bombeados
      operatingHours: 240,
      energyKwh: 1850,
      fuelLiters: 120, // gerador de apoio em cortes de energia
      chlorineKg: 8.5,
      notes: 'Bomba submersível a operar normalmente. Pressão constante na linha troncal.',
      recordedAt: new Date().toISOString(),
      recordedBy: operatorEmail || 'Engenharia de Operações',
    },
    {
      stationId: 'furo-ribingue-02',
      stationName: 'Furo Comunitário de Ribínguè - Estação 02',
      periodMonth: currentMonth,
      initialPumpReading: 6200,
      finalPumpReading: 7050,
      pumpedVolumeM3: 850,
      operatingHours: 180,
      energyKwh: 920,
      fuelLiters: 0,
      chlorineKg: 4.0,
      notes: 'Substituição de válvula de retenção efetuada a dia 04.',
      recordedAt: new Date().toISOString(),
      recordedBy: operatorEmail || 'Técnico de Manutenção',
    },
    {
      stationId: 'posto-central-manhica',
      stationName: 'Posto Central de Captação & Abastecimento (Manhiça Sede)',
      periodMonth: prevMonth,
      initialPumpReading: 10920,
      finalPumpReading: 12450,
      pumpedVolumeM3: 1530,
      operatingHours: 235,
      energyKwh: 1810,
      fuelLiters: 90,
      chlorineKg: 8.0,
      notes: 'Mês anterior concluído sem interrupções maiores.',
      recordedAt: new Date().toISOString(),
      recordedBy: operatorEmail || 'Engenharia de Operações',
    },
  ];

  for (const st of sampleStationRecords) {
    await createStationConsumption(st);
  }

  return {
    clientsCount: sampleClients.length,
    invoicesCount: sampleInvoices.length,
    stationRecordsCount: sampleStationRecords.length,
  };
}
