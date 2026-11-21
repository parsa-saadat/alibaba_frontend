import useConfirmDialog from '../../hooks/useConfirmDialog';
import StatTile from '../../components/panel/StatTileComponent';
import usePanelStats from '../../hooks/usePanelStats';
import StatsNotice from '../../components/panel/StatsNoticeComponent';
import useLocalizedContent from '../../hooks/useLocalizedContent';
import { cleanTranslations } from '../../i18n/translation-helpers';
import ContentLanguage from '../../components/common/locale/ContentLanguageComponent';
import { t as translateText } from '../../i18n/runtime.js';
import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ChevronDown, FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import { Loading } from '../../components/common/ScroolToTopComponent';
import { toFa, statusFa } from '../../utils/helpers/format';
import { flattenCategories, buildCategoryTree } from '../../utils/helpers/categories';
import PanelPageHeader from '../../components/panel/PanelPageHeaderComponent';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || '/api';
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMPTY_CAT = {
  translations: {},
  name: '',
  slug: '',
  parent_id: '',
  status: 'ACTIVE',
  sort_order: 0,
};

function makeSlug(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function CategoriesPage() {
  const { confirm: askConfirmation, dialog: confirmationDialog } = useConfirmDialog();
  const {
    stats: panelStats,
    error: statsError,
    refresh: refreshStats,
  } = usePanelStats(['category']);
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState(EMPTY_CAT);
  const content = useLocalizedContent(catForm, setCatForm, ['name'], 'category');
  const [expandedCatIds, setExpandedCatIds] = useState({});

  const load = useCallback(async () => {
    refreshStats();
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        axios.get(`${API}/category?lang=all&limit=100`, authHeaders()).catch(() => null),
        axios.get(`${API}/category/tree?lang=all`, authHeaders()).catch(() => null),
      ]);
      const rawCats = cRes?.data?.body?.data || cRes?.data?.body || [];
      const rawTree = tRes?.data?.body?.data || tRes?.data?.body || [];
      const flat = flattenCategories(rawCats.length ? rawCats : rawTree);
      setCategories(flat);
      setCategoryTree(buildCategoryTree(flat));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveCategory = (e) => {
    e.preventDefault();
    const catForm = content.payload();
    if (!catForm.name.trim()) return toast.error(translateText('نام دسته الزامی است'));
    /* بک‌اند slug لاتین می‌خواهد؛ اگر نام فارسی باشد slug خالی می‌شود، پس از نام یا یک شناسه‌ی یکتا استفاده می‌کنیم */
    const cleanSlug =
      makeSlug(catForm.slug) || makeSlug(catForm.name) || `cat-${Date.now().toString(36)}`;
    if (cleanSlug.length > 100) return toast.error(translateText('slug حداکثر ۱۰۰ کاراکتر است'));
    if (!cleanSlug || !SLUG_REGEX.test(cleanSlug)) {
      return toast.error(
        translateText('اسلاگ باید با حروف کوچک انگلیسی، عدد و خط تیره باشد (مثلاً: mobile-audio)'),
      );
    }
    const payload = {
      name: catForm.name.trim(),
      translations: cleanTranslations(catForm.translations),
      slug: cleanSlug,
      parent_id: catForm.parent_id || null,
      status: catForm.status,
      sort_order: Number(catForm.sort_order) || 0,
    };
    const req = editingCat
      ? axios.put(`${API}/category/${editingCat._id}`, payload, authHeaders())
      : axios.post(`${API}/category`, payload, authHeaders());
    req
      .then(() => {
        toast.success(
          editingCat ? translateText('دسته‌بندی ویرایش شد') : translateText('دسته‌بندی ساخته شد'),
        );
        setEditingCat(null);
        setCatForm(EMPTY_CAT);
        load();
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || translateText('خطا در ذخیره دسته‌بندی')),
      );
  };

  const deleteCat = async (id) => {
    if (
      !(await askConfirmation({
        title: translateText('حذف دسته‌بندی'),
        message: translateText('این دسته‌بندی حذف می‌شود. ادامه می‌دهید؟'),
        confirmLabel: translateText('حذف'),
        danger: true,
      }))
    )
      return;
    axios
      .delete(`${API}/category/${id}`, authHeaders())
      .then(() => {
        toast.success(translateText('دسته‌بندی حذف شد'));
        load();
      })
      .catch((err) => toast.error(err.response?.data?.message || translateText('خطا در حذف')));
  };

  const renderAdminCatNode = (node, depth = 0) => {
    const hasChildren = (node.children || []).length > 0;
    const isExpanded = Boolean(expandedCatIds[node._id]);

    return (
      <div key={node._id} className={depth > 0 ? 'pe-4 me-2 border-s border-theme mt-2' : ''}>
        <div className="card rounded-2xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() =>
              hasChildren && setExpandedCatIds((prev) => ({ ...prev, [node._id]: !prev[node._id] }))
            }
            className="flex items-center gap-2 text-start min-w-0 flex-1"
          >
            <FolderTree size={16} className="text-accent shrink-0" />
            <div className="min-w-0">
              <div className="font-black text-sm flex items-center gap-2">
                <span>{node.name}</span>
                <span className="text-xs muted font-normal" dir="ltr">
                  /{node.slug}
                </span>
              </div>
              <div className="text-[11px] muted">
                {translateText('وضعیت: ')}
                {statusFa(node.status || 'ACTIVE')}
                {hasChildren
                  ? translateText(' • {{v0}} زیردسته', { v0: toFa(node.children.length) })
                  : ''}
              </div>
            </div>
            {hasChildren && (
              <ChevronDown
                size={15}
                className={`me-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setEditingCat(null);
                setCatForm({ ...EMPTY_CAT, parent_id: node._id });
              }}
              className="btn-ghost !py-1.5 !px-2.5 text-xs flex items-center gap-1"
            >
              <Plus size={12} />
              {translateText(' افزودن زیردسته ')}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingCat(node);
                setCatForm({
                  name: node.name || '',
                  translations: node.translations || {},
                  slug: node.slug || '',
                  parent_id: node.parent_id || '',
                  status: node.status || 'ACTIVE',
                  sort_order: node.sort_order || 0,
                });
              }}
              className="btn-ghost !p-2"
              title={translateText('ویرایش')}
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => deleteCat(node._id)}
              className="btn-ghost !p-2 text-red-400"
              title={translateText('حذف')}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="space-y-2 mt-2">
            {node.children.map((child) => renderAdminCatNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-16">
        <Loading label={translateText('در حال بارگذاری دسته‌بندی‌ها…')} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {confirmationDialog}
      <PanelPageHeader
        icon={FolderTree}
        title={translateText('دسته‌بندی‌ها')}
        subtitle={translateText('ساختار درختی دسته‌بندی محصولات')}
        onRefresh={() => load()}
      />
      <StatsNotice error={statsError} stats={panelStats} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label={translateText('دسته\u200cبندی\u200cها')}
          value={toFa(panelStats.category?.counts.all ?? '—')}
        />
        <StatTile
          label={translateText('فعال')}
          value={toFa(panelStats.category?.counts.active ?? '—')}
        />
        <StatTile
          label={translateText('غیرفعال')}
          value={toFa(panelStats.category?.counts.inactive ?? '—')}
        />
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-5 items-start">
        <form
          onSubmit={saveCategory}
          className="card rounded-2xl p-5 space-y-3 lg:sticky lg:top-20"
        >
          <ContentLanguage editor={content} />
          <h2 className="font-black">
            {editingCat
              ? translateText('ویرایش دسته: {{v0}}', { v0: editingCat.name })
              : translateText('دسته‌بندی جدید')}
          </h2>
          <label className="block text-xs muted">
            {translateText('نام دسته ')}
            <input
              className="input mt-1"
              value={content.value('name')}
              dir={content.dir}
              aria-label={`${content.locale} name`}
              lang={content.locale}
              onChange={(e) => content.update('name', e.target.value)}
              placeholder={content.placeholder('name')}
            />
          </label>
          <label className="block text-xs muted">
            {translateText('اسلاگ انگلیسی (فقط حروف کوچک، عدد و -) ')}
            <input
              className="input mt-1"
              dir="ltr"
              placeholder="digital-goods"
              value={catForm.slug}
              onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
              required
            />
          </label>
          <label className="block text-xs muted">
            {translateText('دسته والد ')}
            <select
              className="input mt-1"
              value={catForm.parent_id}
              onChange={(e) => setCatForm({ ...catForm, parent_id: e.target.value })}
            >
              <option value="">{translateText('بدون والد (سردسته اصلی)')}</option>
              {categories
                .filter((c) => c._id !== editingCat?._id)
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs muted">
              {translateText('وضعیت ')}
              <select
                className="input mt-1"
                value={catForm.status}
                onChange={(e) => setCatForm({ ...catForm, status: e.target.value })}
              >
                <option value="ACTIVE">{translateText('فعال')}</option>
                <option value="INACTIVE">{translateText('غیرفعال')}</option>
              </select>
            </label>
            <label className="text-xs muted">
              {translateText('ترتیب نمایش ')}
              <input
                className="input mt-1"
                type="number"
                min={0}
                value={catForm.sort_order}
                onChange={(e) => setCatForm({ ...catForm, sort_order: e.target.value })}
              />
            </label>
          </div>
          <button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Plus size={16} />{' '}
            {editingCat ? translateText('ذخیره تغییرات') : translateText('ساخت دسته‌بندی')}
          </button>
          {(editingCat || catForm.parent_id) && (
            <button
              type="button"
              onClick={() => {
                setEditingCat(null);
                setCatForm(EMPTY_CAT);
              }}
              className="btn-ghost w-full !py-2 text-xs"
            >
              {translateText('بازگشت به حالت جدید ')}
            </button>
          )}
        </form>

        <div className="space-y-2.5" aria-label={translateText('درخت دسته‌بندی‌ها')}>
          <div className="text-xs muted mb-1">
            {translateText('برای مشاهده یا مدیریت زیردسته‌ها، روی سردسته کلیک کنید تا باز شود. ')}
          </div>
          {categoryTree.length === 0 ? (
            <div className="card rounded-2xl p-10 text-center muted">
              {translateText('دسته‌ای ثبت نشده است.')}
            </div>
          ) : (
            categoryTree.map((root) => renderAdminCatNode(root, 0))
          )}
        </div>
      </div>
    </div>
  );
}

export default CategoriesPage;
