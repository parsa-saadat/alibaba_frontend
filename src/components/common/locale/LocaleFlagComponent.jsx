import { useId } from 'react';
export default function LocaleFlag({ code }) {
  const id = useId();
  return (
    <svg className="locale-flag" viewBox="0 0 30 22" aria-hidden="true">
      <defs>
        <clipPath id={id}>
          <rect width="30" height="22" rx="4" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {code === 'en' ? (
          <>
            <rect width="30" height="22" fill="#fff" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <rect key={i} y={i * 3.38} width="30" height="1.7" fill="#c93b4c" />
            ))}
            <rect width="13" height="12" fill="#294987" />
            {[0, 1, 2].flatMap((y) =>
              [0, 1, 2].map((x) => (
                <circle key={`${y}-${x}`} cx={2.5 + x * 4} cy={2.5 + y * 3.4} r=".8" fill="white" />
              )),
            )}
          </>
        ) : null}
        {code === 'fa' ? (
          <>
            <rect width="30" height="22" fill="#fff" />
            <rect width="30" height="7.3" fill="#249f68" />
            <rect y="14.7" width="30" height="7.3" fill="#dc4851" />
            <path
              d="M15 8v6m-3-5q-2 5 3 5q5 0 3-5m-5 1q2 3 4 0"
              fill="none"
              stroke="#dc4851"
              strokeWidth="1"
            />
          </>
        ) : null}
        {code === 'ar' ? (
          <>
            <rect width="30" height="22" fill="#fff" />
            <rect width="30" height="7.3" fill="#269568" />
            <rect y="14.7" width="30" height="7.3" fill="#202733" />
            <rect width="8" height="22" fill="#e74452" />
          </>
        ) : null}
        {code === 'tr' ? (
          <>
            <rect width="30" height="22" fill="#df384c" />
            <circle cx="13" cy="11" r="6" fill="white" />
            <circle cx="15" cy="10" r="4.8" fill="#df384c" />
            <path
              d="m21 8 .8 2.1 2.2.1-1.7 1.4.6 2.2-1.9-1.2-1.9 1.2.6-2.2-1.7-1.4 2.2-.1z"
              fill="white"
            />
          </>
        ) : null}
      </g>
    </svg>
  );
}
