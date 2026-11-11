import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Extension, Node as TipTapNode, mergeAttributes } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Markdown } from 'tiptap-markdown';
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  ImagePlus,
  Video as VideoIcon,
  MonitorPlay,
  Table as TableIcon,
  Rows3,
  Columns3,
  Minus,
  Trash2,
  Edit3,
  Code2,
  X,
} from 'lucide-react';

const MD_PATTERNS = [
  /^#{1,6}\s+.+/m,
  /\*\*[^*]+\*\*/,
  /__[^_]+__/,
  /\*[^*\n]+\*/,
  /_[^_\n]+_/,
  /~~[^~]+~~/,
  /`[^`]+`/,
  /```[\s\S]*?```/,
  /^\s*[-*+]\s+.+/m,
  /^\s*\d+\.\s+.+/m,
  /^\s*>\s+.+/m,
  /\[[^\]]+\]\([^)]+\)/,
  /!\[[^\]]*\]\([^)]+\)/,
  /^\|.+\|$/m,
  /<(img|video|iframe)\b[^>]*>/i,
];

export function isValidBackendMarkdown(text) {
  if (!text || typeof text !== 'string' || !text.trim()) return false;
  return MD_PATTERNS.some((re) => re.test(text));
}

const ACTIVE_STYLE = { background: 'var(--primary-color)', color: '#0a1736' };

/* ------------------------------------------------------------------ */
/* ابزارهای کمکی رسانه                                                  */
/* ------------------------------------------------------------------ */
const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');

// تبدیل لینک‌های رایج به آدرس embed (فقط https و هاست‌های مجاز)
const toEmbedUrl = (input) => {
  let u;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  const parts = u.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be' && /^[\w-]{6,}$/.test(parts[0] || '')) {
    return `https://www.youtube-nocookie.com/embed/${parts[0]}`;
  }
  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id =
      u.searchParams.get('v') || (['embed', 'shorts'].includes(parts[0]) ? parts[1] : null);
    return id && /^[\w-]{6,}$/.test(id)
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : null;
  }
  if (host === 'vimeo.com' && /^\d+$/.test(parts[0] || '')) {
    return `https://player.vimeo.com/video/${parts[0]}`;
  }
  if (host === 'aparat.com' && parts[0] === 'v' && /^\w+$/.test(parts[1] || '')) {
    return `https://www.aparat.com/video/video/embed/videohash/${parts[1]}/vt/frame`;
  }
  return null;
};

/* ------------------------------------------------------------------ */
/* NodeView مشترک: تصویر / ویدیو / جاسازی (تمام‌عرض، راست‌چین)           */
/* ------------------------------------------------------------------ */
function MediaView({ node, selected, deleteNode }) {
  const { src, alt } = node.attrs;
  const type = node.type.name;

  return (
    <NodeViewWrapper className={`md-media ${selected ? 'is-selected' : ''}`}>
      <div className="md-media-box" contentEditable={false}>
        {type === 'image' && (
          <img src={src} alt={alt || ''} draggable={false} className="md-media-el" />
        )}
        {type === 'video' && (
          <video src={src} controls playsInline className="md-media-el" />
        )}
        {type === 'embed' && (
          <iframe
            src={src}
            title="ویدیوی جاسازی‌شده"
            allowFullScreen
            loading="lazy"
            className="md-media-el md-media-embed"
          />
        )}

        <button
          type="button"
          className="md-media-del"
          title="حذف"
          aria-label="حذف"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => deleteNode()}
        >
          <X size={14} />
        </button>
      </div>
    </NodeViewWrapper>
  );
}

/* ------------------------------------------------------------------ */
/* سریالایز Markdown برای رسانه‌ها                                      */
/* ------------------------------------------------------------------ */
const serializeBlock = (toText) => (state, node) => {
  state.write(toText(node));
  state.closeBlock(node);
};

const imageToText = (node) => {
  const { src, alt } = node.attrs;
  return `![${alt || ''}](${src})`;
};

const videoToText = (node) => `<video src="${esc(node.attrs.src)}" controls></video>`;

const embedToText = (node) => `<iframe src="${esc(node.attrs.src)}" allowfullscreen></iframe>`;

/* ------------------------------------------------------------------ */
/* Extensions رسانه                                                    */
/* ------------------------------------------------------------------ */
const MediaImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MediaView);
  },
  addStorage() {
    return { markdown: { serialize: serializeBlock(imageToText) } };
  },
});

