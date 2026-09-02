import React, { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, BookOpen, Calendar, Check, Clock3,
  Edit3, Images, Share2, User
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

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
  const [copied, setCopied] = useState(false);
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

  const handleShare = async () => {
    const shareData = { title: post.title, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error('Nem sikerült megosztani a cikket.');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f4f7f5]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>;
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col gap-5 items-center justify-center bg-[#f4f7f5]">
        <BookOpen size={38} className="text-slate-300" />
        <p className="font-black text-slate-500">A bejegyzés nem található.</p>
        <Link to="/blog" className="text-sm font-black text-emerald-600">Vissza a bloghoz</Link>
      </div>
    );
  }

  const images = Array.isArray(post.images) ? post.images : [];
  const coverImage = images[0];
  const galleryImages = images.slice(1);

  return (
    <div className="min-h-screen bg-[#f4f7f5] pb-24">
      <div className="fixed left-0 top-0 z-[150] h-1 bg-emerald-400 transition-[width] duration-150" style={{ width: `${readProgress}%` }} />

      <header className="relative min-h-[38rem] overflow-hidden bg-[#062f27] px-6 text-white">
        {coverImage && <img src={`${assetBase}${coverImage}`} alt={post.title} className="absolute inset-0 h-full w-full object-cover opacity-55" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#05251f] via-[#05251f]/65 to-[#05251f]/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(52,211,153,0.28),transparent_35%)]" />
        <div className="relative mx-auto flex min-h-[38rem] max-w-5xl flex-col justify-between py-12 md:py-20">
          <div className="flex items-center justify-between gap-4">
            <Link to="/blog" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-100 backdrop-blur transition hover:bg-white/20">
              <ArrowLeft size={14} /> Vissza
            </Link>
            {user?.role === 'admin' && (
              <Link to={`/blog?edit=${post.id}`} className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-950 transition hover:bg-white">
                <Edit3 size={14} /> Szerkesztés
              </Link>
            )}
          </div>

          <div className="max-w-4xl">
            <span className="inline-flex rounded-full bg-emerald-400 px-4 py-2 text-[9px] font-black uppercase tracking-[0.22em] text-emerald-950">Élménybeszámoló</span>
            <h1 className="mt-6 text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-7xl">{post.title}</h1>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-bold text-emerald-50/70">
              <span className="flex items-center gap-1.5"><User size={15} /> {post.author_name}</span>
              <span className="flex items-center gap-1.5"><Calendar size={15} /> {formatDate(post.created_at)}</span>
              <span className="flex items-center gap-1.5"><Clock3 size={15} /> {post.reading_minutes || 1} perc olvasás</span>
              {images.length > 0 && <span className="flex items-center gap-1.5"><Images size={15} /> {images.length} kép</span>}
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto -mt-10 max-w-6xl px-6">
        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <article className="rounded-[2.5rem] border border-white bg-white p-7 shadow-xl shadow-emerald-950/5 md:p-12">
            <div
              className="blog-rich-content text-lg leading-[1.9] text-slate-700 [&_p]:mb-6 [&_p:first-child]:first-letter:float-left [&_p:first-child]:first-letter:mr-3 [&_p:first-child]:first-letter:mt-2 [&_p:first-child]:first-letter:text-6xl [&_p:first-child]:first-letter:font-black [&_p:first-child]:first-letter:leading-[0.8] [&_p:first-child]:first-letter:text-emerald-600 [&_h2]:mb-5 [&_h2]:mt-10 [&_h2]:text-4xl [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:text-emerald-950 [&_h3]:mb-4 [&_h3]:mt-8 [&_h3]:text-3xl [&_h3]:font-black [&_h3]:text-emerald-950 [&_h4]:mb-3 [&_h4]:mt-7 [&_h4]:text-2xl [&_h4]:font-black [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-8 [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-8 [&_li]:mb-2 [&_blockquote]:my-8 [&_blockquote]:rounded-r-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-400 [&_blockquote]:bg-emerald-50 [&_blockquote]:px-6 [&_blockquote]:py-5 [&_blockquote]:text-xl [&_blockquote]:italic [&_blockquote]:text-emerald-950 [&_a]:font-bold [&_a]:text-emerald-600 [&_a]:underline [&_a]:underline-offset-4 [&_pre]:my-7 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-slate-900 [&_pre]:p-6 [&_pre]:text-sm [&_pre]:text-slate-100 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_hr]:my-10 [&_hr]:border-slate-200"
              dangerouslySetInnerHTML={{ __html: normalizeDisplayContent(post.content, assetBase) }}
            />

            {galleryImages.length > 0 && (
              <section className="mt-12 border-t border-slate-100 pt-10">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-black text-emerald-950">Képek a túráról</h2>
                  <span className="text-xs font-bold text-slate-400">{galleryImages.length} fotó</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {galleryImages.map((url, index) => (
                    <a key={url} href={`${assetBase}${url}`} target="_blank" rel="noreferrer" className={`group overflow-hidden rounded-2xl ${index % 3 === 0 ? 'sm:row-span-2' : ''}`}>
                      <img
                        src={`${assetBase}${url}`}
                        alt={`${post.title} – ${index + 2}. kép`}
                        className={`w-full object-cover transition duration-700 group-hover:scale-105 ${index % 3 === 0 ? 'h-full min-h-72' : 'h-64'}`}
                      />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-[2rem] bg-[#073d32] p-6 text-white shadow-lg">
              <div className="text-[9px] font-black uppercase tracking-[0.22em] text-emerald-300">A szerző</div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-lg font-black text-emerald-950">{post.author_name?.charAt(0)}</div>
                <div>
                  <div className="font-black">{post.author_name}</div>
                  <div className="text-xs text-emerald-100/55">Túrázz Velünk</div>
                </div>
              </div>
            </div>
            <button onClick={handleShare} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600">
              {copied ? <Check size={17} /> : <Share2 size={17} />} {copied ? 'Link másolva' : 'Megosztás'}
            </button>
            {post.updated_at && new Date(post.updated_at).getTime() > new Date(post.created_at).getTime() + 1000 && (
              <div className="px-3 text-center text-[10px] font-bold text-slate-400">Frissítve: {formatDate(post.updated_at)}</div>
            )}
          </aside>
        </div>

        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <div className="mb-6">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Olvass tovább</div>
              <h2 className="mt-2 text-3xl font-black text-emerald-950">Kapcsolódó történetek</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {relatedPosts.map((item) => (
                <Link key={item.id} to={`/blog/${item.id}`} className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-white transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="h-44 overflow-hidden bg-gradient-to-br from-emerald-700 to-slate-900">
                    {item.cover_image ? (
                      <img src={`${assetBase}${item.cover_image}`} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <BookOpen className="m-auto h-full text-white/25" size={42} />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="text-[9px] font-black uppercase tracking-widest text-emerald-600">{item.reading_minutes || 1} perc olvasás</div>
                    <h3 className="mt-2 line-clamp-2 text-xl font-black leading-tight text-emerald-950 group-hover:text-emerald-600">{item.title}</h3>
                    <span className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Elolvasom <ArrowRight size={14} /></span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default BlogDetailsScreen;
