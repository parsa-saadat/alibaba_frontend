import React, { useEffect, useRef, useState } from 'react';
import { t as translateText } from '../../i18n/runtime.js';
import { Image as ImageIcon, Loader2, Send, X } from 'lucide-react';
import StorageImageComponent from '../common/StorageImageComponent';
import ChatPinComponent from './ChatPinComponent';
import { uploadChatImages } from '../../services/chatApi';

const MAX_IMAGES = 4;

/*
 * کادر نوشتن پیام: متن + حداکثر چهار تصویر + پین محصول/فروشگاه.
 * Enter ارسال می‌کند و Shift+Enter خط جدید می‌سازد.
 */
function ChatComposerComponent({
  pin,
  onRemovePin,
  onSend,
  editing,
  onCancelEdit,
  disabled = false,
  disabledReason = '',
  autoFocus = false,
  onDraftChange,
}) {
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!editing) return;
    setText(editing.body || '');
    inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const pickImages = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    if (images.length + files.length > MAX_IMAGES) {
      setError(translateText('chat.tooManyImages', { max: String(MAX_IMAGES) }));
      return;
    }
    setUploading(true);
    setError('');
    try {
      const body = await uploadChatImages(files);
      const ids = (Array.isArray(body) ? body : []).map((item) => item._id).filter(Boolean);
      if (!ids.length) throw new Error('empty');
      setImages((prev) => [...prev, ...ids].slice(0, MAX_IMAGES));
    } catch {
      setError(translateText('chat.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    const body = text.trim();
    if (disabled || uploading) return;
    if (!body && !images.length) return;

    if (editing) {
      if (!body) return;
      onCancelEdit?.();
      onSend?.({ body, editing: editing._id });
      setText('');
      return;
    }

    onSend?.({ body, images, pin: pin?.raw || null });
    setText('');
    setImages([]);
  };

  return (
    <div className="chat-composer">
      {editing ? (
        <div className="chat-editing-bar">
          <span className="chat-editing-label">{translateText('chat.editing')}</span>
          <button
            type="button"
            className="chat-action"
            aria-label={translateText('chat.cancelEdit')}
            onClick={() => {
              setText('');
              onCancelEdit?.();
            }}
          >
            <X size={14} />
          </button>
        </div>
      ) : pin ? (
        <div className="chat-composer-pin">
          <ChatPinComponent pin={pin} onRemove={onRemovePin} compact />
        </div>
      ) : null}

      {images.length > 0 && (
        <div className="chat-attachments">
          {images.map((id) => (
            <div key={id} className="chat-attachment">
              <StorageImageComponent file={id} alt={translateText('chat.imageAlt')} compact className="h-full w-full object-cover" />
              <button
                type="button"
                className="chat-attachment-remove"
                aria-label={translateText('chat.removeImage')}
                onClick={() => setImages((prev) => prev.filter((item) => item !== id))}
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="chat-composer-error" role="alert">{error}</p>}

      <div className="chat-composer-row">
        <button
          type="button"
          className="chat-tool"
          aria-label={translateText('chat.attachImage')}
          title={translateText('chat.attachImage')}
          disabled={disabled || uploading || images.length >= MAX_IMAGES}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={pickImages}
        />

        <textarea
          ref={inputRef}
          className="input chat-textarea"
          rows={1}
          maxLength={4000}
          value={text}
          disabled={disabled}
          placeholder={disabled ? disabledReason : translateText('chat.placeholder')}
          aria-label={translateText('chat.placeholder')}
          onChange={(event) => {
            setText(event.target.value);
            onDraftChange?.(event);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />

        <button
          type="submit"
          className="chat-send"
          disabled={disabled || uploading || (!text.trim() && !images.length)}
          onClick={submit}
          aria-label={editing ? translateText('chat.saveEdit') : translateText('chat.send')}
          title={editing ? translateText('chat.saveEdit') : translateText('chat.send')}
        >
          <Send size={16} />
          <span className="chat-send-label">{editing ? translateText('chat.saveEdit') : translateText('chat.send')}</span>
        </button>
      </div>

    </div>
  );
}

export default ChatComposerComponent;
