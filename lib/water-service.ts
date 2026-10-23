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
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import {
  Client,
  Invoice,
  WaterStationConsumption,
  SystemSettings,
  DEFAULT_SETTINGS,
  Operator,
  DEFAULT_DATABASE_OPERATORS,
} from '@/types/water-system';

// ----------------------------------------------------
// OPERATORS & DIRECT DATABASE AUTHENTICATION SERVICE
// ----------------------------------------------------

/**
 * Ensures default operator accounts exist in Firestore database
 */
export async function ensureDefaultOperatorsInDb(): Promise<void> {
  const path = 'operators';
  try {
    const snap = await getDocs(collection(db, path));
    const existingEmails = new Set<string>();
    snap.forEach((d) => {
      const data = d.data();
      if (data.email) existingEmails.add(data.email.toLowerCase().trim());
    });

    for (const op of DEFAULT_DATABASE_OPERATORS) {
      const normalizedEmail = op.email.toLowerCase().trim();
      if (!existingEmails.has(normalizedEmail)) {
        const docId = `op_${normalizedEmail.replace(/[^a-z0-9]/g, '_')}`;
        await setDoc(doc(db, path, docId), {
          ...op,
          email: normalizedEmail,
        });
      }
    }
  } catch (err) {
    console.warn('Could not bootstrap default database operators:', err);
  }
}

/**
 * Authenticates directly against the Firestore database:
 * ONLY users registered in the Firestore database are allowed!
 */
