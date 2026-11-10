import React, { useState } from 'react';
import {
  Network,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Clock,
  Layers,
  ShieldCheck,
  ExternalLink,
  Settings,
  Info,
  Server,
  FileText,
} from 'lucide-react';
import { Connector, SourcePlatform } from '../types/index.ts';

interface ConnectorsViewProps {
  connectors: Connector[];
  logs: any[];
  onTriggerSync: (connectorId: string) => Promise<void>;
}

export const ConnectorsView: React.FC<ConnectorsViewProps> = ({
  connectors,
  logs,
  onTriggerSync,
}) => {
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSync = async (id: string) => {
    setSyncingId(id);
    try {
      await onTriggerSync(id);
    } finally {
      setSyncingId(null);
    }
  };

  const getStatusBadge = (status: Connector['status']) => {
    switch (status) {
      case 'Ativo':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          label: 'Conector Ativo & Licenciado',
        };
      case 'Requer configuração':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500',
          label: 'Requer Configuração / Importação Assistida',
        };
      case 'Erro na sincronização':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500',
          label: 'Interrupção / Alerta de Conexão',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          label: 'Em Pausa',
        };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Conectores Independentes de Pesquisa Imobiliária
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoramento estrito de conformidade legal, APIs oficiais, feeds licenciados e importações assistidas
            </p>
          </div>
        </div>
      </div>

      {/* Compliance Notice Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md flex items-start space-x-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-white">Política de Integração Ética e Conformidade Connect Imóveis</div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Esta plataforma opera exclusivamente com <strong>APIs oficiais, feeds licenciados de parceiros, webhooks autorizados e fluxos de importação assistida</strong>. É expressamente vedado o uso de web scraping abusivo, quebra de mecanismos de autenticação ou coleta indevida de dados privados. Fontes sem integração contratada ativa sinalizam claramente a necessidade de configuração assistida.
          </p>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {connectors.map(conn => {
          const badge = getStatusBadge(conn.status);
          const isSyncing = syncingId === conn.id;

          return (
            <div
              key={conn.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition"
            >
              {/* Top Title & Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm">{conn.source}</h3>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {conn.integrationType}
                  </span>
                </div>

                <div className={`p-2 rounded-xl border ${badge.bg} flex items-center space-x-2`}>
                  <div className={`w-2 h-2 rounded-full ${badge.dot}`} />
                  <span className="text-[11px] font-bold leading-tight">{badge.label}</span>
                </div>
              </div>

              {/* Statistics & Sync Details */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Registros recebidos:</span>
                  <strong className="text-slate-900">{conn.recordsReceivedCount} anúncios</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Última sincronização:</span>
                  <span className="font-medium text-slate-800">
                    {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleString('pt-BR') : 'Nunca'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Intervalo configurado:</span>
                  <span className="font-medium text-slate-800">A cada {conn.syncIntervalMinutes} min</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Erros registrados:</span>
                  <span className={`font-bold ${conn.errorsCount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {conn.errorsCount}
                  </span>
                </div>
              </div>

              {/* Error Message if present */}
              {conn.lastErrorMessage && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{conn.lastErrorMessage}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => handleSync(conn.id)}
                disabled={isSyncing || conn.status === 'Requer configuração'}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing
                    ? 'Sincronizando feed...'
                    : conn.status === 'Requer configuração'
                    ? 'Configuração Necessária'
                    : 'Executar Sincronização Agora'}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Live Sync Audit Logs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Histórico de Importações e Logs dos Conectores</h3>
            <p className="text-xs text-slate-500">
              Registros de eventos, requisições de feeds e respostas das plataformas parceiras
            </p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
          {logs.map((log: any) => (
            <div key={log.id} className="p-3 bg-slate-50/50 flex items-center justify-between hover:bg-slate-100/50">
              <div className="flex items-center space-x-3">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.level === 'SUCCESS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : log.level === 'WARN'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {log.level}
                </span>
                <span className="font-bold text-slate-900">{log.source}</span>
                <span className="text-slate-600">{log.message}</span>
              </div>
              <div className="text-[11px] text-slate-400 whitespace-nowrap pl-4">
                {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
