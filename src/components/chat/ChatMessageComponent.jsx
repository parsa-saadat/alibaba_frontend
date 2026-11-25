import React, { useState } from 'react';
import { t as translateText } from '../../i18n/runtime.js';
import { Check, CheckCheck, Pencil, Trash2, X } from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import ChatPinComponent from './ChatPinComponent';
import { formatTime } from '../../utils/helpers/chat-format';

/*
 * حباب پیام. ویرایش و حذف فقط برای پیام خودِ فرستنده نشان داده می‌شود؛
 * پیام حذف‌شده در گفتگو می‌ماند تا رشتهٔ گفتگو از هم نپاشد.
 */
function ChatMessageComponent({
  message,
  mine,
  counterpartName = '',
  onEdit,
  onDelete,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body || '');
  const [saving,setSaving] = useState(false);

  const commit = async () => {
    if(saving)return;
    const value = draft.trim();
    if (!value || value === message.body) return setEditing(false);
    setSaving(true);
    try {
      const ok = await onEdit?.(message._id, value);
      if(ok !== false)setEditing(false);
    } finally {setSaving(false);}
  };

  const deleted = message.kind === 'deleted';
  const readByBoth = Array.isArray(message.read_by) && message.read_by.length > 1;

  return (
    <div className={`chat-row${mine ? ' is-mine' : ''}`}>
      <span className={`chat-avatar${mine ? ' is-mine' : ''}`} aria-hidden>{mine ? translateText('chat.youInitial') : (counterpartName || '?').slice(0, 1)}</span>

      <div className="chat-bubble-wrap">
        {!mine && <span className="chat-sender">{counterpartName || translateText('chat.seller')}</span>}

        {deleted ? (
          <div className="chat-bubble is-deleted">{translateText('chat.deletedMessage')}</div>
        ) : editing ? (
          <div className="chat-bubble is-editing">
            <textarea
              className="input chat-edit-input"
              rows={2}
              value={draft}
              maxLength={4000}
              disabled={saving}
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  commit();
                }
                if (event.key === 'Escape') {event.preventDefault();event.stopPropagation();setEditing(false);}
              }}
            />
            <div className="chat-edit-actions">
              <button type="button" className="review-button primary" disabled={saving} onClick={commit}>
                {translateText('chat.saveEdit')}
              </button>
              <button
                type="button"
                className="review-button secondary icon icon-control"
                aria-label={translateText('chat.cancelEdit')}
                disabled={saving}
                onClick={() => {
                  setDraft(message.body || '');
                  setEditing(false);
                }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="chat-bubble">
            {message.pin && <ChatPinComponent pin={message.pin} compact />}
            {message.body ? <p className="chat-body">{message.body}</p> : null}

            {message.images?.length > 0 && (
              <div className={`chat-images count-${Math.min(message.images.length, 4)}`}>
                {message.images.map((file) => (
                  <StorageImageComponent
                    key={typeof file === 'string' ? file : file?._id}
                    file={file}
                    alt={translateText('chat.imageAlt')}
                    className="chat-image"
                  />
                ))}
              </div>
            )}

          </div>
        )}

        <div className="chat-meta">
          <span dir="ltr">{formatTime(message.created_at)}</span>
          {message.edited_at && !deleted ? <span>· {translateText('chat.edited')}</span> : null}
          {mine && !deleted ? (
            readByBoth ? (
              <CheckCheck size={12} className="chat-read is-read" aria-label={translateText('chat.readReceipt')} />
            ) : (
              <Check size={12} className="chat-read" aria-label={translateText('chat.sentReceipt')} />
            )
          ) : null}

          {!deleted && mine ? (
            <span className="chat-actions">
              <button
                type="button"
                className="chat-action"
                aria-label={translateText('chat.editMessage')}
                title={translateText('chat.editMessage')}
                onClick={() => {setDraft(message.body || '');setEditing(true);}}
              >
                <Pencil size={12} />
              </button>
              <button
                type="button"
                className="chat-action is-danger"
                aria-label={translateText('chat.deleteMessage')}
                title={translateText('chat.deleteMessage')}
                onClick={() => onDelete?.(message._id)}
              >
                <Trash2 size={12} />
              </button>
            </span>
          ) : null}
        </div>
      </div>

    </div>
  );
}

export default ChatMessageComponent;
