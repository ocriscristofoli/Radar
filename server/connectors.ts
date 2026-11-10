import { Connector, SourcePlatform } from '../src/types/index.ts';

export interface ConnectorLog {
  id: string;
  source: SourcePlatform;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  recordsCount?: number;
}

export const INITIAL_CONNECTORS: Connector[] = [
  {
    id: 'conn-olx',
    source: 'OLX',
    status: 'Ativo',
    integrationType: 'Feed Licenciado',
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    recordsReceivedCount: 142,
    errorsCount: 0,
    autoSyncEnabled: true,
    syncIntervalMinutes: 60,
  },
  {
    id: 'conn-chaves',
    source: 'Chaves na Mão',
    status: 'Ativo',
    integrationType: 'API Oficial',
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    recordsReceivedCount: 88,
    errorsCount: 1,
    lastErrorMessage: 'Alerta de quota diária na API parceira (200 OK na reconexão)',
    autoSyncEnabled: true,
    syncIntervalMinutes: 120,
  },
  {
    id: 'conn-fb-market',
    source: 'Facebook Marketplace',
    status: 'Requer configuração',
    integrationType: 'Importação Assistida',
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    recordsReceivedCount: 29,
    errorsCount: 0,
    autoSyncEnabled: false,
    syncIntervalMinutes: 240,
    lastErrorMessage: 'Requer token de API Meta Business ou importação assistida de anúncio',
  },
  {
    id: 'conn-fb-groups',
    source: 'Grupos Facebook',
    status: 'Requer configuração',
    integrationType: 'Importação Assistida',
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    recordsReceivedCount: 17,
    errorsCount: 0,
    autoSyncEnabled: false,
    syncIntervalMinutes: 360,
    lastErrorMessage: 'Apenas grupos públicos com permissão de feed/webhook configurado',
  },
  {
    id: 'conn-zap',
    source: 'ZAP Imóveis',
    status: 'Ativo',
    integrationType: 'Feed Licenciado',
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    recordsReceivedCount: 215,
    errorsCount: 0,
    autoSyncEnabled: true,
    syncIntervalMinutes: 60,
  },
  {
    id: 'conn-vivareal',
    source: 'Viva Real',
    status: 'Ativo',
    integrationType: 'Feed Licenciado',
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    recordsReceivedCount: 198,
    errorsCount: 0,
    autoSyncEnabled: true,
    syncIntervalMinutes: 60,
  },
];

export const INITIAL_CONNECTOR_LOGS: ConnectorLog[] = [
  {
    id: 'log-1',
    source: 'Viva Real',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    level: 'SUCCESS',
    message: 'Sincronização de feed autorizado concluída com sucesso.',
    recordsCount: 14,
  },
  {
    id: 'log-2',
    source: 'ZAP Imóveis',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    level: 'SUCCESS',
    message: 'Varredura de novos anúncios aprovados pela API de parceiros.',
    recordsCount: 18,
  },
  {
    id: 'log-3',
    source: 'OLX',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    level: 'SUCCESS',
    message: 'Feed de classificados diretos recebido e higienizado.',
    recordsCount: 22,
  },
  {
    id: 'log-4',
    source: 'Chaves na Mão',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    level: 'INFO',
    message: 'Sessão restabelecida após rotação de token da API de busca.',
    recordsCount: 9,
  },
];
