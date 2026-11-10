import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Filter,
  Sparkles,
  Maximize2,
  Building,
  Navigation,
  Info,
  Layers,
  Compass,
} from 'lucide-react';
import { Property, PropertyType } from '../types/index.ts';

interface MapViewProps {
  properties: Property[];
  availableCities: string[];
  onOpenDetailModal: (property: Property) => void;
  onOpenContactModal: (property: Property) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  properties,
  availableCities,
  onOpenDetailModal,
  onOpenContactModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [cityFilter, setCityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [minScoreFilter, setMinScoreFilter] = useState(0);

  // Filtered properties for map
  const mapProperties = properties.filter(p => {
    if (cityFilter !== 'all' && p.city.toLowerCase() !== cityFilter.toLowerCase()) return false;
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (p.aiAnalysis.score < minScoreFilter) return false;
    return true;
  });

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center on Itapema / Porto Belo / Costa Esmeralda area
      const map = L.map(mapContainerRef.current, {
        center: [-27.1425, -48.6083],
        zoom: 12,
        zoomControl: true,
      });

      // CartoDB Positron clean map tiles (contemporary CRM aesthetics)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CartoDB</a> / Connect Imóveis',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when properties or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    mapProperties.forEach(prop => {
      if (!prop.lat || !prop.lng) return;

      const isHigh = prop.aiAnalysis.score >= 80;
      const isMed = prop.aiAnalysis.score >= 55 && prop.aiAnalysis.score < 80;
      const colorBg = isHigh ? '#059669' : isMed ? '#d97706' : '#64748b';

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            background-color: ${colorBg};
            color: white;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid white;
            cursor: pointer;
            white-space: nowrap;
          ">
            <span>R$ ${(prop.price / 1000).toFixed(0)}k</span>
            <span style="font-size: 9px; opacity: 0.9;">(${prop.aiAnalysis.score}%)</span>
          </div>
        `,
        iconSize: [80, 30],
        iconAnchor: [40, 15],
      });

      const marker = L.marker([prop.lat, prop.lng], { icon: customIcon });

      // Interactive popup
      const popupHtml = `
        <div style="width: 240px; font-family: inherit;">
          <img src="${prop.images[0] || ''}" style="width: 100%; height: 110px; object-fit: cover; border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem;" />
          <div style="padding: 10px;">
            <div style="font-size: 10px; font-weight: 700; color: #059669; text-transform: uppercase;">${prop.type} • ${prop.neighborhood}</div>
            <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin: 2px 0; line-height: 1.2;">${prop.title}</div>
            <div style="font-size: 14px; font-weight: 900; color: #059669; margin: 4px 0;">R$ ${prop.price.toLocaleString('pt-BR')}</div>
            <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">
              ${prop.isApproximateLocation ? '📍 Posição aproximada no bairro' : '📍 Endereço verificado'}
            </div>
            <div style="font-size: 10px; padding: 4px 6px; border-radius: 6px; background: #ecfdf5; color: #065f46; font-weight: 700; margin-bottom: 8px;">
              Score IA: ${prop.aiAnalysis.score}/100 • ${prop.aiAnalysis.classification}
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedProperty(prop);
      });

      markersGroup.addLayer(marker);
      bounds.extend([prop.lat, prop.lng]);
    });

    if (mapProperties.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [mapProperties]);

  return (
    <div className="space-y-4 pb-12">
      {/* Filter and Geographic Summary Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Mapa Georreferenciado de Captação</h2>
            <p className="text-[11px] text-slate-500">
              {mapProperties.length} imóveis mapeados • Proteção de privacidade: localização por bairro aproximado
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
          >
            <option value="all">Todas as Cidades</option>
            {availableCities.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
          >
            <option value="all">Todos os Tipos</option>
            <option value="Apartamento">Apartamento</option>
            <option value="Casa">Casa</option>
            <option value="Cobertura">Cobertura</option>
            <option value="Terreno">Terreno</option>
          </select>

          <select
            value={minScoreFilter}
            onChange={e => setMinScoreFilter(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
          >
            <option value={0}>Todos os Scores</option>
            <option value={60}>Score IA &gt;= 60%</option>
            <option value={80}>Score IA &gt;= 80% (Alta)</option>
          </select>
        </div>
      </div>

      {/* Map + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[580px]">
        {/* Leaflet Map Container */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden relative min-h-[500px]">
          <div ref={mapContainerRef} className="w-full h-full min-h-[520px] z-10" />

          {/* Map Legend Floating */}
          <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-md text-[11px] space-y-1">
            <div className="font-bold text-slate-800">Legenda de Probabilidade:</div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
              <span>Alta probabilidade de particular (80%+)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-amber-600"></div>
              <span>Média probabilidade (55-79%)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-slate-500"></div>
              <span>Provável imobiliária (&lt;55%)</span>
            </div>
          </div>
        </div>

        {/* Selected Property Preview Drawer */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col justify-between">
          {selectedProperty ? (
            <div className="space-y-3">
              <div className="relative h-40 rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={selectedProperty.images[0]}
                  alt={selectedProperty.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold">
                  {selectedProperty.city}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  {selectedProperty.type} • {selectedProperty.neighborhood}
                </span>
                <h4 className="font-bold text-slate-900 text-sm leading-snug mt-0.5">
                  {selectedProperty.title}
                </h4>
                <div className="text-lg font-black text-emerald-700 mt-1">
                  R$ {selectedProperty.price.toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Score IA:</span>
                  <strong className="text-emerald-700">{selectedProperty.aiAnalysis.score}/100</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Anunciante:</span>
                  <span className="font-medium text-slate-800">{selectedProperty.advertiser.name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Fonte:</span>
                  <span className="font-medium">{selectedProperty.primarySource}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 line-clamp-3 italic">
                "{selectedProperty.description}"
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => onOpenContactModal(selectedProperty)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                >
                  Contatar Proprietário
                </button>
                <button
                  onClick={() => onOpenDetailModal(selectedProperty)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition"
                >
                  Ver Ficha Completa
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <MapPin className="w-10 h-10 text-slate-300 mb-2 stroke-[1.5]" />
              <h5 className="font-bold text-slate-700 text-xs">Selecione um imóvel no mapa</h5>
              <p className="text-[11px] text-slate-400 mt-1">
                Clique em qualquer marcador para inspecionar os detalhes, dados do proprietário e opções de captação.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
