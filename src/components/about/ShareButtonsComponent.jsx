import React from 'react';
import { Share2 } from 'lucide-react';
import { toast } from 'react-toastify';

function ShareButtonsComponent({ title }) {
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('لینک محصول کپی شد');
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="btn-ghost !p-3"
      title={`اشتراک‌گذاری ${title || 'محصول'}`}
      aria-label="اشتراک‌گذاری"
    >
      <Share2 size={18} />
    </button>
  );
}

export default ShareButtonsComponent;
