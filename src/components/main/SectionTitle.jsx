import React from 'react';

function SectionTitle({ children, id }) {
  return (
    <div id={id} className="flex items-center justify-center gap-4 py-6">
      <span className="h-px w-12 sm:w-32" style={{ background: 'var(--border)' }} />
      <h2 className="text-base sm:text-lg font-semibold muted">{children}</h2>
      <span className="h-px w-12 sm:w-32" style={{ background: 'var(--border)' }} />
    </div>
  );
}

export default SectionTitle;