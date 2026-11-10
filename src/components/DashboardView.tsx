import React from 'react';
import {
  TrendingUp,
  Building,
  UserCheck,
  Sparkles,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  MapPin,
  Flame,
  Radio,
  FileCheck,
  Clock,
  Layers,
} from 'lucide-react';
import { DashboardMetrics, PipelineStage, SourcePlatform } from '../types/index.ts';

interface DashboardViewProps {
  metrics: DashboardMetrics | null;
  onFilterByCity: (city: string) => void;
  onFilterBySource: (source: SourcePlatform) => void;
  onFilterByStage: (stage: PipelineStage) => void;
  onOpenImportModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  metrics,
  onFilterByCity,
  onFilterBySource,
  onFilterByStage,
  onOpenImportModal,
}) => {
  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total de Anúncios',
      value: metrics.totalListings,
      subtitle: `${metrics.newListingsToday} descobertos hoje`,
      icon: Layers,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      title: 'Possíveis Proprietários',
      value: metrics.possibleOwners,
      subtitle: 'Score IA entre 55% e 79%',
      icon: Sparkles,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      title: 'Proprietários Confirmados',
      value: metrics.confirmedOwners,
      subtitle: 'Score IA >= 80% ou verificado',
      icon: UserCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Imóveis Qualificados',
      value: metrics.qualifiedProperties,
      subtitle: 'Prontos para abordagem',
      icon: FileCheck,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      title: 'Em Negociação',
      value: metrics.inNegotiation,
      subtitle: 'Parceria ou visita agendada',
      icon: Flame,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
    },
    {
      title: 'Imóveis Captados',
      value: metrics.capturedProperties,
      subtitle: `Taxa de conversão: ${metrics.conversionRate}%`,
      icon: CheckCircle2,
      color: 'text-emerald-700 bg-emerald-100/60 border-emerald-300',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome & Summary Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>Radar Operando em Tempo Real</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Painel Geral de Captação Imobiliária
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Monitoramento de anúncios de venda direta com proprietários em Porto Belo, Itapema, Bombinhas, Balneário Camboriú e região.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenImportModal}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center space-x-1.5"
          >
            <span>+ Importar Novo Anúncio</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition">
                  {kpi.value}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">{kpi.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Center Grid: Cidades & Fontes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Oportunidades por Cidade (Foco Costa Esmeralda) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Oportunidades por Cidade</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Distribuição geográfica dos anúncios qualificados e captações efetivadas
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {metrics.byCity.map(item => {
              const maxCount = Math.max(...metrics.byCity.map(c => c.count), 1);
              const percentage = Math.round((item.count / maxCount) * 100);
              return (
                <div
                  key={item.city}
                  onClick={() => onFilterByCity(item.city)}
                  className="p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer border border-transparent hover:border-slate-200"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                      <span>{item.city}</span>
                      {['Porto Belo', 'Itapema', 'Bombinhas'].includes(item.city) && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded">
                          Foco
                        </span>
                      )}
                    </span>
                    <div className="flex items-center space-x-3 text-slate-600">
                      <span>
                        <strong className="text-slate-900">{item.count}</strong> identificados
                      </span>
                      {item.captured > 0 && (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                          {item.captured} captados
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Oportunidades por Fonte & Taxa de Particular */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-emerald-600" />
                <span>Fontes de Anúncios</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Origem e taxa de proprietário particular</p>
            </div>
          </div>

          <div className="space-y-3">
            {metrics.bySource.map(item => (
              <div
                key={item.source}
                onClick={() => onFilterBySource(item.source)}
                className="p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.source}</span>
                  <span className="font-bold text-slate-900">{item.count} anúncios</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Índice de particular</span>
                  <span className="font-bold text-emerald-700">{item.ownerPercentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${item.ownerPercentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Funil de Captação Resumido */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Etapas do Funil de Captação</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Volume de oportunidades em cada estágio operacional do CRM
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {metrics.pipelineSummary.slice(0, 6).map(item => (
            <div
              key={item.stage}
              onClick={() => onFilterByStage(item.stage)}
              className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-emerald-400 hover:bg-emerald-50/40 transition cursor-pointer text-center"
            >
              <div className="text-[11px] font-semibold text-slate-600 truncate">{item.stage}</div>
              <div className="text-xl font-black text-slate-900 mt-1">{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
