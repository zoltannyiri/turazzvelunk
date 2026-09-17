import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, BookOpen, Calendar, Camera, Clock3, Edit3, ImagePlus,
  PenSquare, Search, Share2, Trash2, User, X
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import RichTextEditor from '../../components/RichTextEditor';
import BlogShareModal from '../../components/BlogShareModal';

const initialEditor = { title: '', content: '' };

const htmlToText = (html) => {
  const documentNode = new DOMParser().parseFromString(String(html || ''), 'text/html');
  return documentNode.body.textContent?.replace(/\s+/g, ' ').trim() || '';
};

const BlogScreen = () => {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('latest');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editor, setEditor] = useState(initialEditor);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [sharingPost, setSharingPost] = useState(null);
  const assetBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/blog`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Hiba a bejegyzések betöltésekor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const visiblePosts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('hu-HU');
    return [...posts]
      .filter((post) => {
        if (!normalizedQuery) return true;
        return [post.title, post.excerpt, post.author_name]
          .some((value) => String(value || '').toLocaleLowerCase('hu-HU').includes(normalizedQuery));
      })
      .sort((a, b) => {
        const difference = new Date(b.created_at) - new Date(a.created_at);
        return sortOrder === 'latest' ? difference : -difference;
      });
  }, [posts, query, sortOrder]);

  const featuredPost = !query.trim() && sortOrder === 'latest' ? visiblePosts[0] : null;
  const gridPosts = featuredPost ? visiblePosts.slice(1) : visiblePosts;
  const totalImages = posts.reduce((sum, post) => sum + Number(post.image_count || 0), 0);

  const openCreateEditor = () => {
    setEditingPost(null);
    setEditor(initialEditor);
    setExistingImages([]);
    setNewImages([]);
    setEditorOpen(true);
  };

  const openEditEditor = useCallback(async (post) => {
    setEditorLoading(true);
    setEditorOpen(true);
    setEditingPost(post);
    setNewImages([]);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/blog/${post.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setEditor({ title: data.title || '', content: data.content || '' });
      setExistingImages(Array.isArray(data.images) ? data.images : []);
    } catch {
      toast.error('Nem sikerült megnyitni a szerkesztőt.');
      setEditorOpen(false);
    } finally {
      setEditorLoading(false);
    }
  }, []);

  useEffect(() => {
    const editId = Number(searchParams.get('edit'));
    if (!editId || user?.role !== 'admin' || posts.length === 0) return;
    const post = posts.find((item) => Number(item.id) === editId);
    if (!post) return;
    openEditEditor(post);
    setSearchParams({}, { replace: true });
  }, [openEditEditor, posts, searchParams, setSearchParams, user?.role]);

  const resetEditor = () => {
    setEditorOpen(false);
    setEditingPost(null);
    setEditor(initialEditor);
    setExistingImages([]);
    setNewImages([]);
  };

  const closeEditor = () => {
    if (submitting) return;
    resetEditor();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!editor.title.trim() || !htmlToText(editor.content)) {
      toast.error('A cím és a tartalom megadása kötelező.');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', editor.title.trim());
      formData.append('content', editor.content.trim());
      if (editingPost) formData.append('keep_images', JSON.stringify(existingImages));
      newImages.forEach((file) => formData.append('images', file));

      const res = await fetch(
        editingPost
          ? `${import.meta.env.VITE_API_URL}/blog/${editingPost.id}`
          : `${import.meta.env.VITE_API_URL}/blog`,
        {
          method: editingPost ? 'PUT' : 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Hiba történt.');
      toast.success(editingPost ? 'Bejegyzés frissítve.' : 'Bejegyzés közzétéve.');
      resetEditor();
      await fetchPosts();
    } catch (error) {
      toast.error(error.message || 'Hiba történt a mentéskor.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (post) => {
    if (!window.confirm(`Biztosan törlöd ezt a bejegyzést: „${post.title}”?`)) return;
    setDeletingId(post.id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/blog/${post.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      toast.success('Bejegyzés törölve.');
    } catch (error) {
      toast.error(error.message || 'Nem sikerült törölni a bejegyzést.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (value) => new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date(value));

  const handleShare = async (post, e) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (e?.preventDefault) e.preventDefault();
    if (!post) return;

    const isMobile = typeof window !== 'undefined' && 
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window.matchMedia && window.matchMedia('(max-width: 768px)').matches && 'ontouchstart' in window));

    if (isMobile && typeof navigator !== 'undefined' && navigator.share) {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const shareUrl = isLocalhost 
        ? `https://turazzvelunk.vercel.app/blog/${post.id}` 
        : `${window.location.origin}/blog/${post.id}`;
      try {
        await navigator.share({
          title: post.title || 'Túrázz Velünk',
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }

    setSharingPost(post);
  };

  const AdminActions = ({ post, light = false }) => user?.role === 'admin' && (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => openEditEditor(post)}
        className={`p-2 rounded-xl transition cursor-pointer ${
          light 
            ? 'bg-white/15 text-white hover:bg-white/25 border border-white/20' 
            : 'bg-[#f7f9f5] text-[#275940] hover:bg-[#275940] hover:text-white border border-[#dce5d8]'
        }`}
        title="Szerkesztés"
      >
        <Edit3 size={15} />
      </button>
      <button
        type="button"
        disabled={deletingId === post.id}
        onClick={() => handleDelete(post)}
        className={`p-2 rounded-xl transition disabled:opacity-50 cursor-pointer ${
          light 
            ? 'bg-white/15 text-white hover:bg-[#963735] border border-white/20' 
            : 'bg-[#f7f9f5] text-[#963735] hover:bg-[#963735] hover:text-white border border-[#dce5d8]'
        }`}
        title="Törlés"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8faf7] pb-24 font-sans text-[#173327]">
      
      {/* --- BLOG FEJLÉC HÁTTÉRKÉPPEL ÉS TERMÉSZETES ZÖLD TÓNUSSAL --- */}
      <div className="relative pt-20 pb-28 px-6 overflow-hidden min-h-[360px] flex items-center">
        
        {/* HÁTTÉRKÉP RÉTEG */}
        <img 
          src="https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&q=80&w=2070" 
          className="absolute inset-0 w-full h-full object-cover scale-105 filter brightness-95"
          alt="Hegyvidéki háttér"
        />
        
        {/* SÖTÉTÍTŐ TERMÉSZETES ZÖLD OVERLAY */}
        <div className="absolute inset-0 bg-[#0f1f17]/75 backdrop-blur-[1px]"></div>

        {/* LÁGY MÉLYZÖLD FÉNYEFFEKT */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#477258]/15 rounded-full blur-[140px] -mr-32 -mt-32 pointer-events-none z-10"></div>
        
        <div className="max-w-7xl mx-auto relative z-20 w-full grid lg:grid-cols-[1.3fr_0.7fr] gap-10 items-end">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#dce5d8] text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Túrázz Velünk • Természeti Krónikák
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white font-normal tracking-tight mb-4 drop-shadow-md">
              Bakancsnyomok, amik mesélnek
            </h1>
            <p className="text-[#dce5d8] text-sm sm:text-base md:text-lg max-w-2xl font-light leading-relaxed drop-shadow-sm">
              Útvonalak, élmények és hasznos ötletek túrázóktól, túrázóknak a természetjárás szerelmeseinek.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { value: posts.length, label: 'történet', icon: BookOpen },
              { value: totalImages, label: 'fotó', icon: Camera },
              { value: posts.length ? `${posts[0]?.reading_minutes || 1} p` : '–', label: 'legfrissebb', icon: Clock3 }
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 text-center">
                <div className="flex justify-center text-[#a8c9b2]">
                  {React.createElement(Icon, { size: 18, strokeWidth: 1.8 })}
                </div>
                <div className="mt-2 font-serif text-2xl sm:text-3xl text-white font-normal">{value}</div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#dce5d8]/70 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- LEBEGŐ KERESŐ ÉS SZŰRŐ SÁV --- */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 -mt-10 z-30">
        <div className="bg-white rounded-3xl shadow-xl shadow-[#173327]/5 border border-[#d8dfd4] p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-center">
          
          {/* KERESŐ MEZŐ */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#648067]" size={18} strokeWidth={2} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Keresés cím, tartalom vagy szerző alapján..."
              className="w-full pl-11 pr-10 py-3.5 bg-[#f7f9f5] border border-[#dce5d8] rounded-2xl text-sm text-[#173327] placeholder:text-[#879489] focus:outline-none focus:border-[#477258] focus:ring-1 focus:ring-[#477258] transition"
            />
            {query && (
              <button 
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#879489] hover:text-[#173327] p-1 transition"
                aria-label="Keresés törlése"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* RENDEZÉS */}
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="w-full md:w-auto bg-[#f7f9f5] border border-[#dce5d8] rounded-2xl px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[#34493b] outline-none focus:border-[#477258] cursor-pointer"
          >
            <option value="latest">Legfrissebb elöl</option>
            <option value="oldest">Legrégebbi elöl</option>
          </select>

          {/* ADMIN ÚJ BEJEGYZÉS GOMB */}
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={openCreateEditor}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#275940] hover:bg-[#1d4330] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition cursor-pointer"
            >
              <PenSquare size={16} strokeWidth={2} /> Új bejegyzés
            </button>
          )}
        </div>

        {/* --- TARTALOM ÁLLAPOTOK --- */}
        {loading ? (
          <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 py-20 text-[#718174]">
            <div className="w-9 h-9 border-2 border-[#d8dfd4] border-t-[#275940] rounded-full animate-spin"></div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#718174]">Történetek betöltése...</span>
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="mt-12 text-center py-20 bg-[#f7f9f5] rounded-3xl border border-[#dce5d8] px-6 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#ecefe6] border border-[#cad6c9] flex items-center justify-center text-[#477258] mx-auto mb-4">
              <BookOpen size={24} strokeWidth={1.8} />
            </div>
            <h3 className="font-serif text-2xl text-[#173327] mb-2">
              {query ? 'Nincs találat' : 'Még nincsenek bejegyzések'}
            </h3>
            <p className="text-sm text-[#65756a] leading-relaxed mb-6 font-light">
              {query 
                ? `A(z) „${query}” keresési feltételre egyetlen történet sem található.` 
                : 'Hamarosan új beszámolók és túraélmények érkeznek erre az oldalra.'}
            </p>
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#275940] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1d4330] transition shadow-xs cursor-pointer"
              >
                Keresés törlése
              </button>
            )}
          </div>
        ) : (
          <>
            {/* --- KIEMELT BEJEGYZÉS --- */}
            {featuredPost && (
              <article className="relative mt-12 overflow-hidden rounded-3xl border border-[#dce5d8] shadow-md group min-h-[32rem] flex flex-col justify-end">
                {featuredPost.cover_image ? (
                  <img 
                    src={`${assetBase}${featuredPost.cover_image}`} 
                    alt={featuredPost.title} 
                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#173327] via-[#275940] to-[#0f1f17]" />
                )}
                
                {/* SÖTÉT GRADIENT OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1f17]/95 via-[#0f1f17]/55 to-transparent" />
                
                <div className="relative z-10 flex min-h-[32rem] flex-col justify-between p-6 sm:p-10 md:p-12 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full bg-[#275940] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#dce5d8] border border-white/10 shadow-sm">
                      Kiemelt történet
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleShare(featuredPost, e)}
                        className="p-2 rounded-xl bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm border border-white/20 transition cursor-pointer"
                        title="Megosztás"
                      >
                        <Share2 size={16} />
                      </button>
                      <AdminActions post={featuredPost} light />
                    </div>
                  </div>

                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-[#dce5d8] mb-3">
                      <span className="flex items-center gap-1.5"><User size={14} className="text-[#a8c9b2]" /> {featuredPost.author_name}</span>
                      <span className="flex items-center gap-1.5"><Calendar size={14} className="text-[#a8c9b2]" /> {formatDate(featuredPost.created_at)}</span>
                      <span className="flex items-center gap-1.5"><Clock3 size={14} className="text-[#a8c9b2]" /> {featuredPost.reading_minutes || 1} perc olvasás</span>
                    </div>

                    <Link to={`/blog/${featuredPost.id}`}>
                      <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal leading-tight text-white group-hover:text-emerald-200 transition-colors mb-4">
                        {featuredPost.title}
                      </h2>
                    </Link>

                    <p className="max-w-2xl line-clamp-2 text-sm sm:text-base leading-relaxed text-[#dce5d8] font-light mb-6">
                      {featuredPost.excerpt}
                    </p>

                    <Link 
                      to={`/blog/${featuredPost.id}`} 
                      className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white hover:text-emerald-300 transition-all group-hover:gap-3"
                    >
                      Elolvasom a teljes cikket <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* --- TOVÁBBI CIKKEK RÁCS --- */}
            {gridPosts.length > 0 && (
              <section className="mt-16">
                <div className="border-b border-[#d8dfd4] pb-4 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#648067]">Összes történet</p>
                    <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#173327]">Beszámolók a természetből</h2>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#718174] bg-[#f7f9f5] border border-[#dce5d8] px-3.5 py-1.5 rounded-full self-start sm:self-auto inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#477258]"></span>
                    {visiblePosts.length} bejegyzés
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {gridPosts.map((post) => (
                    <article 
                      key={post.id} 
                      onClick={() => window.location.href = `/blog/${post.id}`}
                      className="group bg-white rounded-3xl border border-[#dce5d8] hover:border-[#b4c7b0] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer"
                    >
                      {/* KÉP ÉS CÍMKE */}
                      <div className="relative h-56 overflow-hidden bg-[#ecefe6]">
                        {post.cover_image ? (
                          <img 
                            src={`${assetBase}${post.cover_image}`} 
                            alt={post.title} 
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105 ease-out" 
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-[#ecefe6] text-[#648067]">
                            <BookOpen size={48} strokeWidth={1.5} />
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1f17]/70 via-transparent to-transparent" />
                        
                        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#275940] shadow-xs">
                            {post.reading_minutes || 1} perc olvasás
                          </span>

                          {Number(post.image_count || 0) > 0 && (
                            <span className="rounded-full bg-[#0f1f17]/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-medium text-white flex items-center gap-1 shadow-xs">
                              <Camera size={12} /> {post.image_count}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* TARTALOM */}
                      <div className="flex flex-1 flex-col p-6">
                        <div className="text-xs text-[#718174] font-medium mb-2">
                          {formatDate(post.created_at)}
                        </div>
                        
                        <h3 className="font-serif text-xl sm:text-2xl font-normal leading-snug text-[#173327] group-hover:text-[#275940] transition-colors line-clamp-2 mb-3">
                          {post.title}
                        </h3>
                        
                        <p className="line-clamp-3 text-sm leading-relaxed text-[#55695b] font-light mb-5">
                          {post.excerpt}
                        </p>
                        
                        {/* LÁBLÉC: SZERZŐ ÉS MŰVELETEK */}
                        <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-[#ecefe6]">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-[#173327]">
                            <User size={14} className="text-[#648067]" /> {post.author_name}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => handleShare(post, e)}
                              className="p-2 rounded-xl bg-[#f7f9f5] border border-[#dce5d8] text-[#718174] hover:bg-[#ecefe6] hover:text-[#173327] transition cursor-pointer"
                              title="Megosztás"
                            >
                              <Share2 size={15} />
                            </button>
                            <AdminActions post={post} />
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* --- ADMIN BEJEGYZÉS SZERKESZTŐ MODÁL --- */}
      {editorOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 md:p-8">
          <button type="button" aria-label="Bezárás" onClick={closeEditor} className="absolute inset-0 bg-[#0f1f17]/70 backdrop-blur-sm" />
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#dce5d8] bg-white shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            
            {/* MODÁL FEJLÉC */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#d8dfd4] bg-[#f7f9f5] px-6 sm:px-9 py-5">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#648067]">Adminisztráció</span>
                <h2 className="mt-1 font-serif text-2xl sm:text-3xl text-[#173327]">
                  {editingPost ? 'Bejegyzés módosítása' : 'Új bejegyzés közzététele'}
                </h2>
              </div>
              <button 
                type="button" 
                onClick={closeEditor} 
                className="p-2 rounded-xl text-[#718174] hover:bg-[#ecefe6] hover:text-[#173327] transition border border-transparent hover:border-[#cad6c9]"
                aria-label="Bezárás"
              >
                <X size={18} />
              </button>
            </div>

            {editorLoading ? (
              <div className="flex justify-center py-24">
                <div className="w-8 h-8 border-2 border-[#d8dfd4] border-t-[#275940] rounded-full animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-6 p-6 sm:p-9">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#718174] mb-1.5 block">Cím</label>
                  <input
                    value={editor.title}
                    onChange={(event) => setEditor((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Adj egy találó, figyelemfelkeltő címet..."
                    className="w-full px-4 py-3.5 bg-[#f7f9f5] border border-[#dce5d8] rounded-xl text-base text-[#173327] focus:outline-none focus:border-[#477258] focus:ring-1 focus:ring-[#477258] transition"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#718174]">Történet / Tartalom</label>
                    <span className="text-xs text-[#718174]">{htmlToText(editor.content).split(/\s+/).filter(Boolean).length} szó</span>
                  </div>
                  <div>
                    <RichTextEditor
                      value={editor.content}
                      onChange={(content) => setEditor((current) => ({ ...current, content }))}
                    />
                  </div>
                </div>

                {existingImages.length > 0 && (
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#718174] mb-2 block">Meglévő képek</label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {existingImages.map((url) => (
                        <div key={url} className="group/image relative overflow-hidden rounded-2xl bg-[#ecefe6] border border-[#dce5d8]">
                          <img src={`${assetBase}${url}`} alt="Blog kép" className="h-32 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setExistingImages((current) => current.filter((item) => item !== url))}
                            className="absolute right-2 top-2 rounded-lg bg-[#0f1f17]/80 p-2 text-white opacity-0 transition group-hover/image:opacity-100"
                            title="Kép eltávolítása"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#cad6c9] bg-[#f7f9f5] hover:bg-[#ecefe6] px-6 py-8 text-center transition">
                  <ImagePlus className="text-[#477258]" size={28} />
                  <span className="mt-3 text-sm font-bold text-[#173327]">{editingPost ? 'További képek hozzáadása' : 'Képek feltöltése'}</span>
                  <span className="mt-1 text-xs text-[#718174]">Több képet is kiválaszthatsz (PNG, JPG, WebP), képenként max. 20 MB.</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => setNewImages(Array.from(event.target.files || []))} />
                  {newImages.length > 0 && <span className="mt-3 rounded-full bg-white border border-[#cad6c9] px-3.5 py-1 text-xs font-semibold text-[#275940]">{newImages.length} új kép kiválasztva</span>}
                </label>

                <div className="flex flex-col-reverse gap-3 border-t border-[#ecefe6] pt-5 sm:flex-row sm:justify-end">
                  <button 
                    type="button" 
                    onClick={closeEditor} 
                    className="rounded-xl px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#718174] hover:bg-[#ecefe6] transition"
                  >
                    Mégse
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-[#275940] hover:bg-[#1d4330] px-7 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Mentés...' : editingPost ? 'Módosítások mentése' : 'Közzététel'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <BlogShareModal
        isOpen={!!sharingPost}
        onClose={() => setSharingPost(null)}
        post={sharingPost}
      />
    </div>
  );
};

export default BlogScreen;
