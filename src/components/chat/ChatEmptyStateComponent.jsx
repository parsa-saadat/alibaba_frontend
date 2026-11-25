import React from 'react';
import { t as translateText } from '../../i18n/runtime.js';
import { MessagesSquare, MessageSquareOff, Store } from 'lucide-react';

/*
 * حالت خالی مشترک گفتگوها: نشانِ دایره‌ای نرم، عنوان، توضیح و یک فراخوان
 * اختیاری. هم در ستون فهرست و هم در ستون رشته استفاده می‌شود تا «خالی بودن»
 * مثل صفحه‌ی شکسته به نظر نرسد.
 *
 * tone:
 *   brand  → برای دعوت به شروع گفتگو (دکمهٔ اصلی)
 *   quiet  → برای انتظارِ پیام (بدون دکمه)
 */
function ChatEmptyStateComponent({
  icon: Icon,
  title,
  text,
  action,
  secondary,
  compact = false,
  tone = 'quiet',
}) {
  return (
    <div
      className={`chat-empty-state${compact ? ' is-compact' : ''}${tone === 'brand' ? ' is-brand' : ''}`}
      role="status"
      aria-live="polite"
    >
      {Icon ? (
        <span className="chat-empty-medal" aria-hidden="true">
          <Icon size={compact ? 20 : 26} />
        </span>
      ) : null}

      <b className="chat-empty-title">{title}</b>

      {text ? <p className="chat-empty-text">{text}</p> : null}

      {action || secondary ? (
        <div className="chat-empty-actions">
          {action ? <div className="chat-empty-action">{action}</div> : null}
          {secondary ? <span className="chat-empty-secondary">{secondary}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

/* دو حالت پرکاربرد، تا متن و آیکن در فهرست و پنل فروشنده یکسان بماند */
export function ChatInboxEmpty({ as = 'buyer', onBrowse, error = '' }) {
  if (error) {
    return (
      <ChatEmptyStateComponent
        icon={MessageSquareOff}
        title={translateText('chat.inboxLoadFailed')}
        text={error}
      />
    );
  }

  const seller = as === 'seller';
  return (
    <ChatEmptyStateComponent
      icon={seller ? Store : MessagesSquare}
      title={translateText(seller ? 'chat.emptySellerTitle' : 'chat.emptyBuyerTitle')}
      text={translateText(seller ? 'chat.noConversationsSeller' : 'chat.noConversationsBuyer')}
      tone="brand"
      action={
        seller || !onBrowse ? null : (
          <button type="button" className="btn-primary" onClick={onBrowse}>
            {translateText('account.startSourcing')}
          </button>
        )
      }
      secondary={seller ? translateText('chat.emptySellerHint') : null}
    />
  );
}

export default ChatEmptyStateComponent;
