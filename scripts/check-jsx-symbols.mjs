/*
 * بازرس نمادهای JSX: هر شناسه‌ای که به‌صورت <Component ...> استفاده شده باید
 * یا import شده باشد، یا در همان فایل تعریف شده باشد، یا یک عنصر DOM/HTML
 * شناخته‌شده باشد. این دقیقاً همان خانواده باگی را می‌گیرد که باعث سقوط
 * /account/messages شد (MessageSquare و ChatInboxEmpty بدون import).
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || 'src';
const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(jsx|tsx)$/.test(entry.name)) files.push(full);
  }
})(root);

const NATIVE = new Set([
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'big',
  'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed',
  'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head',
  'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend',
  'li', 'link', 'main', 'map', 'mark', 'menu', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol',
  'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's',
  'samp', 'script', 'section', 'select', 'slot', 'small', 'source', 'span', 'strong', 'style',
  'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead',
  'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr',
]);

const problems = [];

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  // کامنت‌ها بیرون می‌روند تا متن توضیحات (مثل `<API>/storage/<id>`) گرفته نشود
  const text = raw.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

  // 1) هر چیزی که با import آمده
  const imported = new Set();
  const addImport = (name) => {
    if (name) imported.add(name);
  };
  for (const m of text.matchAll(/import\s+(?:([\w$]+)\s*,\s*)?(?:\{([^}]*)\}|\*\s+as\s+([\w$]+)|([\w$]+))?\s*from\s*['"][^'"]+['"]/g)) {
    if (m[1]) addImport(m[1]);
    if (m[4]) addImport(m[4]);
    if (m[3]) addImport(m[3]);
    if (m[2]) {
      for (const part of m[2].split(',')) {
        const name = part.trim();
        if (!name) continue;
        const as = name.split(/\s+as\s+/);
        addImport((as[1] || as[0]).trim());
      }
    }
  }

  // 2) تعریف‌های محلی (const/function/class/let/var)، پارامترها و نام‌های
  //    گرفته‌شده از destructuring پراپ‌ها ({ icon: Icon } → Icon)
  const declared = new Set();
  for (const m of text.matchAll(/(?:const|let|var|function|class)\s+([\w$]+)/g)) declared.add(m[1]);
  for (const m of text.matchAll(/\(([^)]*)\)\s*=>/g)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/[\s:=?]/)[0].replace(/[{}\[\]().]/g, '');
      if (name) declared.add(name);
    }
  }
  // { a, b: Local, c = 1 } داخل هر پرانتز یا آرگومان
  for (const m of text.matchAll(/\{([^{}]*)\}\s*=\s*[a-z]/g)) {
    for (const part of m[1].split(',')) {
      const token = part.trim();
      if (!token) continue;
      const alias = token.split(':')[1] || token.split('=')[0];
      const name = (alias || '').trim().replace(/[{}\[\]().]/g, '');
      if (name && /^[A-Z_$]/.test(name)) declared.add(name);
    }
  }
  // الگوی رایج این کدبیس: ({ icon: Icon, ... }) → Icon محلی است
  for (const m of text.matchAll(/\b[a-z][\w$]*\s*:\s*([A-Z][\w$]*)\b/g)) declared.add(m[1]);

  // 3) استفاده‌های JSX: <Name با پیشوند مجازِ جای‌گاه JSX و ادامه‌ی فاصله/ / >
  const used = new Set();
  for (const m of text.matchAll(/(^|[\s{(>}\[])<([A-Z][\w$.]*)(?=[\s/>])/g)) used.add(m[2].split('.')[0]);

  for (const name of used) {
    if (NATIVE.has(name.toLowerCase())) continue;
    if (imported.has(name) || declared.has(name)) continue;
    problems.push({ file, name });
  }

}

if (problems.length) {
  console.error(`FAIL: ${problems.length} undefined JSX component(s)`);
  for (const p of problems) console.error(`  ${p.file} -> <${p.name}>`);
  process.exitCode = 1;
} else {
  console.log(`PASS: every JSX component in ${files.length} file(s) is imported or declared`);
}
