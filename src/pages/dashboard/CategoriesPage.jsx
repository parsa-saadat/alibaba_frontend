import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, ChevronDown, FolderTree } from 'lucide-react';
import { authHeaders } from '../../utils/helpers/storage';
import { Loading } from '../../components/ScroolToTopComponent';
import { toFa, statusFa } from '../../utils/helpers/format';
import { flattenCategories, buildCategoryTree } from '../../utils/helpers/categories';

const API = import.meta.env.VITE_APP_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMPTY_CAT = { name: '', slug: '', parent_id: '', status: 'ACTIVE', sort_order: 0 };

function makeSlug(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState(EMPTY_CAT);
  const [expandedCatIds, setExpandedCatIds] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        axios.get(`${API}/category?limit=100`, authHeaders()).catch(() => null),
        axios.get(`${API}/category/tree`, authHeaders()).catch(() => null),
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
    if (!catForm.name.trim()) return toast.error('نام دسته الزامی است');
    const cleanSlug = makeSlug(catForm.slug);
    if (!cleanSlug || !SLUG_REGEX.test(cleanSlug)) {
      return toast.error(
        'اسلاگ باید با حروف کوچک انگلیسی، عدد و خط تیره باشد (مثلاً: mobile-audio)',
      );
    }
    const payload = {
      name: catForm.name.trim(),
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
        toast.success(editingCat ? 'دسته‌بندی ویرایش شد' : 'دسته‌بندی ساخته شد');
        setEditingCat(null);
        setCatForm(EMPTY_CAT);
        load();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'خطا در ذخیره دسته‌بندی'));
  };

  const deleteCat = (id) => {
    if (!confirm('این دسته‌بندی حذف شود؟')) return;
    axios
      .delete(`${API}/category/${id}`, authHeaders())
      .then(() => {
        toast.success('دسته‌بندی حذف شد');
        load();
      })
      .catch((err) => toast.error(err.response?.data?.message || 'خطا در حذف'));
  };

  const renderAdminCatNode = (node, depth = 0) => {
    const hasChildren = (node.children || []).length > 0;
    const isExpanded = Boolean(expandedCatIds[node._id]);

    return (
      <div key={node._id} className={depth > 0 ? 'pr-4 mr-2 border-r border-theme mt-2' : ''}>
        <div className="card rounded-2xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={() =>
              hasChildren &&
              setExpandedCatIds((prev) => ({ ...prev, [node._id]: !prev[node._id] }))
            }
            className="flex items-center gap-2 text-right min-w-0 flex-1"
          >
            <FolderTree size={16} className="text-yellow shrink-0" />
            <div className="min-w-0">
              <div className="font-black text-sm flex items-center gap-2">
                <span>{node.name}</span>
                <span className="text-xs muted font-normal" dir="ltr">
                  /{node.slug}
                </span>
              </div>
              <div className="text-[11px] muted">
                وضعیت: {statusFa(node.status || 'ACTIVE')}
                {hasChildren ? ` • ${toFa(node.children.length)} زیردسته` : ''}
              </div>
            </div>
            {hasChildren && (
              <ChevronDown
                size={15}
                className={`mr-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
              <Plus size={12} /> افزودن زیردسته
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingCat(node);
                setCatForm({
                  name: node.name || '',
                  slug: node.slug || '',
                  parent_id: node.parent_id || '',
                  status: node.status || 'ACTIVE',
                  sort_order: node.sort_order || 0,
                });
              }}
              className="btn-ghost !p-2"
              title="ویرایش"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => deleteCat(node._id)}
              className="btn-ghost !p-2 text-red-400"
              title="حذف"
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
        <Loading label="در حال بارگذاری دسته‌بندی‌ها…" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-5 items-start">
      <form
        onSubmit={saveCategory}
        className="card rounded-2xl p-5 space-y-3 lg:sticky lg:top-20"
      >
        <h2 className="font-black">
          {editingCat ? `ویرایش دسته: ${editingCat.name}` : 'دسته‌بندی جدید'}
        </h2>
        <label className="block text-xs muted">
          نام دسته
          <input
            className="input mt-1"
            placeholder="مثلاً: کالای دیجیتال"
            value={catForm.name}
            onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
            required
          />
        </label>
        <label className="block text-xs muted">
          اسلاگ انگلیسی (فقط حروف کوچک، عدد و -)
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
          دسته والد
          <select
            className="input mt-1"
            value={catForm.parent_id}
            onChange={(e) => setCatForm({ ...catForm, parent_id: e.target.value })}
          >
            <option value="">بدون والد (سردسته اصلی)</option>
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
            وضعیت
            <select
              className="input mt-1"
              value={catForm.status}
              onChange={(e) => setCatForm({ ...catForm, status: e.target.value })}
            >
              <option value="ACTIVE">فعال</option>
              <option value="INACTIVE">غیرفعال</option>
            </select>
          </label>
          <label className="text-xs muted">
            ترتیب نمایش
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
          className="btn-yellow w-full flex items-center justify-center gap-2"
        >
          <Plus size={16} /> {editingCat ? 'ذخیره تغییرات' : 'ساخت دسته‌بندی'}
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
            بازگشت به حالت جدید
          </button>
        )}
      </form>

      <div className="space-y-2.5" aria-label="درخت دسته‌بندی‌ها">
        <div className="text-xs muted mb-1">
          برای مشاهده یا مدیریت زیردسته‌ها، روی سردسته کلیک کنید تا باز شود.
        </div>
        {categoryTree.length === 0 ? (
          <div className="card rounded-2xl p-10 text-center muted">دسته‌ای ثبت نشده است.</div>
        ) : (
          categoryTree.map((root) => renderAdminCatNode(root, 0))
        )}
      </div>
    </div>
  );
}

export default CategoriesPage;
