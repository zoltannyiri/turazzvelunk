import React, { useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import StarterKit from '@tiptap/starter-kit';
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Code2, Heading2, Heading3,
  ImagePlus, Italic, Link2, List, ListOrdered, LoaderCircle, Minus, Quote,
  Redo2, Strikethrough, Trash2, Underline, Undo2, Unlink
} from 'lucide-react';
import { toast } from 'react-toastify';

const ControlledImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') || 'center',
        renderHTML: (attributes) => ({ 'data-align': attributes.align })
      },
      width: {
        default: '100',
        parseHTML: (element) => element.getAttribute('data-width') || '100',
        renderHTML: (attributes) => ({ 'data-width': attributes.width })
      },
      wrap: {
        default: 'none',
        parseHTML: (element) => element.getAttribute('data-wrap') || 'none',
        renderHTML: (attributes) => ({ 'data-wrap': attributes.wrap })
      }
    };
  }
}).configure({
  inline: false,
  allowBase64: false
});

const normalizeLegacyContent = (content, assetBase) => {
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

const ToolbarButton = ({ active = false, disabled = false, title, onClick, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={active}
    disabled={disabled}
    onClick={onClick}
    className={`flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-30 ${
      active
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
    }`}
  >
    {children}
  </button>
);

const RichTextEditor = ({ value, onChange }) => {
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const assetBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: 'https'
        }
      }),
      ControlledImage
    ],
    content: normalizeLegacyContent(value, assetBase),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'min-h-[22rem] px-5 py-5 text-base leading-8 text-slate-700 outline-none [&_p]:mb-4 [&_h2]:mb-4 [&_h2]:mt-7 [&_h2]:text-3xl [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:text-emerald-950 [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-2xl [&_h3]:font-black [&_h3]:text-emerald-950 [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-7 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-7 [&_li]:mb-1 [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-400 [&_blockquote]:bg-emerald-50 [&_blockquote]:px-5 [&_blockquote]:py-3 [&_blockquote]:italic [&_a]:font-bold [&_a]:text-emerald-600 [&_a]:underline [&_pre]:my-5 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-slate-900 [&_pre]:p-5 [&_pre]:text-sm [&_pre]:text-slate-100 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_hr]:my-8 [&_hr]:border-slate-200'
      }
    },
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML())
  });

  if (!editor) {
    return <div className="min-h-[26rem] animate-pulse rounded-2xl bg-slate-50" />;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    const enteredUrl = window.prompt('Add meg a hivatkozást:', previousUrl);
    if (enteredUrl === null) return;
    const url = enteredUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const normalizedUrl = /^(https?:\/\/|mailto:)/i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: normalizedUrl }).run();
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Csak képfájl tölthető fel.');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/blog/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Nem sikerült feltölteni a képet.');

      editor.chain().focus().setImage({
        src: `${assetBase}${data.url}`,
        alt: file.name,
        align: 'center',
        width: '100',
        wrap: 'none'
      }).run();
      toast.success('A kép bekerült a szövegbe.');
    } catch (error) {
      toast.error(error.message || 'Nem sikerült feltölteni a képet.');
    } finally {
      setUploadingImage(false);
    }
  };

  const updateImage = (attributes) => {
    editor.chain().focus().updateAttributes('image', attributes).run();
  };

  const setImageLayout = (wrap) => {
    const currentAttributes = editor.getAttributes('image');
    const attributes = { wrap };

    if (wrap === 'left' || wrap === 'right') {
      attributes.align = wrap;
      if (currentAttributes.width === '100') attributes.width = '50';
    } else {
      attributes.align = 'center';
    }

    updateImage(attributes);
  };

  const imageSelected = editor.isActive('image');

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadImage} />
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 bg-slate-50/80 p-2">
        <ToolbarButton title="Félkövér" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></ToolbarButton>
        <ToolbarButton title="Dőlt" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></ToolbarButton>
        <ToolbarButton title="Aláhúzott" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><Underline size={16} /></ToolbarButton>
        <ToolbarButton title="Áthúzott" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={16} /></ToolbarButton>
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <ToolbarButton title="Címsor 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={17} /></ToolbarButton>
        <ToolbarButton title="Címsor 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={17} /></ToolbarButton>
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <ToolbarButton title="Felsorolás" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={17} /></ToolbarButton>
        <ToolbarButton title="Számozott lista" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={17} /></ToolbarButton>
        <ToolbarButton title="Idézet" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={17} /></ToolbarButton>
        <ToolbarButton title="Kódrészlet" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 size={17} /></ToolbarButton>
        <ToolbarButton title="Elválasztó" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={17} /></ToolbarButton>
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <ToolbarButton title="Link hozzáadása" active={editor.isActive('link')} onClick={setLink}><Link2 size={17} /></ToolbarButton>
        <ToolbarButton title="Link eltávolítása" disabled={!editor.isActive('link')} onClick={() => editor.chain().focus().unsetLink().run()}><Unlink size={17} /></ToolbarButton>
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <ToolbarButton title="Kép beszúrása" disabled={uploadingImage} onClick={() => fileInputRef.current?.click()}>
          {uploadingImage ? <LoaderCircle size={17} className="animate-spin" /> : <ImagePlus size={17} />}
          <span className="ml-1.5 hidden sm:inline">Kép</span>
        </ToolbarButton>
        <span className="mx-1 h-6 w-px bg-slate-200" />
        <ToolbarButton title="Visszavonás" disabled={!editor.can().chain().focus().undo().run()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={17} /></ToolbarButton>
        <ToolbarButton title="Újra" disabled={!editor.can().chain().focus().redo().run()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={17} /></ToolbarButton>
      </div>
      {imageSelected && (
        <div className="flex flex-wrap items-center gap-1 border-b border-emerald-100 bg-emerald-50/70 px-3 py-2">
          <span className="mr-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">Kijelölt kép</span>
          <ToolbarButton title="Külön sorban" active={editor.isActive('image', { wrap: 'none' })} onClick={() => setImageLayout('none')}>Külön sor</ToolbarButton>
          <ToolbarButton title="Kép balra, szöveg mellette jobbra" active={editor.isActive('image', { wrap: 'left' })} onClick={() => setImageLayout('left')}>Kép balra</ToolbarButton>
          <ToolbarButton title="Kép jobbra, szöveg mellette balra" active={editor.isActive('image', { wrap: 'right' })} onClick={() => setImageLayout('right')}>Kép jobbra</ToolbarButton>
          {editor.isActive('image', { wrap: 'none' }) && (
            <>
              <span className="mx-1 h-6 w-px bg-emerald-200" />
              <ToolbarButton title="Balra igazítás" active={editor.isActive('image', { align: 'left' })} onClick={() => updateImage({ align: 'left', wrap: 'none' })}><AlignLeft size={16} /></ToolbarButton>
              <ToolbarButton title="Középre igazítás" active={editor.isActive('image', { align: 'center' })} onClick={() => updateImage({ align: 'center', wrap: 'none' })}><AlignCenter size={16} /></ToolbarButton>
              <ToolbarButton title="Jobbra igazítás" active={editor.isActive('image', { align: 'right' })} onClick={() => updateImage({ align: 'right', wrap: 'none' })}><AlignRight size={16} /></ToolbarButton>
            </>
          )}
          <span className="mx-1 h-6 w-px bg-emerald-200" />
          {['50', '75', '100'].map((width) => (
            <ToolbarButton
              key={width}
              title={`${width}% szélesség`}
              active={editor.isActive('image', { width })}
              onClick={() => updateImage(width === '100' ? { width, wrap: 'none', align: 'center' } : { width })}
            >
              {width}%
            </ToolbarButton>
          ))}
          <span className="mx-1 h-6 w-px bg-emerald-200" />
          <ToolbarButton title="Kép törlése" onClick={() => editor.chain().focus().deleteSelection().run()}><Trash2 size={16} /></ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;
