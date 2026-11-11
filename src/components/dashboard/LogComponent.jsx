import React from 'react';
import { formatDateTime } from '../../utils/helpers/format';

function LogComponent({ log }) {
  return (
    <div className="card2 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
      <div className="min-w-0">
        <div className="font-bold truncate">{log?.title || log?.message || 'رویداد سیستم'}</div>
        {log?.subtitle && <div className="muted truncate mt-0.5">{log.subtitle}</div>}
      </div>
      <span className="muted shrink-0">{formatDateTime(log?.created_at || new Date())}</span>
    </div>
  );
}

export default LogComponent;
