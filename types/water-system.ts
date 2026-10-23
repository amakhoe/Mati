export type ClientStatus = 'active' | 'inactive' | 'suspended';

export interface Client {
  id: string;
  name: string;
  meterNumber: string;
  phone: string;
  email?: string; // Endereço de email para envio de notificações e lembretes
  identityNumber: string; // BI ou NUIT
  neighborhood: string; // Bairro em Manhiça
  address: string;
  status: ClientStatus;
  joinDate: string; // YYYY-MM-DD
  initialMeterReading: number; // m³
  currentMeterReading: number; // m³
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string; // Formato oficial: número e ano (ex: 0012026)
  clientId: string;
  clientName: string;
  clientEmail?: string; // Email do cliente para notificações
  meterNumber: string;
  periodMonth: string; // YYYY-MM
  previousReading: number; // m³
  currentReading: number; // m³
  consumptionM3: number; // m³
  unitPriceM3: number; // MZN por m³ inserido manualmente
  subtotal: number; // MZN
  fixedFee: number; // Taxa de conservação/contador MZN
  totalAmount: number; // MZN
  status: InvoiceStatus;
  readingDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paidAt?: string | null;
  paymentMethod?: string; // M-Pesa, E-Mola, Numerário, Transferência
  notes?: string;
  createdAt?: string;
  createdBy?: string;
  reminderSentAt?: string; // Data e hora do último lembrete enviado
  reminderCount?: number; // Contagem de lembretes enviados
  cancelledAt?: string; // Data e hora do cancelamento (faturas não podem ser apagadas)
  cancellationReason?: string; // Motivo do cancelamento formal
  cancelledBy?: string; // Operador/Utilizador que cancelou
}

/**
 * Formats sequence number and year into the requested pattern:
 * (número da fatura e ano ex: 0012026)
 */
export function formatInvoiceNumber(sequence: number, year: number): string {
  const padded = String(Math.max(1, sequence)).padStart(3, '0');
  return `${padded}${year}`;
}

/**
 * Parses an invoice number string to extract its sequence number and year.
 * Handles both the standard format (e.g. 0012026) and legacy formats (e.g. FAT-MAN-2026-001)
 */
export function parseInvoiceNumber(invoiceNum: string): { sequence: number; year: number } | null {
  if (!invoiceNum) return null;
  const trimmed = invoiceNum.trim();
  // Standard format: sequence + 4-digit year (ex: 0012026, 0152026, 1202026)
  const standardMatch = trimmed.match(/^(\d{1,6})(\d{4})$/);
  if (standardMatch) {
    return {
      sequence: parseInt(standardMatch[1], 10),
      year: parseInt(standardMatch[2], 10),
    };
  }

  // Legacy prefix match (ex: FAT-MAN-2026-001 or FAT-2026-001)
  const legacyMatch = trimmed.match(/(\d{4})[^\d]*(\d+)/);
  if (legacyMatch) {
    return {
      sequence: parseInt(legacyMatch[2], 10),
      year: parseInt(legacyMatch[1], 10),
    };
  }

  return null;
}

/**
 * Calculates the next sequential invoice number in the format 0012026
 * based on existing invoices in the system for the given year.
 */
export function getNextInvoiceNumber(existingInvoices: Invoice[], targetYear?: number): string {
  const year = targetYear || new Date().getFullYear();
  let maxSeq = 0;

  for (const inv of existingInvoices) {
    if (!inv || !inv.invoiceNumber) continue;
    const parsed = parseInvoiceNumber(inv.invoiceNumber);
    if (parsed && parsed.year === year) {
      if (parsed.sequence > maxSeq) {
        maxSeq = parsed.sequence;
      }
    }
  }

  return formatInvoiceNumber(maxSeq + 1, year);
}

/**
 * Checks if an invoice is overdue based on current date
 */
export function isInvoiceOverdue(invoice: Invoice, todayStr?: string): boolean {
  if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
  if (invoice.status === 'overdue') return true;
  if (!invoice.dueDate) return false;
  const today = todayStr || new Date().toISOString().substring(0, 10);
  return invoice.dueDate < today;
}

/**
 * Calculates how many days an invoice is overdue
 */
export function getDaysOverdue(dueDateStr: string, todayStr?: string): number {
  if (!dueDateStr) return 0;
  try {
    const today = todayStr || new Date().toISOString().substring(0, 10);
    const dueDate = new Date(dueDateStr);
    const currentDate = new Date(today);
    const diffTime = currentDate.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  } catch {
    return 0;
  }
}

export interface WaterStationConsumption {
  id: string;
  stationId: string;
  stationName: string; // ex: Posto Central Manhiça Sede, Furo Ribínguè
  periodMonth: string; // YYYY-MM
  initialPumpReading: number; // m³
  finalPumpReading: number; // m³
  pumpedVolumeM3: number; // m³ bombeados
  operatingHours?: number;
  energyKwh?: number;
  fuelLiters?: number;
  chlorineKg?: number;
  notes?: string;
  recordedAt: string;
  recordedBy?: string;
}

export interface SystemSettings {
  companyName: string;
  companyNuit: string;
  companyPhone: string;
  companyEmail: string;
  communityName: string;
  currency: string;
  defaultUnitPriceM3: number;
  fixedMonthlyFee: number;
  paymentInstructions: string;
}

export type OperatorRole = 'admin' | 'operator' | 'supervisor';

export interface Operator {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: OperatorRole;
  status: 'active' | 'suspended';
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

export const DEFAULT_DATABASE_OPERATORS: Omit<Operator, 'id'>[] = [
  {
    name: 'Operador de Campo (Manhiça Sede)',
    email: 'operador.manhica@aguas.mz',
    password: 'Manhica2026!',
    role: 'operator',
    status: 'active',
    phone: '+258 84 312 4567',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    name: 'Administrador Geral do Sistema',
    email: 'admin.manhica@aguas.mz',
    password: 'Manhica2026!',
    role: 'admin',
    status: 'active',
    phone: '+258 87 500 1234',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    name: 'Gestor Amakhoekars (Admin)',
    email: 'amakhoekars@gmail.com',
    password: 'Manhica2026!',
    role: 'admin',
    status: 'active',
    phone: '+258 84 000 0000',
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const MANHICA_NEIGHBORHOODS = [
  'Manhiça Sede - Centro',
  'Ribínguè',
  'Nhambalo',
  'Marracuene / Marráguè',
  'Xinavane Sede',
  'Maluana',
  'Chibututuine',
  'Tsalala / 3 de Fevereiro',
  'Maciana',
  'Mitine',
  'Chiconela',
  'Zona Agro-Pecuária',
] as const;

export const DEFAULT_SETTINGS: SystemSettings = {
  companyName: 'Águas Comunitárias da Manhiça',
  companyNuit: '400987654',
  companyPhone: '+258 84 312 4567 / 87 500 1234',
  companyEmail: 'aguas.manhica@gmail.com',
  communityName: 'Vila da Manhiça, Província de Maputo',
  currency: 'MT',
  defaultUnitPriceM3: 45.0, // 45 Meticais por m³
  fixedMonthlyFee: 50.0, // 50 Meticais taxa de conservação
  paymentInstructions: 'Pagamentos via M-Pesa: 84 312 4567 | E-Mola: 86 312 4567 ou no Guiché Central da Manhiça',
};