const VideoNode = TipTapNode.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null } };
  },
  parseHTML() {
    return [{ tag: 'video[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: '' })];
  },
  addCommands() {
    return {
      setVideo:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(MediaView);
  },
  addStorage() {
    return { markdown: { serialize: serializeBlock(videoToText) } };
  },
});

const EmbedNode = TipTapNode.create({
  name: 'embed',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null } };
  },
  parseHTML() {
    return [{ tag: 'iframe[src]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['iframe', mergeAttributes(HTMLAttributes, { allowfullscreen: '', loading: 'lazy' })];
  },
  addCommands() {
    return {
      setEmbed:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(MediaView);
  },
  addStorage() {
    return { markdown: { serialize: serializeBlock(embedToText) } };
  },
});

/* ------------------------------------------------------------------ */
/* رفتار جدول و لیست مثل وردپرس                                        */
/* ------------------------------------------------------------------ */
const BLOCK_NODES = ['bulletList', 'orderedList', 'blockquote', 'codeBlock'];

const TableKeys = Extension.create({
  name: 'tableKeys',
  priority: 1000,
  addKeyboardShortcuts() {
    const inPlainCell = (editor) =>
      editor.isActive('table') && !BLOCK_NODES.some((n) => editor.isActive(n));

    const colCount = (editor) => {
      const { $from } = editor.state.selection;
      for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (node.type.name === 'tableRow') return node.childCount;
      }
      return 0;
    };

    return {
      Enter: ({ editor }) => {
        if (!inPlainCell(editor)) return false;
        const cols = colCount(editor);
        editor.chain().addRowAfter().run();
        for (let i = 0; i < cols; i++) editor.commands.goToNextCell();
        return true;
      },
      Tab: ({ editor }) => {
        if (!inPlainCell(editor)) return false;
        if (editor.commands.goToNextCell()) return true;
        return editor.chain().addRowAfter().goToNextCell().run();
      },
    };
  },
});

// میانبر Ctrl+K برای لینک
const LinkShortcut = Extension.create({
  name: 'linkShortcut',
  addKeyboardShortcuts() {
    return {
      'Mod-k': () => {
        this.options.onShortcut?.();
        return true;
      },
    };
  },
});

