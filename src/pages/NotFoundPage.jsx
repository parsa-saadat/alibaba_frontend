import { t as translateText } from '../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <div className="text-7xl font-black text-yellow">{translateText("۴۰۴")}</div>
      <p className="muted mt-3">{translateText("صفحه‌ای که دنبالش بودید پیدا نشد.")}</p>
      <Link to="/" className="btn-yellow inline-block mt-6">{translateText("بازگشت به خانه ")}</Link>
    </div>
  );
}

export default NotFoundPage;
