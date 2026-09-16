import React, { useState } from 'react';
import { Check, Copy, Facebook, MessageCircle, Share2, X } from 'lucide-react';
import { toast } from 'react-toastify';

const TourShareModal = ({ tour, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!tour) return null;

  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const shareOrigin = isLocalhost ? 'https://turazzvelunk.vercel.app' : window.location.origin;
  const shareUrl = `${shareOrigin}/tours/${tour.id}`;
  const shareTitle = tour.title || 'Túrázz Velünk';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('A túra hivatkozása kimásolva.');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Nem sikerült kimásolni a hivatkozást.');
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: shareTitle, url: shareUrl });
      onClose();
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error('Nem sikerült megosztani a túrát.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-[#102019]/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-share-title"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-[#f7f6f1] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-5 px-6 pb-4 pt-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#68796d]">Túrázz Velünk</p>
            <h2 id="tour-share-title" className="mt-1 font-serif text-3xl text-[#173226]">Oszd meg a túrát</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Megosztás bezárása" className="rounded-full p-2 text-[#53665a] hover:bg-[#e8ebe4]">
            <X size={20} />
          </button>
        </div>

        <div className="mx-6 overflow-hidden rounded-xl border border-[#dedfd5] bg-white">
          {tour.image_url && <img src={tour.image_url} alt="" className="h-36 w-full object-cover" />}
          <div className="p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#66806b]">{tour.location}</p>
            <h3 className="mt-1 font-serif text-xl leading-tight text-[#173226]">{shareTitle}</h3>
            <p className="mt-2 truncate text-xs text-[#748278]">{shareUrl}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 px-6 pt-5">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-xl border border-[#dedfd5] bg-white px-2 py-3 text-xs font-semibold text-[#203c2d] hover:border-[#6d9477]"
          >
            <Facebook size={19} /> Facebook
          </a>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle} – ${shareUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-xl border border-[#dedfd5] bg-white px-2 py-3 text-xs font-semibold text-[#203c2d] hover:border-[#6d9477]"
          >
            <MessageCircle size={19} /> WhatsApp
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 rounded-xl border border-[#dedfd5] bg-white px-2 py-3 text-xs font-semibold text-[#203c2d] hover:border-[#6d9477]"
          >
            <X size={19} /> X
          </a>
        </div>

        <div className="flex gap-2 px-6 pb-6 pt-3">
          <button type="button" onClick={copyLink} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#193b2b] px-4 py-3 text-sm font-semibold text-white hover:bg-[#28583d]">
            {copied ? <Check size={17} /> : <Copy size={17} />}
            {copied ? 'Kimásolva' : 'Link másolása'}
          </button>
          {typeof navigator.share === 'function' && (
            <button type="button" onClick={nativeShare} aria-label="Rendszer megosztás" className="rounded-xl border border-[#ccd5ca] px-4 text-[#193b2b] hover:bg-white">
              <Share2 size={18} />
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

export default TourShareModal;
