import { createPortal } from 'react-dom';
import { direction as interfaceDirection } from '../../i18n/runtime';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Extension, Node as TipTapNode, mergeAttributes } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Markdown } from 'tiptap-markdown';
import {
  ArrowRight,
  ArrowUp,
  Bold,
  ChevronDown,
  Code,
  Code2,
  Columns3,
  Edit3,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Maximize2,
  Merge,
  Minus,
  Minimize2,
  MonitorPlay,
  Plus,
  Quote,
  Redo2,
  Rows3,
  Split,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Undo2,
  Video as VideoIcon,
  X,
} from 'lucide-react';
import useMediaSrc from '../../hooks/useMediaSrc';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';

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

const ACTIVE_STYLE = { background: 'var(--primary-color)', color: '#ffffff' };

/* ------------------------------------------------------------------ */
/* ابزارهای کمکی رسانه                                                 */
/* ------------------------------------------------------------------ */
const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');

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
    return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
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
/* NodeView مشترک: تصویر / ویدیو / جاسازی                              */
/* ------------------------------------------------------------------ */
function MediaView({ node, selected, deleteNode }) {
  const { src, alt } = node.attrs;
  const type = node.type.name;
  const media = useMediaSrc(src);

  return (
    <NodeViewWrapper className={`md-media ${selected ? 'is-selected' : ''}`}>
      <div className="md-media-box" contentEditable={false}>
        {type === 'image' &&
          (media.url ? (
            <img src={media.url} alt={alt || ''} draggable={false} className="md-media-el" />
          ) : (
            <div className="md-media-loading">
              {media.failed
                ? translateText('تصویر در دسترس نیست')
                : translateText('در حال بارگذاری تصویر…')}
            </div>
          ))}
        {type === 'video' && <video src={src} controls playsInline className="md-media-el" />}
        {type === 'embed' && (
          <iframe
            src={src}
            title={translateText('ویدیوی جاسازی‌شده')}
            allowFullScreen
            loading="lazy"
            className="md-media-el md-media-embed"
          />
        )}

        <button
          type="button"
          className="md-media-del"
          title={translateText('حذف')}
          aria-label={translateText('حذف')}
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
/* سریالایز Markdown برای رسانه‌های بلوکی                               */
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
/*
 * تصویر:
 *  - سریالایز: `![alt](src)` به‌صورت بلوک مستقل (تا در متن حل نشود)
 *  - پارس: دست markdown-it انجام می‌شود، پس `parse` خالی می‌ماند
 * این ترکیب رفت‌وبرگشت کامل می‌دهد: آپلود → ذخیره → باز شدن در فرم ویرایش.
 */
const MediaImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MediaView);
  },
  addStorage() {
    return { markdown: { serialize: serializeBlock(imageToText), parse: {} } };
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
/* دکمه‌های ابزار                                                      */
/* ------------------------------------------------------------------ */
function ToolBtn({ title, active, disabled, onClick, children, wide = false }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={!!active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`btn-ghost !p-2 disabled:opacity-40 ${wide ? '!px-2.5 !py-1.5 text-[11px] gap-1.5' : ''}`}
      style={active ? ACTIVE_STYLE : undefined}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="w-px h-5 mx-1 bg-current opacity-20 shrink-0" />;

function pickMediaFile(list) {
  return [...(list || [])].find((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
}

/* ------------------------------------------------------------------ */
/* سرتیتر سطر/ستون در محل مکان‌نما                                     */
/* ------------------------------------------------------------------ */
/*
 * دستور آماده‌ی تیپ‌تپ (`toggleHeaderColumn`) همیشه ستون اول را سرتیتر می‌کند و
 * `toggleHeaderRow` هم فقط سطر جاری را می‌شناسد. کاربر انتظار دارد هر جا موس
 * است همان سطر/ستون سرتیتر شود؛ پس هر دو را دستی و بر اساس موقعیت مکان‌نما
 * انجام می‌دهیم.
 */
function cellAtCursor(editor) {
  const { $from } = editor.state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const cellName = $from.node(depth).type.name;
    if (cellName !== 'tableCell' && cellName !== 'tableHeader') continue;

    const rowDepth = depth - 1;
    const tableDepth = depth - 2;
    if (rowDepth < 1 || tableDepth < 1) return null;
    if ($from.node(rowDepth).type.name !== 'tableRow') return null;
    const table = $from.node(tableDepth);
    if (table.type.name !== 'table') return null;

    return {
      table,
      tablePos: $from.before(tableDepth),
      /* شماره‌ی سطر = اندیسِ فرزندِ جدول، شماره‌ی ستون = اندیسِ فرزندِ سطر */
      row: $from.index(tableDepth),
      col: $from.index(rowDepth),
    };
  }
  return null;
}

/* آیا همه‌ی خانه‌های این سطر/ستون سرتیتر هستند؟ */
function axisIsHeader(editor, axis) {
  const info = cellAtCursor(editor);
  if (!info) return false;
  let all = true;
  info.table.forEach((row, _rowOffset, rowIndex) => {
    row.forEach((cell, _cellOffset, colIndex) => {
      if (axis === 'row' ? rowIndex !== info.row : colIndex !== info.col) return;
      if (cell.type.name !== 'tableHeader') all = false;
    });
  });
  return all;
}

/* سرتیتر کردن (یا برداشتن سرتیتر) همان سطر/ستونی که مکان‌نما در آن است */
function toggleHeaderAtCursor(editor, axis) {
  const info = cellAtCursor(editor);
  if (!info) return;
  const headerType = editor.schema.nodes.tableHeader;
  const cellType = editor.schema.nodes.tableCell;
  if (!headerType || !cellType) return;

  const target = axisIsHeader(editor, axis) ? cellType : headerType;
  const { state, view } = editor;
  const tr = state.tr;

  info.table.forEach((row, rowOffset, rowIndex) => {
    if (axis === 'row' && rowIndex !== info.row) return;
    const rowPos = info.tablePos + 1 + rowOffset;
    row.forEach((cell, cellOffset, colIndex) => {
      if (axis === 'col' && colIndex !== info.col) return;
      if (cell.type === target) return;
      tr.setNodeMarkup(rowPos + 1 + cellOffset, target, cell.attrs);
    });
  });

  if (tr.docChanged) {
    view.dispatch(tr);
    view.focus();
  }
}

/* ------------------------------------------------------------------ */
/* پنل ساده‌ی جدول                                                     */
/* ------------------------------------------------------------------ */

/* دکمه‌ی کوچک پنل جدول */
function TableAction({ children, title, onClick, disabled, active }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={!!active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="btn-ghost !py-1 !px-2 text-[11px] flex items-center gap-1 disabled:opacity-40 whitespace-nowrap"
      style={active ? ACTIVE_STYLE : undefined}
    >
      {children}
    </button>
  );
}

function MenuRow({ label, children }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="w-14 shrink-0 text-[10px] font-black muted">{label}</span>
      <div className="flex items-center gap-1 flex-wrap">{children}</div>
    </div>
  );
}

function TableMenu({ editor, onClose }) {
  const [size, setSize] = useState({ rows: 3, cols: 3 });
  const inTable = editor.isActive('table');
  const rowIsHeader = inTable && axisIsHeader(editor, 'row');
  const colIsHeader = inTable && axisIsHeader(editor, 'col');

  const run = (fn) => () => fn(editor.chain().focus()).run();

  return (
    <div
      className="p-3 space-y-2.5 border-b border-theme"
      style={{ background: 'var(--card2)' }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* سرصفحه‌ی پنل */}
      <div className="flex items-center justify-between gap-2">
        <b className="text-[11px] flex items-center gap-1.5">
          <TableIcon size={13} className="text-yellow" />
          {translateText(' جدول ')}
        </b>
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost !p-1"
          aria-label={translateText('بستن')}
        >
          <X size={13} />
        </button>
      </div>

      {/* درج جدول جدید */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="w-14 shrink-0 text-[10px] font-black muted">
          {translateText('جدول تازه')}
        </span>
        {[
          ['rows', translateText('سطر'), Rows3],
          ['cols', translateText('ستون'), Columns3],
        ].map(([key, label, Icon]) => (
          <div key={key} className="flex items-center gap-1 card rounded-lg px-1.5 py-0.5">
            <Icon size={11} className="muted" />
            <span className="text-[10px] muted">{label}</span>
            <button
              type="button"
              className="btn-ghost !p-0.5"
              onClick={() => setSize((prev) => ({ ...prev, [key]: Math.max(2, prev[key] - 1) }))}
              aria-label={translateText('کم کردن {{v0}}', { v0: label })}
            >
              <Minus size={10} />
            </button>
            <b className="w-4 text-center text-[11px]">{size[key]}</b>
            <button
              type="button"
              className="btn-ghost !p-0.5"
              onClick={() => setSize((prev) => ({ ...prev, [key]: Math.min(10, prev[key] + 1) }))}
              aria-label={translateText('زیاد کردن {{v0}}', { v0: label })}
            >
              <Plus size={10} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: size.rows, cols: size.cols, withHeaderRow: true })
              .run()
          }
          className="btn-yellow !py-1 !px-2.5 text-[11px] flex items-center gap-1"
        >
          <TableIcon size={12} />
          {translateText(' درج ')}
        </button>
      </div>

      {!inTable ? (
        <p className="text-[11px] muted leading-5">
          {translateText(
            'روی یکی از خانه‌های جدول کلیک کنید تا گزینه‌های سرتیتر، افزودن و حذف فعال شوند. ',
          )}
        </p>
      ) : (
        <>
          <MenuRow label={translateText('سطر')}>
            <TableAction
              title={translateText('افزودن سطر بالای این سطر')}
              onClick={run((c) => c.addRowBefore())}
              disabled={!editor.can().addRowBefore()}
            >
              <Plus size={11} />
              {translateText(' بالا ')}
            </TableAction>
            <TableAction
              title={translateText('افزودن سطر پایین این سطر')}
              onClick={run((c) => c.addRowAfter())}
              disabled={!editor.can().addRowAfter()}
            >
              <Plus size={11} />
              {translateText(' پایین ')}
            </TableAction>
            <TableAction
              title={translateText(
                'همان سطری که مکان‌نما در آن است سرتیتر شود (یا سرتیترش برداشته شود)',
              )}
              active={rowIsHeader}
              onClick={() => toggleHeaderAtCursor(editor, 'row')}
              disabled={!inTable}
            >
              <Heading2 size={11} />
              {translateText(' سرتیتر سطر ')}
            </TableAction>
            <TableAction
              title={translateText('حذف سطر جاری')}
              onClick={run((c) => c.deleteRow())}
              disabled={!editor.can().deleteRow()}
            >
              <Minus size={11} />
              {translateText(' حذف ')}
            </TableAction>
          </MenuRow>

          <MenuRow label={translateText('ستون')}>
            <TableAction
              title={translateText('افزودن ستون سمت چپ')}
              onClick={run((c) => c.addColumnBefore())}
              disabled={!editor.can().addColumnBefore()}
            >
              <Plus size={11} />
              {translateText(' چپ ')}
            </TableAction>
            <TableAction
              title={translateText('افزودن ستون سمت راست')}
              onClick={run((c) => c.addColumnAfter())}
              disabled={!editor.can().addColumnAfter()}
            >
              <Plus size={11} />
              {translateText(' راست ')}
            </TableAction>
            <TableAction
              title={translateText(
                'همان ستونی که مکان‌نما در آن است سرتیتر شود (یا سرتیترش برداشته شود)',
              )}
              active={colIsHeader}
              onClick={() => toggleHeaderAtCursor(editor, 'col')}
              disabled={!inTable}
            >
              <Columns3 size={11} />
              {translateText(' سرتیتر ستون ')}
            </TableAction>
            <TableAction
              title={translateText('حذف ستون جاری')}
              onClick={run((c) => c.deleteColumn())}
              disabled={!editor.can().deleteColumn()}
            >
              <Minus size={11} />
              {translateText(' حذف ')}
            </TableAction>
          </MenuRow>

          <MenuRow label={translateText('خانه')}>
            <TableAction
              title={translateText('ادغام خانه‌های انتخاب‌شده')}
              onClick={run((c) => c.mergeCells())}
              disabled={!editor.can().mergeCells()}
            >
              <Merge size={11} />
              {translateText(' ادغام ')}
            </TableAction>
            <TableAction
              title={translateText('جدا کردن خانه‌ی ادغام‌شده')}
              onClick={run((c) => c.splitCell())}
              disabled={!editor.can().splitCell()}
            >
              <Split size={11} />
              {translateText(' جدا کردن ')}
            </TableAction>
            <TableAction
              title={translateText('حذف کل جدول')}
              onClick={run((c) => c.deleteTable())}
              disabled={!editor.can().deleteTable()}
            >
              <Trash2 size={11} />
              {translateText(' حذف جدول ')}
            </TableAction>
          </MenuRow>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* پاپ‌آپ ورود لینک (تصویر / ویدیو)                                     */
/* ------------------------------------------------------------------ */
function LinkDialog({ state, onSubmit, onClose }) {
  const [value, setValue] = useState(state.initial || '');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = () => {
    const result = onSubmit(value.trim());
    if (result) setError(result);
  };

  return (
    <div
      className="fixed inset-0 z-[320] flex items-center justify-center p-4"
      style={{ background: 'rgba(3,7,20,0.62)', backdropFilter: 'blur(3px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={state.title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card rounded-2xl p-4 w-full max-w-md space-y-3 shadow-2xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-black text-sm">{state.title}</h3>
            <p className="text-[11px] muted leading-5 mt-1">{state.hint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost !p-1.5"
            aria-label={translateText('بستن')}
          >
            <X size={15} />
          </button>
        </div>

        <input
          ref={inputRef}
          dir="ltr"
          className="input text-xs"
          placeholder={state.placeholder}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
        />

        {error && <p className="text-[11px] text-red-400 leading-5">{error}</p>}

        <div className="flex items-center gap-2 justify-end pt-1">
          <button type="button" onClick={onClose} className="btn-ghost !py-1.5 !px-3 text-xs">
            {translateText('انصراف ')}
          </button>
          <button type="button" onClick={submit} className="btn-yellow !py-1.5 !px-3.5 text-xs">
            {translateText('افزودن ')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* کامپوننت اصلی                                                       */
/* ------------------------------------------------------------------ */
function MarkdownEditorComponent({
  value = '',
  direction = 'ltr',
  lang = 'en',
  onChange,
  onUploadImage,
  onUploadMedia,
  placeholder = translateText('توضیحات کامل محصول...'),
}) {
  const placeholderRef = useRef(placeholder);
  placeholderRef.current = placeholder;
  const [view, setView] = useState('visual');
  const [uploading, setUploading] = useState(false);
  const [tableMenu, setTableMenu] = useState(false);
  const [imageMenu, setImageMenu] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  /* فاصله از لبهٔ واقعی نوار کنار پنل، مستقل از RTL/LTR. */
  const [fsOffset, setFsOffset] = useState({ left: 0, right: 0 });
  /* پاپ‌آپ لینک تصویر/ویدیو: { kind: 'image' | 'video', … } */
  const [linkDialog, setLinkDialog] = useState(null);
  /* وقتی نوار ابزار به بالای صفحه می‌چسبد، گوشه‌های گردش برداشته می‌شود */
  const [toolbarStuck, setToolbarStuck] = useState(false);
  const toolbarSentinelRef = useRef(null);
  const toolbarRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const uploadRef = useRef(null);
  const openLinkRef = useRef(null);

  const extensions = useMemo(
    () => [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      MediaImage,
      VideoNode,
      EmbedNode,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: () => placeholderRef.current }),
      TableKeys,
      LinkShortcut.configure({ onShortcut: () => openLinkRef.current?.() }),
      Markdown.configure({
        html: true,
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
      attributes: { dir: direction, lang, class: 'md-visual' },
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
    onUpdate: ({ editor: inst }) => {
      onChange?.(inst.storage.markdown.getMarkdown());
    },
  });

  useEffect(() => {
    if (editor)
      editor.setOptions({
        editorProps: {
          ...editor.options.editorProps,
          attributes: { ...editor.options.editorProps.attributes, dir: direction, lang },
        },
      });
  }, [editor, direction, lang]);

  if (typeof window !== 'undefined' && import.meta.env.DEV) window.__editor = editor;

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

  /* ---------- حالت تمام‌صفحه (مثل وردپرس) ---------- */
  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setFullscreen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [fullscreen]);

  /*
   * در حالت تمام‌صفحه نباید نوار کنار پنل (منوی مدیریت/فروشنده) زیر ویرایشگر
   * برود؛ پس لبه‌ی راست پنجره‌ی ویرایشگر به اندازه‌ی همان نوار عقب می‌نشیند.
   * عرض نوار با تغییر اندازه‌ی پنجره یا باز/بسته‌شدن منو دوباره اندازه‌گیری می‌شود.
   */
  useEffect(() => {
    if (!fullscreen) return undefined;

    const measure = () => {
      const offset = { left: 0, right: 0 };
      const aside = document.querySelector('.admin-wrapper > aside');
      const desktop = window.innerWidth >= 1024;
      if (desktop && aside) {
        const style = window.getComputedStyle(aside);
        const rect = aside.getBoundingClientRect();
        const isDrawer = style.position === 'fixed';
        if (!isDrawer && rect.width > 0 && rect.height > 0) {
          if (rect.left < window.innerWidth / 2) offset.left = Math.max(0, Math.round(rect.right));
          else offset.right = Math.max(0, Math.round(window.innerWidth - rect.left));
        }
      }
      setFsOffset((previous) =>
        previous.left === offset.left && previous.right === offset.right ? previous : offset,
      );
    };

    measure();
    window.addEventListener('resize', measure);
    const aside = document.querySelector('.admin-wrapper > aside');
    const observer =
      aside && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(aside);

    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [fullscreen]);

  /*
   * نوار ابزار «توضیحات کامل محصول» چسبان است؛ وقتی به بالای صفحه می‌چسبد، گوشه‌های
   * گرد بالا دیگر بی‌معنا و بدشکل می‌شوند. یک عنصر نگهبان یک‌پیکسلی بالای نوار می‌گذاریم:
   * تا وقتی دیده می‌شود نوار در جای خودش است (گرد)، و وقتی از دید خارج شد یعنی چسبیده
   * (بدون گردی).
   */
  useEffect(() => {
    const sentinel = toolbarSentinelRef.current;
    if (!sentinel || fullscreen || typeof IntersectionObserver === 'undefined') {
      setToolbarStuck(false);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => setToolbarStuck(!entry.isIntersecting), {
      threshold: 0,
      rootMargin: '0px',
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
    /* `editor` هم وابستگی است: تا ادیتور آماده نشود نگهبان در صفحه نیست */
  }, [fullscreen, view, editor]);

  /* همگام‌سازی مقدار بیرونی فقط در حالت visual */
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
    const url = window.prompt(translateText('آدرس لینک'), prev || 'https://');
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

  /* ---------- پاپ‌آپ لینک تصویر ---------- */
  const openImageDialog = () =>
    setLinkDialog({
      kind: 'image',
      title: translateText('افزودن تصویر با لینک'),
      hint: translateText(
        'آدرس کامل تصویر را با http یا https وارد کنید. تصویر همان‌جا در متن درج می‌شود.',
      ),
      placeholder: 'https://example.com/image.jpg',
      initial: '',
    });

  /* ---------- پاپ‌آپ لینک ویدیو ---------- */
  const openVideoDialog = () =>
    setLinkDialog({
      kind: 'video',
      title: translateText('افزودن ویدیو با لینک'),
      hint: translateText(
        'لینک ویدیوی YouTube، Vimeo یا آپارات را وارد کنید؛ به پخش‌کننده‌ی قابل جاسازی تبدیل می‌شود.',
      ),
      placeholder: 'https://www.aparat.com/v/…',
      initial: '',
    });

  /* ارسال پاپ‌آپ: پیام خطا برمی‌گرداند یا null (یعنی انجام شد) */
  const submitLink = (raw) => {
    if (!raw) return translateText('آدرس را وارد کنید.');
    if (linkDialog?.kind === 'image') {
      if (!/^https?:\/\//i.test(raw))
        return translateText('آدرس تصویر باید با http یا https شروع شود.');
      editor
        .chain()
        .focus()
        .setImage({ src: raw, alt: translateText('تصویر') })
        .run();
      setLinkDialog(null);
      return null;
    }
    const src = toEmbedUrl(raw);
    if (!src)
      return translateText('فقط لینک‌های https مربوط به YouTube، Vimeo و Aparat پذیرفته می‌شوند.');
    editor.chain().focus().setEmbed({ src }).run();
    setLinkDialog(null);
    return null;
  };

  const inTable = editor.isActive('table');
  const notVisual = view !== 'visual';

  const content = (
    <div
      data-testid="markdown-editor"
      data-fullscreen={fullscreen}
      dir={interfaceDirection}
      /* توجّه: `overflow-hidden` اینجا نوار ابزارِ چسبان را بی‌اثر می‌کرد
         (هر والدِ overflow-hidden یک «جعبه‌ی اسکرول» می‌سازد و sticky به آن می‌چسبد) */
      className={`border border-theme relative ${fullscreen ? 'rounded-none' : 'rounded-2xl'}`}
      style={
        fullscreen
          ? {
              position: 'fixed',
              top: 0,
              bottom: 0,
              left: fsOffset.left,
              /* نوار کنار پنل دیده و قابل استفاده بماند */
              right: fsOffset.right,
              zIndex: 200,
              background: 'var(--bg)',
              display: 'flex',
              flexDirection: 'column',
              height: '100dvh',
            }
          : { background: 'var(--bg2)' }
      }
    >
      {/* نگهبان یک‌پیکسلی برای تشخیص چسبیدن نوار ابزار */}
      <span ref={toolbarSentinelRef} aria-hidden="true" className="block h-px w-full -mb-px" />

      {/*
        نوار ابزار + پنل جدول با هم یک بلوک چسبان را می‌سازند؛
        بالای صفحه می‌چسبند و پنل جدول دقیقاً زیر نوار ابزار می‌آید.
      */}
      <div
        className={
          fullscreen
            ? 'shrink-0'
            : `sticky z-40 backdrop-blur-md ${toolbarStuck ? '' : 'rounded-t-2xl'}`
        }
        style={
          fullscreen
            ? undefined
            : {
                top: 'var(--header-h, 0px)',
                background: 'var(--card)',
              }
        }
      >
        {/* نوار ابزار */}
        <div
          ref={toolbarRef}
          className="flex items-center justify-between gap-2 flex-wrap px-3 py-2 border-b border-theme"
          style={{ background: 'var(--card)' }}
        >
          <div className="flex items-center gap-1 flex-wrap">
            <ToolBtn
              title={translateText('واگرد')}
              disabled={notVisual || !editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
            >
              <Undo2 size={15} />
            </ToolBtn>
            <ToolBtn
              title={translateText('ازنو')}
              disabled={notVisual || !editor.can().redo()}
              onClick={() => editor.chain().focus().redo().run()}
            >
              <Redo2 size={15} />
            </ToolBtn>

            <Sep />

            <ToolBtn
              title={translateText('تیتر ۲')}
              active={editor.isActive('heading', { level: 2 })}
              disabled={notVisual}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 size={15} />
            </ToolBtn>
            <ToolBtn
              title={translateText('تیتر ۳')}
              active={editor.isActive('heading', { level: 3 })}
              disabled={notVisual}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 size={15} />
            </ToolBtn>
            <ToolBtn
              title={translateText('بولد (Ctrl+B)')}
              active={editor.isActive('bold')}
              disabled={notVisual}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold size={15} />
            </ToolBtn>
            <ToolBtn
              title={translateText('ایتالیک (Ctrl+I)')}
              active={editor.isActive('italic')}
              disabled={notVisual}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic size={15} />
            </ToolBtn>
            <ToolBtn
              title={translateText('خط‌خورده')}
              active={editor.isActive('strike')}
              disabled={notVisual}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough size={15} />
            </ToolBtn>
            <ToolBtn
              title={translateText('لیست نقطه‌ای')}
              active={editor.isActive('bulletList')}
              disabled={notVisual}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List size={15} />
            </ToolBtn>
            <ToolBtn
              title={translateText('لیست شماره‌دار')}
              active={editor.isActive('orderedList')}
              disabled={notVisual}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered size={15} />
            </ToolBtn>
            <ToolBtn
              title={translateText('نقل‌قول')}
              active={editor.isActive('blockquote')}
              disabled={notVisual}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote size={15} />
            </ToolBtn>
            <ToolBtn
              title={translateText('کد درون‌خطی')}
              active={editor.isActive('code')}
              disabled={notVisual}
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <Code size={15} />
            </ToolBtn>
            <ToolBtn
              title={translateText('لینک (Ctrl+K)')}
              active={editor.isActive('link')}
              disabled={notVisual}
              onClick={setLink}
            >
              <Link2 size={15} />
            </ToolBtn>

            <Sep />

            {onUploadImage && (
              <div className="relative">
                <ToolBtn
                  title={translateText('افزودن تصویر')}
                  disabled={uploading || notVisual}
                  active={imageMenu}
                  onClick={() => setImageMenu((v) => !v)}
                >
                  <span className="flex items-center gap-0.5">
                    <ImagePlus size={15} />
                    <ChevronDown size={11} />
                  </span>
                </ToolBtn>
                {imageMenu && !notVisual && (
                  <div
                    className="absolute z-[60] mt-1 w-52 card rounded-xl p-1.5 shadow-2xl space-y-1"
                    style={{ right: 0 }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setImageMenu(false);
                        imageInputRef.current?.click();
                      }}
                      className="w-full text-start btn-ghost !py-1.5 !px-2 text-xs flex items-center gap-1.5"
                    >
                      <ImagePlus size={13} />
                      {translateText(' آپلود از دستگاه ')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageMenu(false);
                        openImageDialog();
                      }}
                      className="w-full text-start btn-ghost !py-1.5 !px-2 text-xs flex items-center gap-1.5"
                    >
                      <Link2 size={13} />
                      {translateText(' افزودن با لینک ')}
                    </button>
                  </div>
                )}
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
              </div>
            )}

            {onUploadMedia && (
              <>
                <ToolBtn
                  title={translateText('آپلود ویدیو')}
                  disabled={uploading || notVisual}
                  onClick={() => videoInputRef.current?.click()}
                >
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

            <ToolBtn
              title={translateText('افزودن ویدیو با لینک (YouTube / Vimeo / Aparat)')}
              disabled={notVisual}
              onClick={openVideoDialog}
            >
              <MonitorPlay size={15} />
            </ToolBtn>

            <Sep />

            <ToolBtn
              title={translateText('جدول و تنظیمات آن')}
              active={tableMenu || inTable}
              disabled={notVisual}
              onClick={() => setTableMenu((v) => !v)}
            >
              <span className="flex items-center gap-0.5">
                <TableIcon size={15} />
                <ChevronDown size={11} />
              </span>
            </ToolBtn>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFullscreen((v) => !v)}
              className="chip !py-1 !px-2.5 flex items-center gap-1 text-xs"
              title={
                fullscreen
                  ? translateText('خروج از تمام‌صفحه (Esc)')
                  : translateText('ویرایش تمام‌صفحه')
              }
              aria-pressed={fullscreen}
              style={fullscreen ? ACTIVE_STYLE : undefined}
            >
              {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span className="hidden sm:inline">
                {fullscreen ? translateText('خروج') : translateText('تمام‌صفحه')}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setView('visual')}
              className={`chip !py-1 !px-2.5 flex items-center gap-1 text-xs ${view === 'visual' ? 'on' : ''}`}
            >
              <Edit3 size={13} />
              <span>{translateText('ویرایشگر')}</span>
            </button>
            <button
              type="button"
              onClick={() => setView('source')}
              className={`chip !py-1 !px-2.5 flex items-center gap-1 text-xs ${view === 'source' ? 'on' : ''}`}
            >
              <Code2 size={13} />
              <span>{translateText('کد Markdown')}</span>
            </button>
          </div>
        </div>

        {/*
        پنل پیشرفته‌ی جدول — دقیقاً زیر نوار ابزار می‌نشیند (هر دو با هم چسبان‌اند)
        و اگر بلندتر از کادر دید شد، داخل خودش اسکرول می‌شود.
      */}
        {tableMenu && view === 'visual' && (
          <div
            data-table-panel="1"
            className="max-h-[calc(100dvh-var(--header-h,0px)-var(--editor-bar-h,0px)-96px)] overflow-y-auto border-b border-theme"
            style={{ background: 'var(--card2)' }}
          >
            <TableMenu editor={editor} onClose={() => setTableMenu(false)} />
          </div>
        )}
      </div>

      {/* نوار میان‌بر جدول، وقتی داخل جدول هستیم */}
      {inTable && view === 'visual' && (
        <div
          className={`flex items-center gap-1 flex-wrap px-3 py-1.5 border-b border-theme text-[11px] ${
            fullscreen
              ? 'shrink-0'
              : 'sticky top-[calc(var(--header-h,0px)+var(--editor-bar-h,0px))] z-30'
          }`}
          style={{ background: 'var(--card2)' }}
        >
          <span className="font-black muted">{translateText('جدول:')}</span>
          <ToolBtn
            title={translateText('سطر جدید پایین')}
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            <Rows3 size={13} />
          </ToolBtn>
          <ToolBtn
            title={translateText('ستون جدید راست')}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            <Columns3 size={13} />
          </ToolBtn>
          <ToolBtn
            title={translateText('سرتیتر سطر (همان سطر مکان‌نما)')}
            active={axisIsHeader(editor, 'row')}
            onClick={() => toggleHeaderAtCursor(editor, 'row')}
          >
            <ArrowUp size={13} />
          </ToolBtn>
          <ToolBtn
            title={translateText('سرتیتر ستون (همان ستون مکان‌نما)')}
            active={axisIsHeader(editor, 'col')}
            onClick={() => toggleHeaderAtCursor(editor, 'col')}
          >
            <ArrowRight size={13} />
          </ToolBtn>
          <ToolBtn
            title={translateText('ادغام خانه‌ها')}
            disabled={!editor.can().mergeCells()}
            onClick={() => editor.chain().focus().mergeCells().run()}
          >
            <Merge size={13} />
          </ToolBtn>
          <ToolBtn
            title={translateText('جدا کردن خانه')}
            disabled={!editor.can().splitCell()}
            onClick={() => editor.chain().focus().splitCell().run()}
          >
            <Split size={13} />
          </ToolBtn>
          <ToolBtn
            title={translateText('حذف سطر')}
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            <Minus size={13} />
          </ToolBtn>
          <ToolBtn
            title={translateText('حذف جدول')}
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            <Trash2 size={13} />
          </ToolBtn>
          <ToolBtn title={translateText('تنظیمات بیشتر')} onClick={() => setTableMenu(true)}>
            <span className="flex items-center gap-0.5 text-[11px]">
              {translateText('بیشتر ')}
              <ChevronDown size={11} />
            </span>
          </ToolBtn>
        </div>
      )}

      {/* ناحیه ویرایش بصری */}
      <div
        className={
          view === 'visual'
            ? fullscreen
              ? 'flex-1 min-h-0 overflow-y-auto'
              : 'overflow-hidden rounded-b-2xl'
            : 'hidden'
        }
      >
        <EditorContent editor={editor} />
      </div>

      {/* ناحیه کد Markdown */}
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        dir="ltr"
        rows={11}
        className={`${view === 'source' ? 'block' : 'hidden'} w-full p-4 bg-transparent outline-none text-sm leading-7 font-mono resize-y min-h-[240px] ${
          fullscreen ? 'flex-1 min-h-0 resize-none' : ''
        }`}
      />

      {/* نوار وضعیت فقط هنگام آپلود (بدون پیام‌های اعتبارسنجی و راهنمای میان‌بر) */}
      {uploading && (
        <div
          className={`px-3 py-2 border-t border-theme flex items-center gap-2 text-xs ${
            fullscreen ? 'shrink-0' : 'rounded-b-2xl'
          }`}
          style={{ background: 'var(--card)' }}
        >
          <span className="text-amber-400 font-bold">{translateText('در حال آپلود…')}</span>
        </div>
      )}

      {linkDialog && (
        <LinkDialog state={linkDialog} onSubmit={submitLink} onClose={() => setLinkDialog(null)} />
      )}
    </div>
  );
  return fullscreen ? createPortal(content, document.body) : content;
}

export default MarkdownEditorComponent;
