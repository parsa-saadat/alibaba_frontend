import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Share2 } from 'lucide-react';
import { toast } from 'react-toastify';

function ShareButtonsComponent({ title }) {
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success(translateText("لینک محصول کپی شد"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="btn-ghost !p-3"
      title={translateText("اشتراک‌گذاری {{v0}}", {v0: (title || 'محصول')})}
      aria-label={translateText("اشتراک‌گذاری")}
    >
      <Share2 size={18} />
    </button>
  );
}

export default ShareButtonsComponent;