/* ------------------------------------------------------------------ */
/* دکمه ابزار                                                          */
/* ------------------------------------------------------------------ */
function ToolBtn({ title, active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={!!active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="btn-ghost !p-2 disabled:opacity-40"
      style={active ? ACTIVE_STYLE : undefined}
    >
      {children}
    </button>
  );
}

function pickMediaFile(list) {
  return [...(list || [])].find(
    (f) => f.type.startsWith('image/') || f.type.startsWith('video/'),
  );
}

/* ------------------------------------------------------------------ */
/* کامپوننت اصلی                                                       */
/* ------------------------------------------------------------------ */
function MarkdownEditorComponent({
  value = '',
  onChange,
  onUploadImage,
  onUploadMedia, // اختیاری: برای آپلود ویدیو
  placeholder = 'توضیحات کامل محصول...',
}) {
  const [view, setView] = useState('visual');
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const uploadRef = useRef(null);
  const openLinkRef = useRef(null);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true },
      }),
      MediaImage,
      VideoNode,
      EmbedNode,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
      TableKeys,
      LinkShortcut.configure({ onShortcut: () => openLinkRef.current?.() }),
      Markdown.configure({
        html: true, // برای ذخیره ویدیو و جاسازی به‌صورت HTML
        tightLists: true,
        breaks: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    [placeholder],
  );

  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: { dir: 'rtl', class: 'md-visual' },
      handlePaste: (_view, event) => {
        const file = pickMediaFile(event.clipboardData?.files);
        if (file && uploadRef.current) {
          event.preventDefault();
          uploadRef.current(file);
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const file = pickMediaFile(event.dataTransfer?.files);
        if (file && uploadRef.current) {
          event.preventDefault();
          uploadRef.current(file);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.storage.markdown.getMarkdown());
    },
  });

  const handleFile = async (file) => {
    if (!file || !editor) return;
    const isVideo = file.type.startsWith('video/');
    const uploader = isVideo ? onUploadMedia : onUploadImage;
    if (!uploader) return;

    setUploading(true);
    try {
      const url = await uploader(file);
      if (!url) return;
      if (isVideo) {
        editor.chain().focus().setVideo({ src: url }).run();
      } else {
        const alt = (file.name || 'image').replace(/\.[^.]+$/, '');
        editor.chain().focus().setImage({ src: url, alt }).run();
      }
    } finally {
      setUploading(false);
    }
  };
  uploadRef.current = handleFile;

  // همگام‌سازی مقدار بیرونی فقط در حالت visual
  useEffect(() => {
    if (!editor || view !== 'visual') return;
    if (editor.storage.markdown.getMarkdown() !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [value, view, editor]);

  if (!editor) return null;

  /* ---------- لینک ---------- */
  const setLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('آدرس لینک', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    if (editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };
  openLinkRef.current = setLink;

  /* ---------- جاسازی ویدیو ---------- */
  const insertEmbed = () => {
    const input = window.prompt('آدرس ویدیو (YouTube، Vimeo یا Aparat)', 'https://');
    if (!input) return;
    const src = toEmbedUrl(input);
    if (!src) {
      window.alert('فقط لینک‌های https مربوط به YouTube، Vimeo و Aparat پذیرفته می‌شوند.');
      return;
    }
    editor.chain().focus().setEmbed({ src }).run();
  };

  const inTable = editor.isActive('table');
  const valid = isValidBackendMarkdown(value);
  const notVisual = view !== 'visual';

  return (
    <div className="rounded-2xl border border-theme overflow-hidden" style={{ background: 'var(--bg2)' }}>
      {/* نوار ابزار */}
      <div
        className="flex items-center justify-between gap-2 flex-wrap px-3 py-2 border-b border-theme"
        style={{ background: 'var(--card)' }}
      >
        <div className="flex items-center gap-1 flex-wrap">
          <ToolBtn title="تیتر" active={editor.isActive('heading', { level: 2 })} disabled={notVisual}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={15} />
          </ToolBtn>
          <ToolBtn title="بولد (Ctrl+B)" active={editor.isActive('bold')} disabled={notVisual}
            onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={15} />
          </ToolBtn>
          <ToolBtn title="ایتالیک (Ctrl+I)" active={editor.isActive('italic')} disabled={notVisual}
            onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={15} />
          </ToolBtn>
          <ToolBtn title="لیست نقطه‌ای" active={editor.isActive('bulletList')} disabled={notVisual}
            onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={15} />
          </ToolBtn>
          <ToolBtn title="لیست شماره‌دار" active={editor.isActive('orderedList')} disabled={notVisual}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={15} />
          </ToolBtn>
          <ToolBtn title="نقل‌قول" active={editor.isActive('blockquote')} disabled={notVisual}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote size={15} />
          </ToolBtn>
          <ToolBtn title="کد درون‌خطی" active={editor.isActive('code')} disabled={notVisual}
            onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code size={15} />
          </ToolBtn>
          <ToolBtn title="لینک (Ctrl+K)" active={editor.isActive('link')} disabled={notVisual} onClick={setLink}>
            <Link2 size={15} />
          </ToolBtn>

          <span className="w-px h-5 mx-1 bg-current opacity-20" />

          {onUploadImage && (
            <>
              <ToolBtn title="درج تصویر" disabled={uploading || notVisual}
                onClick={() => imageInputRef.current?.click()}>
                <ImagePlus size={15} />
              </ToolBtn>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  handleFile(file);
                }}
              />
            </>
          )}

          {onUploadMedia && (
            <>
              <ToolBtn title="آپلود ویدیو" disabled={uploading || notVisual}
                onClick={() => videoInputRef.current?.click()}>
                <VideoIcon size={15} />
              </ToolBtn>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  handleFile(file);
                }}
              />
            </>
          )}

          <ToolBtn title="جاسازی ویدیو (YouTube / Vimeo / Aparat)" disabled={notVisual} onClick={insertEmbed}>
            <MonitorPlay size={15} />
          </ToolBtn>

          <ToolBtn title="درج جدول (۳×۳)" disabled={notVisual}
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }>
            <TableIcon size={15} />
          </ToolBtn>

          {inTable && view === 'visual' && (
            <>
              <span className="w-px h-5 mx-1 bg-current opacity-20" />
              <ToolBtn title="افزودن ردیف" onClick={() => editor.chain().focus().addRowAfter().run()}>
                <Rows3 size={15} />
              </ToolBtn>
              <ToolBtn title="افزودن ستون" onClick={() => editor.chain().focus().addColumnAfter().run()}>
                <Columns3 size={15} />
              </ToolBtn>
              <ToolBtn title="حذف ردیف" onClick={() => editor.chain().focus().deleteRow().run()}>
                <Minus size={15} />
              </ToolBtn>
              <ToolBtn title="حذف ستون" onClick={() => editor.chain().focus().deleteColumn().run()}>
                <Columns3 size={15} className="opacity-60" />
              </ToolBtn>
              <ToolBtn title="حذف جدول" onClick={() => editor.chain().focus().deleteTable().run()}>
                <Trash2 size={15} />
              </ToolBtn>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView('visual')}
            className={`chip !py-1 !px-2.5 flex items-center gap-1 text-xs ${view === 'visual' ? 'on' : ''}`}
          >
            <Edit3 size={13} />
            <span>ویرایشگر</span>
          </button>
          <button
            type="button"
            onClick={() => setView('source')}
            className={`chip !py-1 !px-2.5 flex items-center gap-1 text-xs ${view === 'source' ? 'on' : ''}`}
          >
            <Code2 size={13} />
            <span>کد Markdown</span>
          </button>
        </div>
      </div>

      {/* ناحیه ویرایش بصری */}
      <div className={view === 'visual' ? '' : 'hidden'}>
        <EditorContent editor={editor} />
      </div>

      {/* ناحیه کد Markdown */}
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        dir="ltr"
        rows={11}
        className={`${view === 'source' ? 'block' : 'hidden'} w-full p-4 bg-transparent outline-none text-sm leading-7 font-mono resize-y min-h-[240px]`}
      />

      {/* وضعیت */}
      <div
        className="px-3 py-2 border-t border-theme flex items-center justify-between gap-2 text-xs"
        style={{ background: 'var(--card)' }}
      >
        <span className={valid ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
          {uploading
            ? 'در حال آپلود…'
            : valid
              ? '✓ ساختار Markdown معتبر است'
              : 'توضیحات باید حداقل یک عنصر Markdown (مثل تیتر، بولد یا لیست) داشته باشد'}
        </span>
      </div>
    </div>
  );
}

export default MarkdownEditorComponent;