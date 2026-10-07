export type ClientStatus = 'active' | 'inactive' | 'suspended';

export interface Client {
  id: string;
  name: string;
  meterNumber: string;
  phone: string;
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
  invoiceNumber: string;
  clientId: string;
  clientName: string;
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
