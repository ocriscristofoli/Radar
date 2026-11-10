import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ExternalLink,
  MapPin,
  Calendar,
  Building,
  Bed,
  Bath,
  Car,
  Maximize2,
  DollarSign,
  User,
  Phone,
  Clock,
  RotateCw,
  CheckCircle,
  AlertTriangle,
  Send,
  ShieldCheck,
  Tag,
  Link,
  MessageSquare,
} from 'lucide-react';
import { Property, ContactHistory, PipelineStage, User as UserType } from '../types/index.ts';

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  users: UserType[];
  onOpenContactModal: (property: Property) => void;
  onUpdateStage: (propertyId: string, stage: PipelineStage) => void;
  onAssignUser: (propertyId: string, userId: string) => void;
  onReanalyzeAi: (propertyId: string) => Promise<void>;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  isOpen,
  onClose,
  users,
  onOpenContactModal,
  onUpdateStage,
  onAssignUser,
  onReanalyzeAi,
}) => {
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!isOpen || !property) return null;

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      await onReanalyzeAi(property.id);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (score >= 55) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-slate-700 bg-slate-100 border-slate-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {property.primarySource}
            </span>
            <div className="text-xs text-slate-300 flex items-center space-x-2">
              <span>{property.city}</span>
              <span>•</span>
              <span>{property.neighborhood}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Top Title & Price Section */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1 flex-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                {property.type} à Venda
              </span>
              <h2 className="text-lg font-black text-slate-900 leading-snug">{property.title}</h2>
              <div className="flex items-center space-x-2 text-xs text-slate-500 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {property.address || property.neighborhood}, {property.city} - SC
                </span>
                {property.isApproximateLocation && (
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">
                    (Posição aproximada no bairro)
                  </span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right min-w-[200px]">
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Valor Anunciado</div>
              <div className="text-2xl font-black text-emerald-700">
                R$ {property.price.toLocaleString('pt-BR')}
              </div>
              {property.originalPrice && property.originalPrice !== property.price && (
                <div className="text-[10px] text-slate-400 line-through">
                  Original: R$ {property.originalPrice.toLocaleString('pt-BR')}
                </div>
              )}
              {property.condoFee ? (
                <div className="text-[10px] text-slate-500 mt-1">
                  Condomínio: R$ {property.condoFee} | IPTU: R$ {property.iptu || 0}
                </div>
              ) : null}
            </div>
          </div>

          {/* Photo Gallery with Selector */}
          <div className="space-y-2">
            <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-950 relative">
              <img
                src={property.images[selectedPhotoIndex] || property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-[11px] font-medium">
                Foto {selectedPhotoIndex + 1} de {property.images.length}
              </div>
            </div>

            {property.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
                {property.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt="thumbnail"
                    onClick={() => setSelectedPhotoIndex(i)}
                    className={`w-16 h-12 rounded-lg object-cover cursor-pointer border-2 transition ${
                      selectedPhotoIndex === i ? 'border-emerald-600 scale-105' : 'border-transparent opacity-70'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Attribute Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Área Privativa</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{property.areaPrivate} m²</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Dormitórios</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{property.bedrooms} quartos</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Suítes</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{property.suites} suítes</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-semibold">Vagas de Garagem</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{property.parkingSpots} vagas</div>
            </div>
          </div>

          {/* AI ANALYSIS SECTION */}
          <div className="p-5 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 border border-emerald-200 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Interpretação e Score do Anunciante (Motor Gemini AI)
                </h3>
              </div>
              <button
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-emerald-300 hover:border-emerald-500 rounded-lg text-emerald-800 text-[11px] font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
                <span>Reanalisar Anúncio</span>
              </button>
            </div>

            {/* Score & Classification Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black border ${getScoreColor(
                    property.aiAnalysis.score
                  )}`}
                >
                  <span className="text-base leading-none">{property.aiAnalysis.score}</span>
                  <span className="text-[9px] font-medium opacity-80">/100</span>
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">{property.aiAnalysis.classification}</div>
                  <div className="text-[10px] text-slate-500">
                    Calculado com base em semântica textual, padrões de contato e jargão imobiliário
                  </div>
                </div>
              </div>
            </div>

            {/* Indicators Found */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1.5">
                <div className="text-[11px] font-bold text-emerald-800 flex items-center space-x-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Indícios Favoráveis a Particular ({property.aiAnalysis.indicators.length})</span>
                </div>
                {property.aiAnalysis.indicators.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Nenhum termo explícito identificado.</p>
                ) : (
                  <ul className="space-y-1">
                    {property.aiAnalysis.indicators.map((ind, i) => (
                      <li key={i} className="text-[11px] text-slate-700 flex items-start space-x-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1.5">
                <div className="text-[11px] font-bold text-amber-800 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Indícios Profissionais / Imobiliária ({property.aiAnalysis.counterIndicators.length})</span>
                </div>
                {property.aiAnalysis.counterIndicators.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Sem registros de CRECI ou menções comerciais.</p>
                ) : (
                  <ul className="space-y-1">
                    {property.aiAnalysis.counterIndicators.map((ind, i) => (
                      <li key={i} className="text-[11px] text-slate-700 flex items-start space-x-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
              <div className="text-[11px] font-bold text-slate-800">Justificativa da Inteligência Artificial:</div>
              <p className="text-xs text-slate-600 leading-relaxed">{property.aiAnalysis.reasoning}</p>
            </div>

            {/* Suggested Approach */}
            <div className="p-3 bg-emerald-100/40 border border-emerald-200 rounded-xl space-y-1">
              <div className="text-[11px] font-bold text-emerald-900">Estratégia Recomendada para o Corretor:</div>
              <p className="text-xs text-emerald-800 leading-relaxed">{property.aiAnalysis.suggestedApproach}</p>
            </div>
          </div>

          {/* MULTI-SOURCE & DUPLICATE TRACKING */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <Link className="w-4 h-4 text-emerald-600" />
              <span>Preservação de Fontes e Rastreio Antiduplicidade</span>
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {property.sources.map(src => (
                <div key={src.id} className="p-3 bg-slate-50 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{src.source}</span>
                      <span className="text-emerald-700 font-bold">R$ {src.price.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Título na fonte: "{src.title}" • Descoberto em: {new Date(src.discoveredAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  {src.originalUrl && (
                    <a
                      href={src.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-400 rounded-lg text-slate-700 text-xs font-semibold flex items-center space-x-1 transition"
                    >
                      <span>Abrir Anúncio Original</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Descrição Original do Anúncio
            </h4>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-line leading-relaxed">
              {property.description}
            </div>
          </div>

          {/* OPERATIONAL CRM CONTROLS */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-4">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Controles Operacionais de Captação & CRM
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Estágio Atual do Funil:</label>
                <select
                  value={property.crmStage}
                  onChange={e => onUpdateStage(property.id, e.target.value as PipelineStage)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="Novo anúncio">Novo anúncio</option>
                  <option value="Em análise">Em análise</option>
                  <option value="Possível proprietário">Possível proprietário</option>
                  <option value="Proprietário confirmado">Proprietário confirmado</option>
                  <option value="Primeiro contato">Primeiro contato</option>
                  <option value="Aguardando resposta">Aguardando resposta</option>
                  <option value="Interessado em parceria">Interessado em parceria</option>
                  <option value="Em negociação">Em negociação</option>
                  <option value="Autorização de venda">Autorização de venda</option>
                  <option value="Imóvel captado">Imóvel captado</option>
                  <option value="Descartado">Descartado</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Corretor Responsável:</label>
                <select
                  value={property.assignedToUserId || ''}
                  onChange={e => onAssignUser(property.id, e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Anunciante: <strong>{property.advertiser.name}</strong> •{' '}
            {property.advertiser.phone || 'Telefone não divulgado'}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold text-xs hover:bg-white transition cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenContactModal(property);
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Preparar Contato WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
