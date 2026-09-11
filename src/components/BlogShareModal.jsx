import React, { useState } from 'react';
import {
  Check, Copy, Facebook, Mail, MessageCircle,
  Share2, Twitter, X
} from 'lucide-react';
import { toast } from 'react-toastify';

export const BlogShareModal = ({ isOpen, onClose, post }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !post) return null;

  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const origin = isLocalhost ? 'https://turazzvelunk.vercel.app' : window.location.origin;
  const shareUrl = `${origin}/blog/${post.id}`;
  const shareTitle = post.title || 'Túrázz Velünk Blog';
  const assetBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Hivatkozás a vágólapra másolva!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Nem sikerült kimásolni a hivatkozást.');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl,
        });
        onClose();
      } catch (err) {
        if (err?.name !== 'AbortError') {
          console.warn('[Native Share Error]', err);
        }
      }
    }
  };

  const openPopup = (url) => {
    window.open(url, '_blank', 'width=620,height=580,menubar=no,toolbar=no,resizable=yes');
  };

  const shareOptions = [
    {
      name: 'Facebook',
      icon: Facebook,
      bg: 'bg-[#1877F2]',
      hover: 'hover:bg-[#166fe5]',
      action: () => openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`),
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      bg: 'bg-[#25D366]',
      hover: 'hover:bg-[#20bd5a]',
      action: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle} - ${shareUrl}`)}`, '_blank', 'noopener,noreferrer'),
    },
    {
      name: 'Viber',
      icon: MessageCircle,
      bg: 'bg-[#7360F2]',
      hover: 'hover:bg-[#6351df]',
      action: () => {
        window.location.href = `viber://forward?text=${encodeURIComponent(`${shareTitle} - ${shareUrl}`)}`;
      },
    },
    {
      name: 'X (Twitter)',
      icon: Twitter,
      bg: 'bg-slate-900',
      hover: 'hover:bg-black',
      action: () => openPopup(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`),
    },
    {
      name: 'E-mail',
      icon: Mail,
      bg: 'bg-emerald-600',
      hover: 'hover:bg-emerald-700',
      action: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`Szia!\n\nNézd meg ezt a bejegyzést a Túrázz Velünk oldalon:\n\n${shareTitle}\n${shareUrl}`)}`;
      },
    },
  ];

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fejléc */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
              Túrázz Velünk
            </span>
            <h3 className="mt-1 text-xl font-black text-slate-900">
              Bejegyzés megosztása
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            aria-label="Bezárás"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cikk előnézet */}
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-100">
          {post.cover_image ? (
            <img
              src={`${assetBase}${post.cover_image}`}
              alt={post.title}
              className="h-12 w-12 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 font-black">
              {post.title?.charAt(0) || 'T'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-black text-slate-900">
              {post.title}
            </h4>
            <p className="truncate text-xs text-slate-500">
              {shareUrl}
            </p>
          </div>
        </div>

        {/* Megosztó ikonok */}
        <div className="mt-6">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
            Megosztás közvetlenül
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {shareOptions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={item.action}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 p-3.5 transition hover:-translate-y-0.5 hover:shadow-md hover:border-slate-200 bg-white"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm transition ${item.bg} ${item.hover}`}>
                    <Icon size={18} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Link másolása */}
        <div className="mt-6">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
            Hivatkozás másolása
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-1.5 focus-within:border-emerald-500 focus-within:bg-white transition">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent px-3 text-xs text-slate-700 focus:outline-none truncate font-medium"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black transition ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Másolva!' : 'Másolás'}</span>
            </button>
          </div>
        </div>

        {/* Rendszer megosztó */}
        {/* {hasNativeShare && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition"
            >
              <Share2 size={15} />
              <span>Megnyitás a rendszer megosztóval</span>
            </button>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default BlogShareModal;
