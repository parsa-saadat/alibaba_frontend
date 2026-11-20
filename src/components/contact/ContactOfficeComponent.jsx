import React, { useState } from 'react';
import { Mail, Copy, Check, Send, Monitor, MessageSquareText } from 'lucide-react';
import { toast } from 'react-toastify';
import { t } from '../../i18n/runtime.js';
import { SUPPORT_EMAIL, INFO_EMAIL, emailHref } from '../../config/contact';
import ContactEmailScopeComponent from './ContactEmailScopeComponent';

const channels = [
  {
    id: 'support',
    title: 'v21.supportTitle',
    desc: 'v21.supportDesc',
    email: SUPPORT_EMAIL,
    icon: Monitor,
  },
  {
    id: 'info',
    title: 'v21.infoTitle',
    desc: 'v21.infoDesc',
    email: INFO_EMAIL,
    icon: MessageSquareText,
  },
];

function EmailCard({ channel }) {
  const [copied, setCopied] = useState(false);
  const Icon = channel.icon;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(channel.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error(t('امکان کپی خودکار نیست، مقدار را دستی انتخاب کنید.'));
    }
  };
  return (
    <article
      data-testid={`email-card-${channel.id}`}
      className="flex flex-col min-w-0 rounded-3xl border border-theme p-4 sm:p-5 gap-4"
      style={{ background: 'var(--card)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <span
          className="grid h-11 w-11 place-items-center rounded-2xl shrink-0"
          style={{ background: 'rgba(255,214,10,0.14)', color: 'var(--accent-text)' }}
        >
          <Icon size={21} />
        </span>
        <span className="text-[10px] font-black tracking-widest uppercase muted" dir="ltr">
          {channel.id}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-black text-sm leading-7">{t(channel.title)}</h3>
        <p className="text-xs muted leading-7 mt-2">{t(channel.desc)}</p>
      </div>
      <div
        className="flex items-center justify-between gap-2 rounded-2xl px-3 py-3"
        style={{ background: 'var(--card2)' }}
      >
        <a
          href={emailHref(channel.email)}
          className="text-sm font-black break-all hover-yellow"
          dir="ltr"
        >
          {channel.email}
        </a>
        <button
          type="button"
          onClick={copy}
          className="btn-ghost !p-2 shrink-0"
          title={t(copied ? 'v21.emailCopied' : 'v20.copyEmail')}
          aria-label={`${t('v20.copyEmail')} ${channel.email}`}
        >
          {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
        </button>
        <span role="status" className="sr-only">
          {copied ? t('v21.emailCopied') : ''}
        </span>
      </div>
      <a
        href={emailHref(channel.email, t(channel.title))}
        className="btn-yellow w-full inline-flex items-center justify-center gap-2 text-xs !py-3"
      >
        <Send size={15} />
        {t('v21.writeEmail')}
      </a>
    </article>
  );
}

export default function ContactOfficeComponent() {
  return (
    <div data-testid="contact-email-hub" className="grid items-start gap-4 lg:grid-cols-3">
      <section className="card rounded-3xl p-4 sm:p-6 min-w-0 lg:col-span-2">
        <header className="flex items-start gap-3 mb-5">
          <span
            className="grid h-11 w-11 place-items-center rounded-2xl shrink-0"
            style={{ background: 'var(--navy-deep)', color: 'var(--primary-color)' }}
          >
            <Mail size={21} />
          </span>
          <div className="min-w-0">
            <h2 className="font-black text-base leading-7">{t('v21.emailGuide')}</h2>
            <p className="text-xs muted leading-7 mt-1">{t('v21.emailGuideDesc')}</p>
          </div>
        </header>
        <div className="grid gap-3 sm:grid-cols-2">
          {channels.map((channel) => (
            <EmailCard key={channel.id} channel={channel} />
          ))}
        </div>
        <p className="mt-4 text-[11px] muted leading-6">{t('b2b.emailNote')}</p>
      </section>
      <ContactEmailScopeComponent />
    </div>
  );
}
