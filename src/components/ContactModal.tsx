import React, { useState } from 'react';
import {
  X,
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  Phone,
  Send,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Property, User, PipelineStage } from '../types/index.ts';

interface ContactModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onContactLogged: (logData: any) => Promise<void>;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  property,
  isOpen,
  onClose,
  currentUser,
  onContactLogged,
}) => {
  if (!isOpen || !property) return null;

  const [channel, setChannel] = useState<'WhatsApp' | 'Telefone' | 'E-mail' | 'Presencial'>('WhatsApp');
  const [message, setMessage] = useState(
    property.aiAnalysis.suggestedMessage ||
      `Olá ${property.advertiser.name || 'tudo bem'}? Me chamo ${currentUser.name}, sou consultor imobiliário na Connect Imóveis aqui no litoral de SC. Vi seu anúncio referente ao imóvel em ${property.neighborhood}, ${property.city}. Temos compradores qualificados na nossa carteira interessados exatamente nessa região. Gostaria de saber se você ainda é o proprietário e se poderíamos apresentar aos nossos clientes?`
  );
  const [responseStatus, setResponseStatus] = useState<
    'Aguardando' | 'Respondido' | 'Sem interesse' | 'Não perturbe' | 'Agendou visita'
  >('Aguardando');
  const [notes, setNotes] = useState('');
  const [optOutRequested, setOptOutRequested] = useState(false);
  const [advanceStage, setAdvanceStage] = useState<PipelineStage>('Primeiro contato');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clean phone number for WhatsApp link
  const rawPhone = property.advertiser.phone || '';
  const digitsOnly = rawPhone.replace(/\D/g, '');
  const waPhone = digitsOnly.length >= 10 ? `55${digitsOnly}` : '';
  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
    : '';

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveContact = async () => {
    setIsSubmitting(true);
    try {
      await onContactLogged({
        userId: currentUser.id,
        userName: currentUser.name,
        channel,
        messageContent: message,
        responseStatus,
        notes,
        optOutRequested,
        advanceToStage: optOutRequested ? 'Descartado' : advanceStage,
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar histórico de contato.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white">
                Preparação de Comunicação com o Proprietário
              </h3>
              <p className="text-[11px] text-slate-400">
                Mensagem personalizada por IA com conformidade LGPD e registro no CRM
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Target Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Destinatário:</span>
              <div className="font-bold text-slate-900 text-xs">{property.advertiser.name}</div>
              <div className="text-[11px] text-slate-500">
                {rawPhone ? `Telefone: ${rawPhone}` : 'Telefone não divulgado no anúncio original'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Imóvel:</span>
              <div className="font-bold text-slate-900 text-xs">
                {property.city} - {property.neighborhood}
              </div>
              <div className="text-emerald-700 font-bold text-[11px]">
                R$ {property.price.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>

          {/* Channel selector */}
          <div className="grid grid-cols-4 gap-2">
            {(['WhatsApp', 'Telefone', 'E-mail', 'Presencial'] as const).map(ch => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannel(ch)}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  channel === ch
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {ch}
              </button>
            ))}
          </div>

          {/* AI Suggested Message Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mensagem Personalizada & Humanizada (Revisão Obrigatória do Corretor)</span>
              </label>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
            <textarea
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed font-sans"
            />
            <p className="text-[10px] text-slate-500">
              * Conforme as diretrizes da Connect Imóveis e da LGPD, nenhuma mensagem é enviada automaticamente sem a expressa autorização e revisão do corretor.
            </p>
          </div>

          {/* Direct WhatsApp launcher button */}
          {waUrl && channel === 'WhatsApp' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-900 font-semibold text-xs">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Pronto para envio direto via WhatsApp Web / App</span>
              </div>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 transition"
              >
                <span>Abrir WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* CRM Log Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status do Retorno</label>
              <select
                value={responseStatus}
                onChange={e => setResponseStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
              >
                <option value="Aguardando">Aguardando resposta do proprietário</option>
                <option value="Respondido">Respondido com interesse</option>
                <option value="Agendou visita">Agendou visita / autorização</option>
                <option value="Sem interesse">Sem interesse no momento</option>
                <option value="Não perturbe">Não perturbe (Solicitou Não Contato)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Atualizar Estágio no Funil</label>
              <select
                value={advanceStage}
                onChange={e => setAdvanceStage(e.target.value as PipelineStage)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium"
              >
                <option value="Primeiro contato">Primeiro contato</option>
                <option value="Aguardando resposta">Aguardando resposta</option>
                <option value="Interessado em parceria">Interessado em parceria</option>
                <option value="Em negociação">Em negociação</option>
                <option value="Autorização de venda">Autorização de venda</option>
                <option value="Descartado">Descartar oportunidade</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notas do Atendimento</label>
            <input
              type="text"
              placeholder="Ex: Proprietário pediu para retornar na sexta-feira após as 18h..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
            />
          </div>

          {/* LGPD Opt-out Checkbox */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-2.5">
            <input
              type="checkbox"
              id="optOut"
              checked={optOutRequested}
              onChange={e => {
                setOptOutRequested(e.target.checked);
                if (e.target.checked) setResponseStatus('Não perturbe');
              }}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="optOut" className="text-[11px] text-slate-700 leading-tight">
              <strong>Solicitação de Não Contato (Opt-out LGPD):</strong> O titular solicitou a remoção do número ou manifestou oposição expressa a contatos comerciais. Se marcado, o sistema bloqueará futuros contatos para este número.
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Operador: {currentUser.name} ({currentUser.creci || 'Connect Imóveis'})</span>
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
              onClick={handleSaveContact}
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <span>Gravando...</span> : <span>Salvar Registro no CRM</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
