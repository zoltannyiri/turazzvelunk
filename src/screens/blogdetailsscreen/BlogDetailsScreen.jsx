import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BookOpen, Calendar, Clock3,
  Edit3, Images, Share2, User
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import BlogShareModal from '../../components/BlogShareModal';

const normalizeDisplayContent = (content, assetBase) => {
  const value = String(content || '');
  const html = /<[a-z][\s\S]*>/i.test(value)
    ? value
    : value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');

  const documentNode = new DOMParser().parseFromString(html, 'text/html');
  documentNode.querySelectorAll('img[src^="/uploads/"]').forEach((image) => {
    image.setAttribute('src', `${assetBase}${image.getAttribute('src')}`);
  });
  return documentNode.body.innerHTML;
};

const BlogDetailsScreen = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readProgress, setReadProgress] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const assetBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      try {
        const [postRes, listRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/blog/${id}`),
          fetch(`${import.meta.env.VITE_API_URL}/blog`)
        ]);
        const postData = await postRes.json();
        const listData = await listRes.json();
        if (!postRes.ok) throw new Error(postData.message || postData.error);
        setPost(postData);
        setRelatedPosts(
          (Array.isArray(listData) ? listData : [])
            .filter((item) => String(item.id) !== String(id))
            .slice(0, 3)
        );
      } catch (error) {
        toast.error(error.message || 'Hiba a bejegyzés betöltésekor.');
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  useEffect(() => {
    const updateProgress = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(scrollable > 0 ? Math.min(100, (window.scrollY / scrollable) * 100) : 0);
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [post]);

  const formatDate = (value) => new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date(value));

  const handleShare = async (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (e?.preventDefault) e.preventDefault();

    const isMobile = typeof window !== 'undefined' && 
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window.matchMedia && window.matchMedia('(max-width: 768px)').matches && 'ontouchstart' in window));

    if (isMobile && typeof navigator !== 'undefined' && navigator.share) {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const shareUrl = isLocalhost 
        ? `https://turazzvelunk.vercel.app/blog/${id}` 
        : window.location.href;
      try {
        await navigator.share({
          title: post?.title || document.title || 'Túrázz Velünk',
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }

    setShareModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faf7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-[#d8dfd4] border-t-[#275940] rounded-full animate-spin" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[#718174]">Történet betöltése...</span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col gap-5 items-center justify-center bg-[#f8faf7] px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-[#ecefe6] border border-[#cad6c9] flex items-center justify-center text-[#477258] mx-auto">
          <BookOpen size={24} strokeWidth={1.8} />
        </div>
        <h2 className="font-serif text-2xl text-[#173327]">A bejegyzés nem található</h2>
        <p className="text-sm text-[#65756a] max-w-sm">Lehet, hogy a bejegyzést törölték vagy megváltozott a hivatkozása.</p>
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#275940] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1d4330] transition shadow-xs"
        >
          <ArrowLeft size={16} /> Vissza a bloghoz
        </Link>
      </div>
    );
  }

  const images = Array.isArray(post.images) ? post.images : [];
  const coverImage = images[0];
  const galleryImages = images.slice(1);

  return (
    <div className="min-h-screen bg-[#f8faf7] pb-24 font-sans text-[#173327]">
      {/* OLVASÁSI HALADÁSJELZŐ */}
      <div 
        className="fixed left-0 top-0 z-[150] h-1 bg-[#275940] transition-[width] duration-150" 
        style={{ width: `${readProgress}%` }} 
      />

      {/* --- CIKK FEJLÉC HÁTTÉRKÉPPEL ÉS TERMÉSZETES ZÖLD TÓNUSSAL --- */}
      <header className="relative min-h-[36rem] overflow-hidden bg-[#0f1f17] px-6 text-white flex items-center">
        {coverImage && (
          <img 
            src={`${assetBase}${coverImage}`} 
            alt={post.title} 
            className="absolute inset-0 h-full w-full object-cover opacity-50 filter brightness-95" 
          />
        )}
        
        {/* SÖTÉTÍTŐ TERMÉSZETES ZÖLD OVERLAY */}
        <div className="absolute inset-0 bg-[#0f1f17]/75 backdrop-blur-[1px]" />
        
        {/* LÁGY MÉLYZÖLD FÉNYEFFEKT */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#477258]/15 rounded-full blur-[140px] -mr-32 -mt-32 pointer-events-none z-10" />

        <div className="relative mx-auto flex min-h-[36rem] max-w-5xl flex-col justify-between py-12 md:py-20 z-20 w-full">
          
          {/* FELSŐ NAVIGÁCIÓ */}
          <div className="flex items-center justify-between gap-4">
            <Link 
              to="/blog" 
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur transition hover:bg-white/20"
            >
              <ArrowLeft size={14} /> Vissza a bloghoz
            </Link>
            
            {user?.role === 'admin' && (
              <Link 
                to={`/blog?edit=${post.id}`} 
                className="inline-flex items-center gap-2 rounded-full bg-[#275940] border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur transition hover:bg-[#1d4330]"
              >
                <Edit3 size={14} /> Szerkesztés
              </Link>
            )}
          </div>

          {/* FŐCÍM ÉS METAADATOK */}
          <div className="max-w-4xl mt-8">
            <span className="inline-flex rounded-full bg-[#275940] border border-white/15 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#dce5d8] shadow-sm">
              Élménybeszámoló
            </span>
            
            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-normal leading-[1.1] tracking-tight text-white mt-5 mb-6 drop-shadow-md">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#dce5d8]">
              <span className="flex items-center gap-1.5">
                <User size={15} className="text-[#a8c9b2]" /> {post.author_name}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar size={15} className="text-[#a8c9b2]" /> {formatDate(post.created_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock3 size={15} className="text-[#a8c9b2]" /> {post.reading_minutes || 1} perc olvasás
              </span>
              {images.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Images size={15} className="text-[#a8c9b2]" /> {images.length} kép
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* --- CIKK TARTALOM ÉS OLDALSÁV --- */}
      <main className="relative mx-auto -mt-10 max-w-6xl px-4 sm:px-6 z-30">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          
          {/* CIKK SZÖVEGES TÖRZS */}
          <article className="rounded-3xl border border-[#dce5d8] bg-white p-6 sm:p-10 md:p-14 shadow-xl shadow-[#173327]/5">
            <div
              className="blog-rich-content text-base sm:text-lg leading-[1.85] text-[#34493b] font-light [&_p]:mb-6 [&_p:first-child]:first-letter:float-left [&_p:first-child]:first-letter:mr-3 [&_p:first-child]:first-letter:mt-1 [&_p:first-child]:first-letter:text-6xl [&_p:first-child]:first-letter:font-serif [&_p:first-child]:first-letter:font-normal [&_p:first-child]:first-letter:leading-[0.85] [&_p:first-child]:first-letter:text-[#275940] [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:sm:text-4xl [&_h2]:text-[#173327] [&_h2]:font-normal [&_h2]:mb-5 [&_h2]:mt-10 [&_h3]:font-serif [&_h3]:text-2xl [&_h3]:sm:text-3xl [&_h3]:text-[#173327] [&_h3]:font-normal [&_h3]:mb-4 [&_h3]:mt-8 [&_h4]:font-serif [&_h4]:text-xl [&_h4]:sm:text-2xl [&_h4]:text-[#173327] [&_h4]:font-normal [&_h4]:mb-3 [&_h4]:mt-6 [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5 [&_li]:text-[#34493b] [&_blockquote]:my-8 [&_blockquote]:rounded-r-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-[#275940] [&_blockquote]:bg-[#f7f9f5] [&_blockquote]:px-6 [&_blockquote]:py-5 [&_blockquote]:text-lg [&_blockquote]:sm:text-xl [&_blockquote]:italic [&_blockquote]:font-serif [&_blockquote]:text-[#173327] [&_a]:font-semibold [&_a]:text-[#275940] [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-[#173327] [&_pre]:my-7 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-[#173327] [&_pre]:p-6 [&_pre]:text-sm [&_pre]:text-[#dce5d8] [&_code]:rounded [&_code]:bg-[#f7f9f5] [&_code]:border [&_code]:border-[#dce5d8] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[#173327] [&_hr]:my-10 [&_hr]:border-[#ecefe6]"
              dangerouslySetInnerHTML={{ __html: normalizeDisplayContent(post.content, assetBase) }}
            />

            {/* KÉPGALÉRIA A CIKK ALJÁN */}
            {galleryImages.length > 0 && (
              <section className="mt-14 border-t border-[#ecefe6] pt-10">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#173327]">Képek a túráról</h2>
                  <span className="text-xs font-semibold text-[#718174] bg-[#f7f9f5] border border-[#dce5d8] px-3 py-1 rounded-full">
                    {galleryImages.length} fotó
                  </span>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  {galleryImages.map((url, index) => (
                    <a 
                      key={url} 
                      href={`${assetBase}${url}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className={`group overflow-hidden rounded-2xl border border-[#dce5d8] ${index % 3 === 0 ? 'sm:row-span-2' : ''}`}
                    >
                      <img
                        src={`${assetBase}${url}`}
                        alt={`${post.title} – ${index + 2}. kép`}
                        className={`w-full object-cover transition duration-700 group-hover:scale-105 ease-out ${index % 3 === 0 ? 'h-full min-h-72' : 'h-64'}`}
                      />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* OLDALSÁV: SZERZŐ ÉS MEGOSZTÁS */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            {/* SZERZŐ KÁRTYA */}
            <div className="rounded-3xl bg-[#173327] p-6 text-white border border-[#275940] shadow-sm">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a8c9b2] mb-3 block">
                A szerző
              </span>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#275940] border border-white/10 text-lg font-serif font-bold text-white">
                  {post.author_name?.charAt(0) || 'T'}
                </div>
                <div>
                  <div className="font-serif text-lg text-white font-normal">{post.author_name}</div>
                  <div className="text-xs text-[#a8c9b2]">Túrázz Velünk</div>
                </div>
              </div>
            </div>

            {/* MEGOSZTÁS GOMB */}
            <button 
              onClick={handleShare} 
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#dce5d8] bg-white px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#275940] hover:bg-[#275940] hover:text-white hover:border-[#275940] transition shadow-xs cursor-pointer"
            >
              <Share2 size={16} /> Bejegyzés megosztása
            </button>
            
            {post.updated_at && new Date(post.updated_at).getTime() > new Date(post.created_at).getTime() + 1000 && (
              <div className="px-3 text-center text-xs text-[#718174]">
                Frissítve: {formatDate(post.updated_at)}
              </div>
            )}
          </aside>
        </div>

        {/* --- KAPCSOLÓDÓ TÖRTÉNETEK --- */}
        {relatedPosts.length > 0 && (
          <section className="mt-20">
            <div className="border-b border-[#d8dfd4] pb-4 mb-8">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#648067]">Olvass tovább</span>
              <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#173327]">Kapcsolódó történetek</h2>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              {relatedPosts.map((item) => (
                <Link 
                  key={item.id} 
                  to={`/blog/${item.id}`} 
                  className="group bg-white rounded-3xl border border-[#dce5d8] hover:border-[#b4c7b0] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer"
                >
                  <div className="h-48 overflow-hidden bg-[#ecefe6] relative">
                    {item.cover_image ? (
                      <img 
                        src={`${assetBase}${item.cover_image}`} 
                        alt={item.title} 
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105 ease-out" 
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[#648067]">
                        <BookOpen size={40} strokeWidth={1.5} />
                      </div>
                    )}
                    <div className="absolute bottom-3 left-4">
                      <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#275940] shadow-xs">
                        {item.reading_minutes || 1} perc olvasás
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-normal leading-snug text-[#173327] group-hover:text-[#275940] transition-colors line-clamp-2 mb-2">
                        {item.title}
                      </h3>
                      {item.excerpt && (
                        <p className="line-clamp-2 text-xs text-[#55695b] font-light leading-relaxed mb-4">
                          {item.excerpt}
                        </p>
                      )}
                    </div>
                    
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#275940] group-hover:gap-2 transition-all mt-auto pt-2">
                      Elolvasom <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <BlogShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        post={post}
      />
    </div>
  );
};

export default BlogDetailsScreen;
