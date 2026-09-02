import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, BookOpen, Calendar, Camera, Clock3, Edit3, ImagePlus,
  PenSquare, Search, Sparkles, Trash2, User, X
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import RichTextEditor from '../../components/RichTextEditor';

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
      toast.error('A cím és a tartalom kötelező.');
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

  const AdminActions = ({ post, light = false }) => user?.role === 'admin' && (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => openEditEditor(post)}
        className={`p-2.5 rounded-xl transition ${light ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
        title="Szerkesztés"
      >
        <Edit3 size={16} />
      </button>
      <button
        type="button"
        disabled={deletingId === post.id}
        onClick={() => handleDelete(post)}
        className={`p-2.5 rounded-xl transition disabled:opacity-50 ${light ? 'bg-white/15 text-white hover:bg-red-500' : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white'}`}
        title="Törlés"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7f5] pb-24">
      <section className="relative overflow-hidden bg-[#062f27] px-6 pt-20 pb-28 text-white">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_10%,rgba(52,211,153,0.45),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(20,184,166,0.3),transparent_38%)]" />
        <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(120deg,transparent_20%,white_20%,white_21%,transparent_21%,transparent_48%,white_48%,white_49%,transparent_49%)] bg-[length:80px_80px]" />
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-[1.25fr_0.75fr] gap-12 items-end">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 text-emerald-200 text-[10px] font-black uppercase tracking-[0.25em]">
              <Sparkles size={14} /> Történetek a természetből
            </div>
            <h1 className="mt-7 text-5xl md:text-7xl font-black tracking-[-0.06em] leading-[0.92]">
              Bakancsnyomok,<br /><span className="text-emerald-400">amik mesélnek.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base md:text-lg leading-relaxed text-emerald-50/65">
              Útvonalak, élmények és hasznos ötletek túrázóktól, túrázóknak.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: posts.length, label: 'történet', icon: BookOpen },
              { value: totalImages, label: 'fotó', icon: Camera },
              { value: posts.length ? `${posts[0]?.reading_minutes || 1} p` : '–', label: 'legfrissebb', icon: Clock3 }
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.07] backdrop-blur p-4">
                {React.createElement(Icon, { size: 17, className: 'text-emerald-400' })}
                <div className="mt-4 text-2xl font-black">{value}</div>
                <div className="text-[9px] font-black uppercase tracking-widest text-emerald-100/50">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="relative max-w-7xl mx-auto px-6 -mt-12">
        <div className="flex flex-col md:flex-row gap-3 rounded-[2rem] border border-white bg-white/90 backdrop-blur-xl p-3 shadow-xl shadow-emerald-950/5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Keresés cím, tartalom vagy szerző alapján..."
              className="w-full rounded-2xl bg-slate-50 py-3.5 pl-12 pr-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="rounded-2xl bg-slate-50 px-5 py-3.5 text-sm font-black text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="latest">Legfrissebb elöl</option>
            <option value="oldest">Legrégebbi elöl</option>
          </select>
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={openCreateEditor}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20"
            >
              <PenSquare size={17} /> Új bejegyzés
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-28"><div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
        ) : visiblePosts.length === 0 ? (
          <div className="mt-10 rounded-[2rem] border border-dashed border-slate-200 bg-white py-20 text-center">
            <BookOpen className="mx-auto text-slate-300" size={34} />
            <p className="mt-4 font-black text-slate-600">{query ? 'Nincs találat erre a keresésre.' : 'Még nincs bejegyzés.'}</p>
          </div>
        ) : (
          <>
            {featuredPost && (
              <article className="relative mt-10 overflow-hidden rounded-[2.75rem] bg-slate-900 shadow-2xl shadow-slate-900/15 min-h-[30rem]">
                {featuredPost.cover_image ? (
                  <img src={`${assetBase}${featuredPost.cover_image}`} alt={featuredPost.title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-900 to-slate-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
                <div className="relative z-10 flex min-h-[30rem] flex-col justify-between p-7 md:p-12">
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full bg-emerald-400 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-950">Legfrissebb történet</span>
                    <AdminActions post={featuredPost} light />
                  </div>
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-white/65">
                      <span className="flex items-center gap-1.5"><User size={14} /> {featuredPost.author_name}</span>
                      <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(featuredPost.created_at)}</span>
                      <span className="flex items-center gap-1.5"><Clock3 size={14} /> {featuredPost.reading_minutes || 1} perc olvasás</span>
                    </div>
                    <h2 className="mt-5 text-4xl md:text-6xl font-black tracking-[-0.05em] leading-none text-white">{featuredPost.title}</h2>
                    <p className="mt-5 max-w-2xl line-clamp-2 text-base leading-relaxed text-white/70">{featuredPost.excerpt}</p>
                    <Link to={`/blog/${featuredPost.id}`} className="mt-7 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-300 hover:text-white transition">
                      Elolvasom <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {gridPosts.length > 0 && (
              <section className="mt-14">
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">Felfedezés</div>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-emerald-950">További történetek</h2>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{visiblePosts.length} bejegyzés</span>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {gridPosts.map((post) => (
                    <article key={post.id} className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                      <Link to={`/blog/${post.id}`} className="block">
                        <div className="relative h-56 overflow-hidden bg-gradient-to-br from-emerald-700 to-slate-900">
                          {post.cover_image ? (
                            <img src={`${assetBase}${post.cover_image}`} alt={post.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                          ) : (
                            <BookOpen className="absolute inset-0 m-auto text-white/25" size={54} />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 to-transparent" />
                          <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-700 backdrop-blur">
                            {post.reading_minutes || 1} perc olvasás
                          </span>
                        </div>
                      </Link>
                      <div className="flex flex-1 flex-col p-6">
                        <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-slate-400">
                          <span>{formatDate(post.created_at)}</span>
                          <span className="flex items-center gap-1"><Camera size={13} /> {post.image_count || 0}</span>
                        </div>
                        <Link to={`/blog/${post.id}`} className="mt-3">
                          <h3 className="line-clamp-2 text-2xl font-black leading-tight text-emerald-950 transition group-hover:text-emerald-600">{post.title}</h3>
                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-500">{post.excerpt}</p>
                        </Link>
                        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><User size={14} /> {post.author_name}</span>
                          <AdminActions post={post} />
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

      {editorOpen && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center p-4 md:p-8">
          <button type="button" aria-label="Bezárás" onClick={closeEditor} className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm" />
          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-[2.5rem] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur md:px-9">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">Admin szerkesztő</div>
                <h2 className="mt-1 text-2xl font-black text-emerald-950">{editingPost ? 'Bejegyzés módosítása' : 'Új bejegyzés'}</h2>
              </div>
              <button type="button" onClick={closeEditor} className="rounded-xl bg-slate-100 p-2.5 text-slate-500 hover:bg-slate-200"><X size={19} /></button>
            </div>

            {editorLoading ? (
              <div className="flex justify-center py-24"><div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-6 p-6 md:p-9">
                <div>
                  <label className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Cím</label>
                  <input
                    value={editor.title}
                    onChange={(event) => setEditor((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Adj egy emlékezetes címet..."
                    className="mt-2 w-full rounded-2xl bg-slate-50 p-4 text-lg font-black outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Történet</label>
                    <span className="text-[10px] font-bold text-slate-400">{htmlToText(editor.content).split(/\s+/).filter(Boolean).length} szó</span>
                  </div>
                  <div className="mt-2">
                    <RichTextEditor
                      value={editor.content}
                      onChange={(content) => setEditor((current) => ({ ...current, content }))}
                    />
                  </div>
                </div>

                {existingImages.length > 0 && (
                  <div>
                    <div className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Meglévő képek</div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {existingImages.map((url) => (
                        <div key={url} className="group/image relative overflow-hidden rounded-2xl bg-slate-100">
                          <img src={`${assetBase}${url}`} alt="Blog kép" className="h-32 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setExistingImages((current) => current.filter((item) => item !== url))}
                            className="absolute right-2 top-2 rounded-lg bg-slate-950/70 p-2 text-white opacity-0 transition group-hover/image:opacity-100"
                            title="Kép eltávolítása"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-6 py-8 text-center transition hover:border-emerald-400 hover:bg-emerald-50">
                  <ImagePlus className="text-emerald-600" size={28} />
                  <span className="mt-3 text-sm font-black text-emerald-950">{editingPost ? 'További képek hozzáadása' : 'Képek feltöltése'}</span>
                  <span className="mt-1 text-xs text-slate-500">Több képet is kiválaszthatsz, képenként legfeljebb 20 MB.</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => setNewImages(Array.from(event.target.files || []))} />
                  {newImages.length > 0 && <span className="mt-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-600">{newImages.length} új kép kiválasztva</span>}
                </label>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button type="button" onClick={closeEditor} className="rounded-2xl px-6 py-3.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100">Mégse</button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-2xl bg-emerald-600 px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {submitting ? 'Mentés...' : editingPost ? 'Módosítások mentése' : 'Közzététel'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogScreen;
