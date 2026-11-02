import React, { useState } from 'react';
import { getViewModelTriggerSql } from '../lib/supabaseClient';
import { X, Copy, Check, Terminal, Database, Sparkles, CheckCircle2 } from 'lucide-react';

interface ViewModelTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const ViewModelTriggerModal: React.FC<ViewModelTriggerModalProps> = ({
  isOpen,
  onClose,
  onToast
}) => {
  const [copied, setCopied] = useState(false);
  const sql = getViewModelTriggerSql();

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    onToast('success', 'Skopiowano skrypt SQL', 'Wklej i uruchom w Supabase SQL Editor.');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-50/70 via-white to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-[#F36F21]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#161616] font-ubuntu flex items-center gap-2">
                <span>Synchronizacja Widoku v_model</span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider bg-orange-100 text-[#F36F21] rounded-md">
                  INSTEAD OF Triggery
                </span>
              </h2>
              <p className="text-xs text-gray-500 font-poppins mt-0.5">
                Pracuj wyłącznie na widoku <code className="font-mono text-[#F36F21] bg-orange-50 px-1 py-0.5 rounded">v_model</code> – baza automatycznie uzupełnia tabele <code className="font-mono text-gray-700 bg-gray-100 px-1 py-0.5 rounded">Model_*</code>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info card */}
        <div className="p-4 bg-orange-50/50 border-b border-orange-100 flex items-start gap-3 text-xs text-gray-700">
          <CheckCircle2 className="w-4 h-4 text-[#F36F21] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">
              Aplikacja posiada wbudowaną dwustronną synchronizację w czasie rzeczywistym!
            </p>
            <p className="text-gray-600 leading-relaxed">
              Wszelkie edycje, dodawanie i usuwanie maszyn w widoku <span className="font-mono font-medium text-gray-900">v_model</span> automatycznie rozdzielają dane do powiązanych tabel (<span className="font-mono text-gray-800">Model_Podstawowy</span>, <span className="font-mono text-gray-800">Model_Specyfikacja</span>, <span className="font-mono text-gray-800">Model_Ceny</span>, <span className="font-mono text-gray-800">Model_Multimedia</span>).
              Poniższy skrypt PostgreSQL tworzy triggery bezpośrednio w Twojej bazie Supabase dla 100% natywnej wydajności.
            </p>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#161616] text-gray-200 font-mono text-[11px] leading-relaxed relative">
          <pre className="overflow-x-auto whitespace-pre selection:bg-[#F36F21]/30">
            <code>{sql}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
            <Terminal className="w-4 h-4 text-gray-400" />
            <span>Supabase Dashboard &gt; SQL Editor &gt; New query &gt; Run</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Zamknij
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#F36F21] hover:bg-[#df5d12] rounded-lg transition-all shadow-xs"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Skopiowano SQL!' : 'Kopiuj gotowy skrypt SQL'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
