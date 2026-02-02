import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { toast } from 'react-toastify';

const BlogDetailsScreen = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const assetBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/blog/${id}`);
        const data = await res.json();
        if (res.ok) {
          setPost(data);
        } else {
          toast.error(data.message || data.error || 'Bejegyzés nem található.');
        }
      } catch (err) {
        toast.error('Hiba a bejegyzés betöltésekor.');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-400 font-bold">Bejegyzés nem található.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f7fb] min-h-screen pb-24">
      <div className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 pt-20 pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.25),transparent_55%)]"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl"></div>
        <div className="max-w-4xl mx-auto relative">
          <Link to="/blog" className="inline-flex items-center gap-2 text-emerald-200 hover:text-white text-xs font-black uppercase tracking-widest mb-6">
            <ArrowLeft size={14} /> Vissza a bloghoz
          </Link>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6">{post.title}</h1>
          <div className="flex items-center gap-4 text-emerald-200/80 text-xs font-bold">
            <span className="flex items-center gap-1"><User size={14} /> {post.author_name}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(post.created_at).toLocaleDateString()}</span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-[10px] uppercase tracking-widest">Blog</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-8">
          {Array.isArray(post.images) && post.images.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {post.images.map((url, index) => (
                <div key={`${url}-${index}`} className="overflow-hidden rounded-2xl">
                  <img
                    src={`${assetBase}${url}`}
                    alt={`${post.title} - ${index + 1}`}
                    className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          )}
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-lg">{post.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetailsScreen;
