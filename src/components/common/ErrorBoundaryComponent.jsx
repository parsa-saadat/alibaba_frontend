import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

/*
 * مرز خطا: اگر رندر یک صفحه خطا بدهد، به‌جای صفحه‌ی سفید یک کارت روشن با
 * متن خطا و دکمه‌ی «تلاش دوباره» نشان داده می‌شود.
 * `resetKey` هر بار که مسیر عوض شود تغییر می‌کند تا خطای صفحه‌ی قبلی باقی نماند.
 */
class ErrorBoundaryComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    /* برای دیدن جزئیات در کنسول مرورگر */
    console.error(translateText("[GeoCala] خطای رندر:"), error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  reset() {
    this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    /* اگر کاربر fallback داده باشد (مثلاً ویرایشگر متن ساده)، همان را نشان بده */
    if (this.props.fallback) return this.props.fallback;

    const message = String(error?.message || error || translateText("خطای نامشخص"));

    return (
      <div className="mx-auto max-w-2xl px-4 py-14">
        <div className="card rounded-3xl p-6 text-center sm:p-8">
          <span
            className="mx-auto grid h-12 w-12 place-items-center rounded-2xl"
            style={{ background: 'rgba(229,57,53,0.14)', color: '#e53935' }}
          >
            <AlertTriangle size={22} />
          </span>

          <h1 className="mt-4 text-base font-black sm:text-lg">{translateText("این بخش بالا نیامد")}</h1>
          <p className="mx-auto mt-2 max-w-md text-xs leading-6 muted">{translateText("یک خطای غیرمنتظره رخ داد و برای اینکه بقیه‌ی سایت سالم بماند، این صفحه متوقف شد. با «تلاش دوباره» یا رفتن به صفحه‌ی اصلی معمولاً حل می‌شود. ")}</p>

          <div
            className="mt-4 overflow-x-auto rounded-xl px-3 py-2 text-start text-[11px] leading-6"
            style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}
            dir="ltr"
          >
            <code className="font-mono">{message}</code>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={this.reset} className="btn-primary inline-flex items-center gap-1.5 !py-2 text-xs">
              <RotateCcw size={14} />{translateText("تلاش دوباره ")}</button>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/';
              }}
              className="btn-ghost inline-flex items-center gap-1.5 !py-2 text-xs"
            >
              <Home size={14} />{translateText("صفحه‌ی اصلی ")}</a>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-ghost !py-2 text-xs"
            >{translateText("بارگذاری مجدد سایت ")}</button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundaryComponent;
