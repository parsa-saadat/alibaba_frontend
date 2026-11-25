import { localizedField } from '../../i18n/content-fields';
import { language } from '../../i18n/runtime';
import { t as translateText } from '../../i18n/runtime.js';
import axios from 'axios';
import { getBody, getList, getId } from './response.js';

const API = import.meta.env?.VITE_APP_API_URL || import.meta.env?.VITE_API_URL || '/api';

export const flattenCategories = (nodes, parentId = '', seen = new Set()) => {
  if (!Array.isArray(nodes)) return [];
  return nodes.flatMap((node) => {
    const id = getId(node);
    if (!id || seen.has(id)) return [];
    seen.add(id);
    const category = {
      ...node,
      name: localizedField(node.translations?.[language]?.name ?? node.name) || '',
      _id: id,
      parent_id: parentId || getId(node.parent_id ?? node.parent),
    };
    return [category, ...flattenCategories(node.children, id, seen)];
  });
};

export const buildCategoryTree = (flatCategories = []) => {
  const byId = new Map();
  for (const cat of flatCategories) {
    const id = getId(cat);
    if (!id) continue;
    byId.set(id, { ...cat, _id: id, parent_id: getId(cat.parent_id ?? cat.parent), children: [] });
  }
  const roots = [];
  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
};

export const fetchCategories = async (signal) => {
  const categories = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await axios.get(`${API}/category`, {
      params: { page, limit: 100 },
      signal,
      timeout: 15000,
    });
    if (response.data?.success === false) {
      throw new Error(response.data.message || translateText("دریافت دسته‌بندی‌ها ناموفق بود."));
    }
    const rows = getList(response);
    categories.push(...rows);
    totalPages = Math.max(1, Number(getBody(response)?.totalPages) || 1);
    if (!rows.length) break;
    page += 1;
  } while (page <= totalPages);
  return flattenCategories(categories);
};

/* شناسه‌ی همه‌ی زیردسته‌های یک دسته (برای «محصولات مرتبط» و فیلترها) */
export const descendantIds = (flatCategories = [], rootId = '') => {
  const root = String(rootId || '');
  if (!root) return [];

  const childrenOf = new Map();
  for (const cat of Array.isArray(flatCategories) ? flatCategories : []) {
    const parent = String(getId(cat?.parent_id ?? cat?.parent) || '');
    if (!parent) continue;
    if (!childrenOf.has(parent)) childrenOf.set(parent, []);
    childrenOf.get(parent).push(String(getId(cat)));
  }

  const out = [];
  const stack = [...(childrenOf.get(root) || [])];
  const seen = new Set();
  while (stack.length) {
    const id = stack.pop();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    stack.push(...(childrenOf.get(id) || []));
  }
  return out;
};
