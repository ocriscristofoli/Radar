import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Database,
  ShieldCheck,
  Lock,
  Clock,
  UserCheck,
  FileCode,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { AuditLog } from '../../server/db.ts';

interface ReportsViewProps {
  auditLogs: any[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ auditLogs }) => {
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingSql, setDownloadingSql] = useState(false);

  const handleDownloadCsv = () => {
    window.location.href = '/api/reports/export-csv';
  };

  const handleDownloadSql = () => {
    window.open('/api/database/schema.sql', '_blank');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Relatórios Executivos, Exportações & Conformidade LGPD
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Exportação de dados comerciais, trilha de auditoria e governança de privacidade
            </p>
          </div>
        </div>

        {/* Quick Export Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV / Excel</span>
          </button>
          <button
            onClick={handleDownloadSql}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <FileCode className="w-4 h-4" />
            <span>Ver DDL PostgreSQL (Supabase)</span>
          </button>
        </div>
      </div>

      {/* LGPD & Database Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LGPD Governance Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Conformidade LGPD (Lei nº 13.709/2018)
            </h3>
          </div>
          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              <strong>Base Legal & Finalidade:</strong> Legítimo interesse comercial e procedimentos preliminares relacionados a contrato de intermediação imobiliária (Art. 7º, incisos V e IX).
            </p>
            <p>
              <strong>Direitos do Titular (Opt-out):</strong> A plataforma registra expressamente qualquer manifestação de "Não perturbe", garantindo a imediata exclusão e o bloqueio de contatos futuros.
            </p>
            <p>
              <strong>Origem dos Dados:</strong> Preservação estrita dos links e datas de descoberta em fontes públicas e feeds autorizados de classificados.
            </p>
          </div>
        </div>

        {/* Supabase / PostgreSQL Architecture */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Arquitetura Relacional & Supabase
            </h3>
          </div>
          <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
            <p>
              <strong>15 Tabelas Mapeadas:</strong> <code className="text-slate-800 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">users</code>, <code className="text-slate-800 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">properties</code>, <code className="text-slate-800 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">property_sources</code>, <code className="text-slate-800 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">listings</code>, <code className="text-slate-800 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">advertisers</code>, <code className="text-slate-800 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">ai_analyses</code>, <code className="text-slate-800 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">contact_history</code>, <code className="text-slate-800 font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">audit_logs</code> e correlatas.
            </p>
            <p>
              <strong>Row Level Security (RLS):</strong> Políticas ativas para isolamento de dados confidenciais de corretores e controle de permissões por perfil (Admin, Gestor, Corretor).
            </p>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Trilha de Auditoria & Segurança Operacional
            </h3>
            <p className="text-xs text-slate-500">
              Log imutável de acessos, alterações de estágio, abordagens de corretores e reanálises
            </p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
          {auditLogs.length === 0 ? (
            <div className="p-4 text-center text-slate-400">Nenhum registro de auditoria.</div>
          ) : (
            auditLogs.map((log: any) => (
              <div key={log.id} className="p-3 bg-slate-50/40 flex items-center justify-between hover:bg-slate-100/50">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                      {log.entityType}
                    </span>
                    <span className="text-slate-500">por {log.userName}</span>
                  </div>
                  <div className="text-[11px] text-slate-600">{log.details}</div>
                </div>
                <div className="text-[11px] text-slate-400 whitespace-nowrap pl-4">
                  {new Date(log.timestamp).toLocaleString('pt-BR')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