export async function authenticateOperatorDirectlyFromDb(
  email: string,
  pass: string
): Promise<Operator> {
  const path = 'operators';
  const normalizedEmail = email.toLowerCase().trim();

  // First, ensure default accounts exist in database if this is a fresh setup
  await ensureDefaultOperatorsInDb();

  try {
    const q = query(collection(db, path), where('email', '==', normalizedEmail));
    const snap = await getDocs(q);

    if (snap.empty) {
      throw new Error(
        `Acesso Recusado: O utilizador "${email}" não se encontra registado na base de dados do sistema. Apenas contas existentes na base de dados Firebase têm autorização para aceder.`
      );
    }

    let foundOp: Operator | null = null;
    let foundDocId: string | null = null;

    snap.forEach((docSnap) => {
      if (!foundOp) {
        foundOp = { id: docSnap.id, ...(docSnap.data() as Omit<Operator, 'id'>) };
        foundDocId = docSnap.id;
      }
    });

    if (!foundOp) {
      throw new Error(
        `Acesso Recusado: Utilizador "${email}" não localizado na base de dados.`
      );
    }

    const op = foundOp as Operator;

    // Check account status in database
    if (op.status === 'suspended') {
      throw new Error(
        `Acesso Bloqueado: A conta de "${op.name}" (${op.email}) está suspensa na base de dados.`
      );
    }

    // Check password against database
    if (op.password !== pass) {
      throw new Error(
        `Palavra-passe incorreta para o utilizador "${op.email}" registado na base de dados.`
      );
    }

    // Update last login in database
    if (foundDocId) {
      try {
        await updateDoc(doc(db, path, foundDocId), {
          lastLogin: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Failed to update lastLogin in db:', e);
      }
    }

    return op;
  } catch (error: any) {
    if (error.message && error.message.includes('Acesso') || error.message.includes('Palavra-passe')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchOperatorsFromDb(): Promise<Operator[]> {
  const path = 'operators';
  try {
    const snap = await getDocs(collection(db, path));
    const list: Operator[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...(d.data() as Omit<Operator, 'id'>) });
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createOperatorInDb(operatorData: Omit<Operator, 'id'>): Promise<string> {
  const path = 'operators';
  const normalizedEmail = operatorData.email.toLowerCase().trim();
  const newId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  try {
    // Check if email already exists in database
    const existingQ = query(collection(db, path), where('email', '==', normalizedEmail));
    const snap = await getDocs(existingQ);
    if (!snap.empty) {
      throw new Error(`Já existe um utilizador registado com o email ${normalizedEmail} na base de dados.`);
    }

    await setDoc(doc(db, path, newId), {
      ...operatorData,
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
    });
    return newId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${path}/${newId}`);
  }
}

export async function updateOperatorInDb(id: string, updates: Partial<Operator>): Promise<void> {
  const path = `operators/${id}`;
  try {
    await updateDoc(doc(db, 'operators', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOperatorInDb(id: string): Promise<void> {
  const path = `operators/${id}`;
  try {
    await deleteDoc(doc(db, 'operators', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

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

export async function updateInvoice(
  id: string,
  updates: Partial<Invoice>
): Promise<void> {
  const path = `invoices/${id}`;
  try {
    await updateDoc(doc(db, 'invoices', id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function recordInvoiceReminder(
  id: string,
  recipientEmail: string,
  currentReminderCount: number = 0
): Promise<void> {
  const path = `invoices/${id}`;
  try {
    await updateDoc(doc(db, 'invoices', id), {
      clientEmail: recipientEmail,
      reminderSentAt: new Date().toISOString(),
      reminderCount: (currentReminderCount || 0) + 1,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function cancelInvoice(
  id: string,
  reason?: string,
  cancelledBy?: string
): Promise<void> {
  const path = `invoices/${id}`;
  try {
    await updateDoc(doc(db, 'invoices', id), {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason || 'Cancelada no sistema',
      cancelledBy: cancelledBy || 'operador',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteInvoice(id: string, reason?: string): Promise<void> {
  // As faturas de água não podem ser apagadas do sistema, apenas canceladas para conformidade legal e auditoria.
  console.warn('As faturas de água não podem ser apagadas do sistema por diretriz de auditoria fiscal. Executando cancelamento formal.');
  await cancelInvoice(id, reason || 'Cancelamento solicitado em substituição da eliminação permanente');
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
      email: 'armando.sitoe@gmail.com',
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
      email: 'maria.cossa@outlook.com',
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
      email: 'joaquim.mondlane@gmail.com',
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
      email: 'graca.matsinhe@tecnologia.mz',
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
      email: 'antonio.nhantumbo@gmail.com',
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
  const monthAug = '2026-08';
  const monthJul = '2026-07';

  const sampleInvoices: Omit<Invoice, 'id'>[] = [
    {
      invoiceNumber: `0012026`,
      clientId: createdClients[0].id,
      clientName: createdClients[0].name,
      clientEmail: createdClients[0].email,
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
      dueDate: `${currentMonth}-25`, // A vencer no fim do mês
      paymentMethod: 'M-Pesa',
      notes: 'Fatura de água de consumo regular.',
      createdBy: operatorEmail || 'sistema',
    },
    {
      invoiceNumber: `0022026`,
      clientId: createdClients[1].id,
      clientName: createdClients[1].name,
      clientEmail: createdClients[1].email,
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
      invoiceNumber: `0032026`,
      clientId: createdClients[2].id,
      clientName: createdClients[2].name,
      clientEmail: createdClients[2].email,
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
      readingDate: `${currentMonth}-01`,
      dueDate: `2026-10-15`, // VENCIDA (ultrapassada em relação à data atual)
      paymentMethod: 'E-Mola',
      notes: 'Fatura em atraso. Aguarda pagamento.',
      createdBy: operatorEmail || 'sistema',
    },
    {
      invoiceNumber: `0042026`,
      clientId: createdClients[0].id,
      clientName: createdClients[0].name,
      clientEmail: createdClients[0].email,
      meterNumber: createdClients[0].meterNumber,
      periodMonth: prevMonth,
      previousReading: 110,
      currentReading: 120,
      consumptionM3: 10,
      unitPriceM3: 45.0,
      subtotal: 10 * 45.0,
      fixedFee: 50.0,
      totalAmount: 500.0,
      status: 'pending', // Vencida
      readingDate: `${prevMonth}-02`,
      dueDate: `2026-10-05`,
      paymentMethod: 'M-Pesa',
      notes: 'Fatura em atraso do mês anterior.',
      createdBy: operatorEmail || 'sistema',
    },
    {
      invoiceNumber: `0052026`,
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
    {
      invoiceNumber: `0062026`,
      clientId: createdClients[1].id,
      clientName: createdClients[1].name,
      meterNumber: createdClients[1].meterNumber,
      periodMonth: prevMonth,
      previousReading: 282,
      currentReading: 310,
      consumptionM3: 28,
      unitPriceM3: 48.0,
      subtotal: 28 * 48.0,
      fixedFee: 50.0,
      totalAmount: 1394.0,
      status: 'paid',
      readingDate: `${prevMonth}-03`,
      dueDate: `${prevMonth}-20`,
      paidAt: `${prevMonth}-12T11:00:00Z`,
      paymentMethod: 'Numerário / Caixa',
      createdBy: operatorEmail || 'sistema',
    },
    {
      invoiceNumber: `0072026`,
      clientId: createdClients[0].id,
      clientName: createdClients[0].name,
      meterNumber: createdClients[0].meterNumber,
      periodMonth: monthAug,
      previousReading: 108,
      currentReading: 120,
      consumptionM3: 12,
      unitPriceM3: 45.0,
      subtotal: 12 * 45.0,
      fixedFee: 50.0,
      totalAmount: 590.0,
      status: 'paid',
      readingDate: `${monthAug}-04`,
      dueDate: `${monthAug}-24`,
      paidAt: `${monthAug}-15T09:00:00Z`,
      paymentMethod: 'M-Pesa',
      createdBy: operatorEmail || 'sistema',
    },
    {
      invoiceNumber: `0082026`,
      clientId: createdClients[1].id,
      clientName: createdClients[1].name,
      meterNumber: createdClients[1].meterNumber,
      periodMonth: monthAug,
      previousReading: 256,
      currentReading: 282,
      consumptionM3: 26,
      unitPriceM3: 48.0,
      subtotal: 26 * 48.0,
      fixedFee: 50.0,
      totalAmount: 1298.0,
      status: 'paid',
      readingDate: `${monthAug}-04`,
      dueDate: `${monthAug}-24`,
      paidAt: `${monthAug}-14T10:00:00Z`,
      paymentMethod: 'Numerário / Caixa',
      createdBy: operatorEmail || 'sistema',
    },
    {
      invoiceNumber: `0092026`,
      clientId: createdClients[0].id,
      clientName: createdClients[0].name,
      meterNumber: createdClients[0].meterNumber,
      periodMonth: monthJul,
      previousReading: 95,
      currentReading: 108,
      consumptionM3: 13,
      unitPriceM3: 45.0,
      subtotal: 13 * 45.0,
      fixedFee: 50.0,
      totalAmount: 635.0,
      status: 'paid',
      readingDate: `${monthJul}-05`,
      dueDate: `${monthJul}-25`,
      paidAt: `${monthJul}-19T14:00:00Z`,
      paymentMethod: 'M-Pesa',
      createdBy: operatorEmail || 'sistema',
    },
    {
      invoiceNumber: `0102026`,
      clientId: createdClients[1].id,
      clientName: createdClients[1].name,
      meterNumber: createdClients[1].meterNumber,
      periodMonth: monthJul,
      previousReading: 232,
      currentReading: 256,
      consumptionM3: 24,
      unitPriceM3: 48.0,
      subtotal: 24 * 48.0,
      fixedFee: 50.0,
      totalAmount: 1202.0,
      status: 'paid',
      readingDate: `${monthJul}-03`,
      dueDate: `${monthJul}-22`,
      paidAt: `${monthJul}-14T15:00:00Z`,
      paymentMethod: 'Numerário / Caixa',
      createdBy: operatorEmail || 'sistema',
    },
    {
      invoiceNumber: `0112026`,
      clientId: createdClients[2].id,
      clientName: createdClients[2].name,
      clientEmail: createdClients[2].email,
      meterNumber: createdClients[2].meterNumber,
      periodMonth: prevMonth,
      previousReading: 70,
      currentReading: 85,
      consumptionM3: 15,
      unitPriceM3: 45.0,
      subtotal: 15 * 45.0,
      fixedFee: 50.0,
      totalAmount: 725.0,
      status: 'cancelled',
      cancelledAt: `${prevMonth}-16T09:30:00Z`,
      cancellationReason: 'Retificação de leitura solicitada pelo consumidor (hidrómetro aferido)',
      cancelledBy: operatorEmail || 'operador.manhica@aguas.mz',
      readingDate: `${prevMonth}-02`,
      dueDate: `${prevMonth}-22`,
      notes: 'Fatura cancelada e mantida no histórico para efeito de auditoria.',
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
    {
      stationId: 'posto-central-manhica',
      stationName: 'Posto Central de Captação & Abastecimento (Manhiça Sede)',
      periodMonth: monthAug,
      initialPumpReading: 9480,
      finalPumpReading: 10920,
      pumpedVolumeM3: 1440,
      operatingHours: 230,
      energyKwh: 1750,
      fuelLiters: 60,
      chlorineKg: 7.8,
      notes: 'Operação estável no pico da época seca.',
      recordedAt: new Date().toISOString(),
      recordedBy: operatorEmail || 'Engenharia de Operações',
    },
    {
      stationId: 'posto-central-manhica',
      stationName: 'Posto Central de Captação & Abastecimento (Manhiça Sede)',
      periodMonth: monthJul,
      initialPumpReading: 8120,
      finalPumpReading: 9480,
      pumpedVolumeM3: 1360,
      operatingHours: 220,
      energyKwh: 1680,
      fuelLiters: 45,
      chlorineKg: 7.5,
      notes: 'Manutenção preventiva periódica efetuada.',
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
