import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { PenSquare, Calendar, User } from 'lucide-react';
import { toast } from 'react-toastify';

const BlogScreen = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const assetBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/blog`);
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Hiba a bejegyzések betöltésekor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      images.forEach((file) => formData.append('images', file));

      const res = await fetch(`${import.meta.env.VITE_API_URL}/blog`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Bejegyzés létrehozva.');
        setTitle('');
        setContent('');
        setImages([]);
        fetchPosts();
      } else {
        toast.error(data.message || data.error || 'Hiba történt.');
      }
    } catch (err) {
      toast.error('Hiba történt a mentéskor.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f5f7fb] min-h-screen pb-24">
      <div className="relative z-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.25),transparent_55%)]"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl"></div>
        <div className="max-w-6xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-emerald-200 text-xs font-black uppercase tracking-widest mb-6">
            Blog
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">Élménybeszámolók</h1>
          <p className="text-emerald-200/70 max-w-2xl">
            Oszd meg a legjobb pillanataidat, inspirálj másokat, és fedezz fel új túrákat mások történetein keresztül.
          </p>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Bejegyzések', value: posts.length },
              { label: 'Közösség', value: '500+' },
              { label: 'Új történetek', value: 'Hetente' },
            //   { label: 'Fotógaléria', value: 'HD' }
            ].map((item) => (
              <div key={item.label} className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4">
                <div className="text-xs text-emerald-200/80 font-bold uppercase tracking-widest">{item.label}</div>
                <div className="text-2xl font-black text-white mt-2">{item.value}</div>
              </div>
            ))}
          </div>

        </div>
      </div>

      <div className={`relative z-20 max-w-6xl mx-auto px-6 ${user?.role === 'admin' ? '-mt-10' : 'mt-8'}`}>
        {user?.role === 'admin' && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-emerald-100/60 mb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <PenSquare size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-emerald-950">Új élménybeszámoló</h2>
                  <p className="text-slate-500 text-sm">Írj részletes beszámolót és tölts fel képeket is.</p>
                </div>
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-2 rounded-full">
                Admin nézet
              </div>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-5">
              <input
                type="text"
                placeholder="Cím"
                className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-200 outline-none transition font-semibold"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea
                rows="6"
                placeholder="Élménybeszámoló szövege..."
                className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-200 outline-none transition font-medium"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-100">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Képek feltöltése</label>
                <div className="mt-3 flex flex-col md:flex-row md:items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="w-full text-sm text-slate-600"
                    onChange={(e) => setImages(Array.from(e.target.files || []))}
                  />
                  <div className="text-xs text-slate-500 font-semibold">
                    {images.length > 0 ? `Kiválasztva: ${images.length} kép` : 'Nincs kiválasztva'}
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-500 transition disabled:opacity-60 shadow-lg shadow-emerald-600/20"
              >
                {submitting ? 'Mentés...' : 'Bejegyzés közzététele'}
              </button>
            </form>
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
            <p className="text-slate-500 font-semibold">Még nincs bejegyzés.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="group bg-white p-7 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition"
              >
                {post.cover_image && (
                  <div className="mb-5 overflow-hidden rounded-[1.5rem]">
                    <img
                      src={`${assetBase}${post.cover_image}`}
                      alt={post.title}
                      className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Blog</div>
                  <div className="text-[10px] font-bold text-slate-400">{new Date(post.created_at).toLocaleDateString()}</div>
                </div>
                <h3 className="text-2xl font-black text-emerald-950 mb-3 group-hover:text-emerald-600 transition-colors line-clamp-2">{post.title}</h3>
                <p className="text-slate-600 leading-relaxed mb-6 line-clamp-3">
                  {post.excerpt}{post.excerpt && post.excerpt.length >= 220 ? '…' : ''}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
                  <span className="flex items-center gap-1"><User size={14} /> {post.author_name}</span>
                  <span className="flex items-center gap-1"><Calendar size={14} /> Olvasás ~3 perc</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogScreen;
