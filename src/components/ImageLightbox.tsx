import React from 'react';
import { X, ExternalLink, Copy, Check } from 'lucide-react';

interface ImageLightboxProps {
  url: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ url, title, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!url) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50/80">
          <div className="min-w-0 pr-4">
            <h3 className="text-sm font-bold text-[#161616] truncate">{title || 'Podgląd zdjęcia'}</h3>
            <p className="text-xs font-mono text-gray-500 truncate mt-0.5 max-w-xl">{url}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 shadow-2xs"
              title="Kopiuj link do schowka"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
              <span>{copied ? 'Skopiowano' : 'Kopiuj link'}</span>
            </button>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#F36F21] hover:bg-[#df5d12] rounded-lg transition-colors shadow-2xs"
              title="Otwórz w nowej karcie"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Otwórz</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors ml-1"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image viewport */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100/70 min-h-[300px]">
          <img
            src={url}
            alt={title || 'Powiększone zdjęcie'}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[75vh] object-contain rounded-lg border border-gray-200 shadow-md bg-white"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="%23f1f5f9" width="400" height="300"/><text fill="%2364748b" font-family="sans-serif" font-size="14" dy="10.5" font-weight="bold" x="50%" y="50%" text-anchor="middle">Nie można załadować obrazu</text></svg>';
            }}
          />
        </div>
      </div>
    </div>
  );
};
