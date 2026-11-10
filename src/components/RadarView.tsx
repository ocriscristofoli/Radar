import React, { useState } from 'react';
import {
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Star,
  UserCheck,
  Send,
  Building,
  Bed,
  Bath,
  Car,
  Maximize2,
  Calendar,
  AlertTriangle,
  Trash2,
  MessageSquare,
  CheckCircle,
  Copy,
  ChevronRight,
  ShieldCheck,
  Clock,
  Layers,
} from 'lucide-react';
import { Property, PropertyType, SourcePlatform, PipelineStage, User } from '../types/index.ts';

interface RadarViewProps {
  properties: Property[];
  users: User[];
  availableCities: string[];
  onOpenDetailModal: (property: Property) => void;
  onOpenContactModal: (property: Property) => void;
  onToggleFavorite: (propertyId: string, current: boolean) => void;
  onUpdateStage: (propertyId: string, stage: PipelineStage) => void;
  onAssignUser: (propertyId: string, userId: string) => void;
  onDiscard: (propertyId: string) => void;
  onOpenImportModal: () => void;
  selectedCityFilter?: string;
  selectedSourceFilter?: string;
  selectedStageFilter?: string;
}

export const RadarView: React.FC<RadarViewProps> = ({
  properties,
  users,
  availableCities,
  onOpenDetailModal,
  onOpenContactModal,
  onToggleFavorite,
  onUpdateStage,
  onAssignUser,
  onDiscard,
  onOpenImportModal,
  selectedCityFilter,
  selectedSourceFilter,
  selectedStageFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState(selectedCityFilter || 'all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState(selectedSourceFilter || 'all');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);
  const [stageFilter, setStageFilter] = useState(selectedStageFilter || 'all');
  const [sortBy, setSortBy] = useState<'recent' | 'score' | 'priceAsc' | 'priceDesc'>('score');

  // Filter properties
  const filtered = properties.filter(prop => {
    if (cityFilter !== 'all' && prop.city.toLowerCase() !== cityFilter.toLowerCase()) return false;
    if (typeFilter !== 'all' && prop.type !== typeFilter) return false;
    if (sourceFilter !== 'all' && prop.primarySource !== sourceFilter && !prop.sources.some(s => s.source === sourceFilter)) return false;
    if (stageFilter !== 'all' && prop.crmStage !== stageFilter) return false;
    if (prop.aiAnalysis.score < minScoreFilter) return false;
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const match =
        prop.title.toLowerCase().includes(q) ||
        prop.description.toLowerCase().includes(q) ||
        prop.city.toLowerCase().includes(q) ||
        prop.neighborhood.toLowerCase().includes(q) ||
        prop.advertiser.name.toLowerCase().includes(q) ||
        (prop.advertiser.phone && prop.advertiser.phone.includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Sort properties
  filtered.sort((a, b) => {
    if (sortBy === 'score') return b.aiAnalysis.score - a.aiAnalysis.score;
    if (sortBy === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'priceAsc') return a.price - b.price;
    if (sortBy === 'priceDesc') return b.price - a.price;
    return 0;
  });

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-500',
        label: 'Alta Probabilidade Particular',
      };
    }
    if (score >= 55) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-300',
        dot: 'bg-amber-500',
        label: 'Média Probabilidade',
      };
    }
    return {
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      dot: 'bg-slate-400',
      label: 'Baixa / Imobiliária',
    };
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Search & Filter Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por palavras-chave, rua, bairro, código ou nome do anunciante..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="score">Maior Score de Proprietário</option>
              <option value="recent">Mais Recentes</option>
              <option value="priceAsc">Menor Valor</option>
              <option value="priceDesc">Maior Valor</option>
            </select>
          </div>
        </div>

        {/* Detailed Quick Filter Badges & Selects */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Cidade */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cidade</label>
            <select
              value={cityFilter}
              onChange={e => setCityFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
            >
              <option value="all">Todas as Cidades</option>
              {availableCities.map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Imóvel */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tipo</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
            >
              <option value="all">Todos os Tipos</option>
              <option value="Apartamento">Apartamento</option>
              <option value="Casa">Casa</option>
              <option value="Cobertura">Cobertura</option>
              <option value="Terreno">Terreno</option>
              <option value="Sala comercial">Sala comercial</option>
            </select>
          </div>

          {/* Fonte */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Fonte</label>
            <select
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
            >
              <option value="all">Todas as Fontes</option>
              <option value="OLX">OLX</option>
              <option value="Chaves na Mão">Chaves na Mão</option>
              <option value="ZAP Imóveis">ZAP Imóveis</option>
              <option value="Viva Real">Viva Real</option>
              <option value="Facebook Marketplace">Facebook Marketplace</option>
              <option value="Manual / Assistido">Manual / Assistido</option>
            </select>
          </div>

          {/* Score Mínimo de Proprietário */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Score IA Mínimo</label>
            <select
              value={minScoreFilter}
              onChange={e => setMinScoreFilter(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
            >
              <option value={0}>Todos os Scores (0%+)</option>
              <option value={50}>Acima de 50%</option>
              <option value={75}>Alta Probabilidade (75%+)</option>
              <option value={90}>Quase Certo (90%+)</option>
            </select>
          </div>

          {/* Estágio do Funil */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Estágio CRM</label>
            <select
              value={stageFilter}
              onChange={e => setStageFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
            >
              <option value="all">Todos os Estágios</option>
              <option value="Novo anúncio">Novo anúncio</option>
              <option value="Em análise">Em análise</option>
              <option value="Possível proprietário">Possível proprietário</option>
              <option value="Proprietário confirmado">Proprietário confirmado</option>
              <option value="Primeiro contato">Primeiro contato</option>
              <option value="Interessado em parceria">Interessado em parceria</option>
              <option value="Em negociação">Em negociação</option>
              <option value="Autorização de venda">Autorização de venda</option>
              <option value="Imóvel captado">Imóvel captado</option>
            </select>
          </div>
        </div>

        {/* Counter & Active filter labels */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            Mostrando <strong>{filtered.length}</strong> de <strong>{properties.length}</strong> oportunidades identificadas
          </div>
          {(cityFilter !== 'all' || sourceFilter !== 'all' || stageFilter !== 'all' || minScoreFilter > 0 || searchTerm) && (
            <button
              onClick={() => {
                setCityFilter('all');
                setTypeFilter('all');
                setSourceFilter('all');
                setMinScoreFilter(0);
                setStageFilter('all');
                setSearchTerm('');
              }}
              className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer underline text-[11px]"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Property Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs max-w-xl mx-auto">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhum imóvel encontrado</h3>
          <p className="text-xs text-slate-500 mt-1">
            Tente flexibilizar os filtros de busca ou importe novos anúncios para alimentar o radar.
          </p>
          <button
            onClick={onOpenImportModal}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            Importar Novo Anúncio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(property => {
            const badge = getScoreBadge(property.aiAnalysis.score);
            const mainImage = property.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';
            const primarySourceObj = property.sources[0];

            return (
              <div
                key={property.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-lg transition-all flex flex-col overflow-hidden group"
              >
                {/* Image & Top Badges */}
                <div className="relative h-48 bg-slate-900 overflow-hidden cursor-pointer" onClick={() => onOpenDetailModal(property)}>
                  <img
                    src={mainImage}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                  {/* Top Bar on Image: Source + Favorite */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-900/90 text-white backdrop-blur-md border border-white/20 shadow-xs flex items-center space-x-1">
                      <span>{property.primarySource}</span>
                      {property.sources.length > 1 && (
                        <span className="text-emerald-400 ml-1">+{property.sources.length - 1} fontes</span>
                      )}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onToggleFavorite(property.id, !!property.isFavorite);
                      }}
                      className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition cursor-pointer"
                    >
                      <Star
                        className={`w-4 h-4 ${property.isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                      />
                    </button>
                  </div>

                  {/* Bottom Bar on Image: Price & City */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-lg font-black tracking-tight text-white drop-shadow-sm">
                      R$ {property.price.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-xs text-slate-200 flex items-center space-x-1 mt-0.5">
                      <span>{property.neighborhood}</span>
                      <span>•</span>
                      <span className="font-semibold">{property.city}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  {/* Title & Type */}
                  <div>
                    <div className="flex items-center space-x-2 text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                      <span>{property.type}</span>
                      <span>•</span>
                      <span className="text-slate-500 capitalize">{property.crmStage}</span>
                    </div>
                    <h3
                      onClick={() => onOpenDetailModal(property)}
                      className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-emerald-700 transition cursor-pointer"
                    >
                      {property.title}
                    </h3>
                  </div>

                  {/* Attributes: Area, Bedrooms, Suites, Spots */}
                  <div className="grid grid-cols-4 gap-1 py-2 border-y border-slate-100 text-slate-600 text-[11px] text-center">
                    <div title="Área Privativa">
                      <span className="font-bold text-slate-900">{property.areaPrivate}</span> m²
                    </div>
                    <div title="Quartos">
                      <span className="font-bold text-slate-900">{property.bedrooms}</span> qts
                    </div>
                    <div title="Suítes">
                      <span className="font-bold text-slate-900">{property.suites}</span> suítes
                    </div>
                    <div title="Vagas de Garagem">
                      <span className="font-bold text-slate-900">{property.parkingSpots}</span> vagas
                    </div>
                  </div>

                  {/* AI Score Badge & Anunciante */}
                  <div className="space-y-2">
                    <div className={`p-2.5 rounded-xl border ${badge.bg} flex items-center justify-between`}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
                        <span className="text-xs font-bold leading-tight">{badge.label}</span>
                      </div>
                      <div className="flex items-center space-x-1 bg-white/80 px-2 py-0.5 rounded-md font-black text-xs shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{property.aiAnalysis.score}/100</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <div className="truncate pr-2">
                        <span className="text-slate-400 text-[10px] block">Anunciante:</span>
                        <span className="font-medium text-slate-800 truncate">{property.advertiser.name || 'Proprietário Particular'}</span>
                      </div>
                      {property.assignedUserName && (
                        <div className="text-right whitespace-nowrap">
                          <span className="text-slate-400 text-[10px] block">Corretor:</span>
                          <span className="font-semibold text-emerald-700">{property.assignedUserName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center space-x-2">
                    <button
                      onClick={() => onOpenContactModal(property)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-3 rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Contatar Proprietário</span>
                    </button>

                    <button
                      onClick={() => onOpenDetailModal(property)}
                      title="Ver Análise Completa da IA e Histórico"
                      className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>

                    {primarySourceObj?.originalUrl && (
                      <a
                        href={primarySourceObj.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir Anúncio Original no Portal"
                        className="w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
