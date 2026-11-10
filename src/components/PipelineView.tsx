import React, { useState } from 'react';
import {
  KanbanSquare,
  Sparkles,
  Building,
  User,
  ArrowRight,
  MessageSquare,
  Clock,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Calendar,
  Phone,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { Property, PipelineStage, User as UserType } from '../types/index.ts';

interface PipelineViewProps {
  properties: Property[];
  users: UserType[];
  onOpenDetailModal: (property: Property) => void;
  onOpenContactModal: (property: Property) => void;
  onUpdateStage: (propertyId: string, stage: PipelineStage) => void;
  onAssignUser: (propertyId: string, userId: string) => void;
}

const PIPELINE_STAGES: { stage: PipelineStage; color: string; desc: string }[] = [
  { stage: 'Novo anúncio', color: 'border-blue-400 bg-blue-50/50', desc: 'Descoberto recentemente no radar' },
  { stage: 'Em análise', color: 'border-slate-300 bg-slate-50', desc: 'Verificando dados preliminares' },
  { stage: 'Possível proprietário', color: 'border-amber-400 bg-amber-50/50', desc: 'Score IA indica particular' },
  { stage: 'Proprietário confirmado', color: 'border-emerald-400 bg-emerald-50/50', desc: 'Titularidade confirmada' },
  { stage: 'Primeiro contato', color: 'border-indigo-400 bg-indigo-50/50', desc: 'Mensagem de aproximação enviada' },
  { stage: 'Aguardando resposta', color: 'border-purple-400 bg-purple-50/50', desc: 'Proprietário avaliando contato' },
  { stage: 'Interessado em parceria', color: 'border-teal-400 bg-teal-50/50', desc: 'Aceitou apresentar clientes' },
  { stage: 'Em negociação', color: 'border-orange-400 bg-orange-50/50', desc: 'Alinhando visita e termos' },
  { stage: 'Autorização de venda', color: 'border-cyan-500 bg-cyan-50/50', desc: 'Documentação autorizada assinada' },
  { stage: 'Imóvel captado', color: 'border-emerald-600 bg-emerald-100/60', desc: 'Imóvel na carteira Connect' },
  { stage: 'Descartado', color: 'border-rose-300 bg-rose-50/40', desc: 'Não qualificado / opt-out LGPD' },
];

export const PipelineView: React.FC<PipelineViewProps> = ({
  properties,
  users,
  onOpenDetailModal,
  onOpenContactModal,
  onUpdateStage,
  onAssignUser,
}) => {
  const [selectedBrokerFilter, setSelectedBrokerFilter] = useState('all');

  const filteredProperties = properties.filter(p => {
    if (selectedBrokerFilter !== 'all' && p.assignedToUserId !== selectedBrokerFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4 pb-16">
      {/* Funnel Header Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <KanbanSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Funil Operacional de Captação</h2>
            <p className="text-[11px] text-slate-500">
              11 etapas do processo de identificação, abordagem, autorização e captação efetiva
            </p>
          </div>
        </div>

        {/* Filter by Corretor */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-500">Filtrar por Corretor:</span>
          <select
            value={selectedBrokerFilter}
            onChange={e => setSelectedBrokerFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800"
          >
            <option value="all">Toda a Equipe</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Container (Horizontal Scroll) */}
      <div className="flex space-x-4 overflow-x-auto pb-4 pt-1 min-h-[600px] no-scrollbar">
        {PIPELINE_STAGES.map(col => {
          const colProperties = filteredProperties.filter(p => p.crmStage === col.stage);

          return (
            <div
              key={col.stage}
              className={`w-72 flex-shrink-0 rounded-2xl border ${col.color} flex flex-col shadow-xs bg-slate-50/60 max-h-[750px]`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-200/70 bg-white/70 rounded-t-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs text-slate-900">{col.stage}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                      {colProperties.length}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[190px]">{col.desc}</div>
                </div>
              </div>

              {/* Cards Container */}
              <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                {colProperties.length === 0 ? (
                  <div className="py-8 text-center text-[11px] text-slate-400">
                    Nenhum imóvel nesta etapa
                  </div>
                ) : (
                  colProperties.map(prop => (
                    <div
                      key={prop.id}
                      className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs hover:shadow-md transition space-y-2 group"
                    >
                      {/* Image Thumbnail & Title */}
                      <div className="flex space-x-2.5">
                        <img
                          src={prop.images[0]}
                          alt={prop.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4
                            onClick={() => onOpenDetailModal(prop)}
                            className="font-bold text-xs text-slate-900 line-clamp-2 hover:text-emerald-700 transition cursor-pointer"
                          >
                            {prop.title}
                          </h4>
                          <div className="text-[11px] font-black text-emerald-700 mt-0.5">
                            R$ {prop.price.toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      {/* City & AI Score */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="font-medium text-slate-700">
                          {prop.neighborhood}, {prop.city}
                        </span>
                        <span className="font-bold text-emerald-700 flex items-center space-x-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{prop.aiAnalysis.score}%</span>
                        </span>
                      </div>

                      {/* Responsible User & Quick Stage Mover */}
                      <div className="flex items-center justify-between gap-1 pt-1">
                        <select
                          value={prop.assignedToUserId || ''}
                          onChange={e => onAssignUser(prop.id, e.target.value)}
                          className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 max-w-[110px] truncate"
                        >
                          {users.map(u => (
                            <option key={u.id} value={u.id}>
                              {u.name.split(' ')[0]}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onOpenContactModal(prop)}
                            title="Contatar via WhatsApp"
                            className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick stage selector */}
                          <select
                            value={prop.crmStage}
                            onChange={e => onUpdateStage(prop.id, e.target.value as PipelineStage)}
                            title="Mover de estágio"
                            className="text-[10px] bg-slate-100 border border-slate-200 rounded px-1 py-1 text-slate-800 font-semibold"
                          >
                            {PIPELINE_STAGES.map(s => (
                              <option key={s.stage} value={s.stage}>
                                {s.stage}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
