import React, { useState } from 'react';
import {
  SlidersHorizontal,
  MapPin,
  Plus,
  Save,
  CheckCircle,
  Play,
  Clock,
  Sparkles,
  Building,
} from 'lucide-react';
import { SearchConfig, PropertyType, SourcePlatform } from '../types/index.ts';

interface SearchConfigViewProps {
  configs: SearchConfig[];
  availableCities: string[];
  onAddCity: (city: string) => Promise<void>;
  onAddConfig: (config: any) => Promise<void>;
}

export const SearchConfigView: React.FC<SearchConfigViewProps> = ({
  configs,
  availableCities,
  onAddCity,
  onAddConfig,
}) => {
  const [newCityName, setNewCityName] = useState('');
  const [isAddingCity, setIsAddingCity] = useState(false);

  // New Search Preset Form
  const [name, setName] = useState('');
  const [selectedCities, setSelectedCities] = useState<string[]>(['Porto Belo', 'Itapema']);
  const [selectedTypes, setSelectedTypes] = useState<PropertyType[]>(['Apartamento', 'Casa']);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [minScore, setMinScore] = useState<number>(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allPropertyTypes: PropertyType[] = [
    'Apartamento',
    'Casa',
    'Cobertura',
    'Terreno',
    'Sala comercial',
    'Loja',
    'Galpão',
    'Sítio',
    'Chácara',
    'Outros',
  ];

  const handleAddCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;

    setIsAddingCity(true);
    try {
      await onAddCity(newCityName.trim());
      setNewCityName('');
    } finally {
      setIsAddingCity(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || selectedCities.length === 0) {
      alert('Informe o nome da busca e selecione ao menos uma cidade.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddConfig({
        name,
        cities: selectedCities,
        propertyTypes: selectedTypes,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minOwnerProbabilityScore: minScore,
        sources: ['OLX', 'Chaves na Mão', 'ZAP Imóveis', 'Viva Real', 'Facebook Marketplace'],
      });
      setName('');
      setMinPrice('');
      setMaxPrice('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCity = (city: string) => {
    if (selectedCities.includes(city)) {
      if (selectedCities.length > 1) {
        setSelectedCities(selectedCities.filter(c => c !== city));
      }
    } else {
      setSelectedCities([...selectedCities, city]);
    }
  };

  const toggleType = (t: PropertyType) => {
    if (selectedTypes.includes(t)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter(x => x !== t));
      }
    } else {
      setSelectedTypes([...selectedTypes, t]);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Configurações de Buscas & Áreas de Captação
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Definição de praças municipais, filtros estratégicos salvos e parametrizações do radar
            </p>
          </div>
        </div>
      </div>

      {/* Cidades Foco & Adicionar Nova Cidade */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Cidades Habilitadas para Varredura</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cidades prioritárias do litoral norte e Vale do Itajaí em Santa Catarina
            </p>
          </div>
        </div>

        {/* City Tags */}
        <div className="flex flex-wrap gap-2">
          {availableCities.map(city => (
            <span
              key={city}
              className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center space-x-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{city}</span>
              {['Porto Belo', 'Itapema', 'Bombinhas'].includes(city) && (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded ml-1">
                  Costa Esmeralda
                </span>
              )}
            </span>
          ))}
        </div>

        {/* Add City Form */}
        <form onSubmit={handleAddCitySubmit} className="pt-2 flex items-center space-x-2 max-w-md">
          <input
            type="text"
            placeholder="Nome da nova cidade (Ex: Navegantes, Penha, etc.)"
            value={newCityName}
            onChange={e => setNewCityName(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <button
            type="submit"
            disabled={isAddingCity}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Cidade</span>
          </button>
        </form>
      </div>

      {/* Grid: Existing Saved Searches & Create New Search Preset */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Existing Presets */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Configurações de Pesquisa Salvas</h3>
            <p className="text-xs text-slate-500">
              Varreduras pré-configuradas para execução manual ou periódica
            </p>
          </div>

          <div className="space-y-3">
            {configs.map(cfg => (
              <div
                key={cfg.id}
                className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 hover:border-emerald-300 transition"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900">{cfg.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Ativa
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div>
                    <strong>Cidades:</strong> {cfg.cities.join(', ')}
                  </div>
                  <div>
                    <strong>Tipos:</strong> {cfg.propertyTypes.join(', ')}
                  </div>
                  {(cfg.minPrice || cfg.maxPrice) && (
                    <div>
                      <strong>Faixa de Preço:</strong> R${' '}
                      {cfg.minPrice ? cfg.minPrice.toLocaleString('pt-BR') : '0'} até R${' '}
                      {cfg.maxPrice ? cfg.maxPrice.toLocaleString('pt-BR') : 'Sem limite'}
                    </div>
                  )}
                  <div>
                    <strong>Score IA Mínimo:</strong> {cfg.minOwnerProbabilityScore}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create New Search Preset Form */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Criar Nova Configuração de Busca</h3>
            <p className="text-xs text-slate-500">
              Personalize filtros e critérios para monitorar novas oportunidades
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3 text-xs text-slate-700">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nome da Configuração *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Foco Lançamentos Bombinhas / Mariscal"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Cidades para Monitorar (Selecione):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableCities.map(c => {
                  const isSel = selectedCities.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCity(c)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
                        isSel
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Tipos de Imóveis:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allPropertyTypes.map(t => {
                  const isSel = selectedTypes.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleType(t)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
                        isSel
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Preço Mínimo (R$)
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="500000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Preço Máximo (R$)
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="3000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Score Mínimo da IA de Proprietário: {minScore}%
              </label>
              <input
                type="range"
                min="0"
                max="95"
                step="5"
                value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Configuração de Busca</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
