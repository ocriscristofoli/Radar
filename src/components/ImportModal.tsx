import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Link,
  FileText,
  AlertTriangle,
  CheckCircle,
  Building,
  MapPin,
  DollarSign,
  User,
  Phone,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Property, PropertyType, SourcePlatform, User as UserType } from '../types/index.ts';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCities: string[];
  users: UserType[];
  currentUser: UserType;
  onPropertyCreated: (newProp: Property) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  availableCities,
  users,
  currentUser,
  onPropertyCreated,
}) => {
  const [sourcePlatform, setSourcePlatform] = useState<SourcePlatform>('OLX');
  const [originalUrl, setOriginalUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PropertyType>('Apartamento');
  const [price, setPrice] = useState<number | ''>('');
  const [city, setCity] = useState(availableCities[0] || 'Itapema');
  const [neighborhood, setNeighborhood] = useState('Meia Praia');
  const [address, setAddress] = useState('');
  const [areaPrivate, setAreaPrivate] = useState<number | ''>('');
  const [bedrooms, setBedrooms] = useState<number | ''>('');
  const [suites, setSuites] = useState<number | ''>('');
  const [bathrooms, setBathrooms] = useState<number | ''>('');
  const [parkingSpots, setParkingSpots] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [advertiserName, setAdvertiserName] = useState('');
  const [advertiserContact, setAdvertiserContact] = useState('');
  const [assignedUserId, setAssignedUserId] = useState(currentUser.id);

  // Duplicate Warning State
  const [duplicateWarning, setDuplicateWarning] = useState<{
    matchedPropertyId?: string;
    confidenceScore: number;
    reasons: string[];
  } | null>(null);

  if (!isOpen) return null;

  // Auto-extraction using server Gemini AI
  const handleAiAutoExtract = async () => {
    if (!rawText.trim() && !originalUrl.trim()) {
      alert('Por favor, cole o texto do anúncio ou link para extração.');
      return;
    }

    setIsParsing(true);
    try {
      const res = await fetch('/api/ai/parse-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawText || originalUrl,
          sourceUrl: originalUrl,
          sourcePlatform,
        }),
      });

      const data = await res.json();
      if (data.extracted) {
        const text = rawText || '';

        // Extract numbers intelligently if present
        const priceMatch = text.match(/R\$\s*([\d\.,]+)/i) || text.match(/(\d{3}[\d\.]*000)/);
        if (priceMatch) {
          const cleanNum = priceMatch[1].replace(/\./g, '').replace(',', '.');
          if (!isNaN(Number(cleanNum))) setPrice(Number(cleanNum));
        }

        const areaMatch = text.match(/(\d+)\s*(m²|m2|metros)/i);
        if (areaMatch) setAreaPrivate(Number(areaMatch[1]));

        const bedMatch = text.match(/(\d+)\s*(quartos|dormit[óo]rios|dorm)/i);
        if (bedMatch) setBedrooms(Number(bedMatch[1]));

        const suiteMatch = text.match(/(\d+)\s*(su[íi]tes|suite)/i);
        if (suiteMatch) setSuites(Number(suiteMatch[1]));

        const vagaMatch = text.match(/(\d+)\s*(vagas|garagem|garagens)/i);
        if (vagaMatch) setParkingSpots(Number(vagaMatch[1]));

        const phoneMatch = text.match(/(\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4})/);
        if (phoneMatch) setAdvertiserContact(phoneMatch[1]);

        // Attempt city match
        for (const c of availableCities) {
          if (new RegExp(c, 'i').test(text)) {
            setCity(c);
            break;
          }
        }

        // Set description and title
        setDescription(text);
        if (!title) {
          const lines = text.split('\n').filter(l => l.trim().length > 5);
          setTitle(lines[0]?.slice(0, 90) || `Imóvel à venda em ${city}`);
        }

        if (data.extracted.duplicateWarning) {
          setDuplicateWarning(data.extracted.duplicateWarning);
        }
      }
    } catch (err) {
      console.error('Error in AI parse:', err);
    } finally {
      setIsParsing(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (forceMerge = false) => {
    if (!title || !city || !price) {
      alert('Preencha título, cidade e valor anunciado.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          price: Number(price),
          city,
          neighborhood,
          address,
          areaPrivate: Number(areaPrivate) || 0,
          bedrooms: Number(bedrooms) || 0,
          suites: Number(suites) || 0,
          bathrooms: Number(bathrooms) || 1,
          parkingSpots: Number(parkingSpots) || 0,
          description: description || title,
          primarySource: sourcePlatform,
          originalUrl,
          advertiserName: advertiserName || 'Proprietário Anunciante',
          advertiserContact,
          assignedToUserId: assignedUserId,
          currentUserId: currentUser.id,
          currentUserName: currentUser.name,
          forceMerge,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.duplicateWarning && !forceMerge) {
          setDuplicateWarning(data.duplicateWarning);
          alert('Atenção: Foi detectada uma possível duplicidade deste imóvel no sistema.');
        } else {
          onPropertyCreated(data.property);
          onClose();
        }
      } else {
        alert(data.error || 'Erro ao cadastrar imóvel.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha ao comunicar com o servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white">
                Importação Assistida & Cadastro de Anúncio
              </h3>
              <p className="text-[11px] text-slate-400">
                Integração autorizada com motor de inteligência artificial e checagem antiduplicidade
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Quick AI Extractor Box */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Extrator Instantâneo com Inteligência Artificial</span>
              </span>
              <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                Gemini 3.8 Flash
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Fonte do Anúncio</label>
                <select
                  value={sourcePlatform}
                  onChange={e => setSourcePlatform(e.target.value as SourcePlatform)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <option value="OLX">OLX</option>
                  <option value="Chaves na Mão">Chaves na Mão</option>
                  <option value="Facebook Marketplace">Facebook Marketplace</option>
                  <option value="Grupos Facebook">Grupos Públicos Facebook</option>
                  <option value="ZAP Imóveis">ZAP Imóveis</option>
                  <option value="Viva Real">Viva Real</option>
                  <option value="Manual / Assistido">Manual / Assistido</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Link Original</label>
                <input
                  type="url"
                  placeholder="https://sc.olx.com.br/imoveis/..."
                  value={originalUrl}
                  onChange={e => setOriginalUrl(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                Cole a descrição ou texto completo do anúncio copiado da plataforma:
              </label>
              <textarea
                rows={3}
                placeholder="Exemplo: Vendo meu apartamento na Meia Praia, 3 suítes, frente mar, direto com proprietário..."
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleAiAutoExtract}
              disabled={isParsing}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isParsing ? (
                <span>Interpretando com IA...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preencher Formulário Automaticamente via IA</span>
                </>
              )}
            </button>
          </div>

          {/* Duplicate Warning Alert if detected */}
          {duplicateWarning && duplicateWarning.confidenceScore >= 70 && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Possível Duplicidade Detectada ({duplicateWarning.confidenceScore}% de similaridade)</span>
              </div>
              <p className="text-[11px] text-amber-800">
                O algoritmo antiduplicidade encontrou um imóvel já cadastrado com características compatíveis:
              </p>
              <ul className="list-disc list-inside text-[11px] text-amber-800 pl-1 space-y-0.5">
                {duplicateWarning.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition"
                >
                  Vincular como Nova Fonte do Imóvel Existente
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg transition"
                >
                  Manter como Cadastro Separado
                </button>
              </div>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-1">
              Dados do Imóvel
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Título do Anúncio *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Apartamento 3 suítes Meia Praia Direto com Dono"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipo</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as PropertyType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                >
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa">Casa</option>
                  <option value="Cobertura">Cobertura</option>
                  <option value="Terreno">Terreno</option>
                  <option value="Sala comercial">Sala comercial</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Valor Anunciado (R$) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="1500000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cidade *</label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                >
                  {availableCities.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bairro</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={e => setNeighborhood(e.target.value)}
                  placeholder="Meia Praia / Perequê / Centro"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Área Priv. (m²)</label>
                <input
                  type="number"
                  value={areaPrivate}
                  onChange={e => setAreaPrivate(e.target.value ? Number(e.target.value) : '')}
                  placeholder="140"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Quartos</label>
                <input
                  type="number"
                  value={bedrooms}
                  onChange={e => setBedrooms(e.target.value ? Number(e.target.value) : '')}
                  placeholder="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Suítes</label>
                <input
                  type="number"
                  value={suites}
                  onChange={e => setSuites(e.target.value ? Number(e.target.value) : '')}
                  placeholder="3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Vagas</label>
                <input
                  type="number"
                  value={parkingSpots}
                  onChange={e => setParkingSpots(e.target.value ? Number(e.target.value) : '')}
                  placeholder="2"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-1 pt-2">
              Dados do Anunciante & Corretor Responsável
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nome do Anunciante</label>
                <input
                  type="text"
                  value={advertiserName}
                  onChange={e => setAdvertiserName(e.target.value)}
                  placeholder="Ex: Carlos Ferreira"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={advertiserContact}
                  onChange={e => setAdvertiserContact(e.target.value)}
                  placeholder="(47) 99999-9999"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Atribuir a Corretor</label>
                <select
                  value={assignedUserId}
                  onChange={e => setAssignedUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
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
          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Registro com base legal e finalidade de captação LGPD</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold text-xs hover:bg-white transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <span>Salvando...</span> : <span>Salvar Oportunidade</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
