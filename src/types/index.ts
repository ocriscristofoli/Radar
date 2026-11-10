export type UserRole = 'ADMIN' | 'GESTOR' | 'CORRETOR';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  active: boolean;
  phone?: string;
  assignedLeadsCount?: number;
  creci?: string;
}

export type PropertyType = 
  | 'Apartamento'
  | 'Casa'
  | 'Cobertura'
  | 'Terreno'
  | 'Sala comercial'
  | 'Loja'
  | 'Galpão'
  | 'Sítio'
  | 'Chácara'
  | 'Outros';

export type SourcePlatform = 
  | 'OLX'
  | 'Chaves na Mão'
  | 'Facebook Marketplace'
  | 'Grupos Facebook'
  | 'ZAP Imóveis'
  | 'Viva Real'
  | 'Manual / Assistido';

export type OwnerClassification = 
  | 'Alta probabilidade de particular'
  | 'Média probabilidade'
  | 'Baixa probabilidade'
  | 'Provável imobiliária'
  | 'Não identificado';

export type PipelineStage = 
  | 'Novo anúncio'
  | 'Em análise'
  | 'Possível proprietário'
  | 'Proprietário confirmado'
  | 'Primeiro contato'
  | 'Aguardando resposta'
  | 'Interessado em parceria'
  | 'Em negociação'
  | 'Autorização de venda'
  | 'Imóvel captado'
  | 'Descartado';

export interface AiAnalysis {
  score: number; // 0 to 100
  classification: OwnerClassification;
  indicators: string[]; // e.g. "Expressão: Direto com proprietário", "Contato pessoal informado"
  counterIndicators: string[]; // e.g. "Menção a CRECI", "Linguagem típica de agência"
  reasoning: string;
  suggestedApproach: string;
  suggestedMessage: string;
  analyzedAt: string;
}

export interface ListingSource {
  id: string;
  source: SourcePlatform;
  originalUrl: string;
  externalId?: string;
  price: number;
  title: string;
  publishedAt: string;
  discoveredAt: string;
  advertiserName?: string;
  advertiserContact?: string;
}

export interface Property {
  id: string;
  title: string;
  type: PropertyType;
  price: number;
  originalPrice?: number;
  condoFee?: number;
  iptu?: number;
  city: string;
  neighborhood: string;
  address?: string;
  isApproximateLocation: boolean;
  lat: number;
  lng: number;
  areaPrivate: number; // m²
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parkingSpots: number;
  description: string;
  images: string[];
  primarySource: SourcePlatform;
  sources: ListingSource[];
  aiAnalysis: AiAnalysis;
  advertiser: {
    name: string;
    phone?: string;
    email?: string;
    type: 'Particular' | 'Corretor Autônomo' | 'Imobiliária' | 'Indefinido';
    isOwnerConfirmed: boolean;
    doNotContact?: boolean;
    consentNotes?: string;
  };
  crmStage: PipelineStage;
  assignedToUserId?: string;
  assignedUserName?: string;
  isFavorite?: boolean;
  duplicateGroupId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ContactHistory {
  id: string;
  propertyId: string;
  userId: string;
  userName: string;
  channel: 'WhatsApp' | 'Telefone' | 'E-mail' | 'Presencial';
  date: string;
  messageContent: string;
  responseStatus: 'Respondido' | 'Aguardando' | 'Sem interesse' | 'Não perturbe' | 'Agendou visita';
  notes?: string;
  optOutRequested?: boolean;
}

export interface Connector {
  id: string;
  source: SourcePlatform;
  status: 'Ativo' | 'Em pausa' | 'Requer configuração' | 'Erro na sincronização';
  integrationType: 'API Oficial' | 'Feed Licenciado' | 'Alerta Autorizado' | 'Importação Assistida';
  lastSyncAt?: string;
  recordsReceivedCount: number;
  errorsCount: number;
  lastErrorMessage?: string;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
}

export interface SearchConfig {
  id: string;
  name: string;
  cities: string[];
  neighborhoods?: string[];
  propertyTypes: PropertyType[];
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  minBedrooms?: number;
  sources: SourcePlatform[];
  minOwnerProbabilityScore?: number;
  isActive: boolean;
  createdAt: string;
}

export interface DashboardMetrics {
  totalListings: number;
  newListingsToday: number;
  possibleOwners: number;
  confirmedOwners: number;
  qualifiedProperties: number;
  inNegotiation: number;
  capturedProperties: number;
  conversionRate: number;
  byCity: { city: string; count: number; captured: number }[];
  bySource: { source: SourcePlatform; count: number; ownerPercentage: number }[];
  pipelineSummary: { stage: PipelineStage; count: number }[];
  monthlyPerformance: { month: string; captured: number; leads: number }[];
}
