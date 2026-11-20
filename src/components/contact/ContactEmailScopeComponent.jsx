import React from 'react';
import { Mail, ArrowUpRight } from 'lucide-react';
import { t } from '../../i18n/runtime.js';
import { SUPPORT_EMAIL, INFO_EMAIL, emailHref } from '../../config/contact';

const topics = [
  { key: 'v20.login', email: SUPPORT_EMAIL },
  { key: 'v20.errors', email: SUPPORT_EMAIL },
  { key: 'v20.suggestions', email: INFO_EMAIL },
];

export default function ContactEmailScopeComponent() {
  return (
    <aside data-testid="email-scope" className="card rounded-3xl p-5 min-w-0">
      <h3 className="flex items-center gap-2 text-sm font-black">
        <Mail size={17} className="text-yellow shrink-0" />
        {t('v20.scope')}
      </h3>
      <p className="text-[11px] muted leading-6 mt-2">{t('v21.scopeHint')}</p>
      <ul className="mt-4 space-y-2">
        {topics.map(({ key, email }) => (
          <li key={key}>
            <a
              href={emailHref(email, t(key))}
              className="group flex items-center justify-between gap-2 rounded-2xl border border-theme px-3 py-3 hover:bg-[var(--card2)] transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-xs font-bold leading-6">{t(key)}</span>
                <span className="block text-xs muted break-all mt-1" dir="ltr">
                  {email}
                </span>
              </span>
              <ArrowUpRight size={15} className="text-yellow shrink-0 logical-icon" />
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
