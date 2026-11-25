import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { BadgePercent } from 'lucide-react';

function OurPolicyComponent() {
  return (
    <section data-testid="seller-invitation" className="pb-10">
      <div className="max-w-[1440px] mx-auto px-4">
        <div
          className="mt-4 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4 justify-between text-white"
          style={{
            background: 'linear-gradient(135deg,#242424 0%,#343434 55%,#292929 100%)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            <BadgePercent
              size={30}
              className="shrink-0"
              style={{ color: 'var(--primary-color)' }}
            />
            <div>
              <div className="font-black">{translateText('فروشنده شوید و بفروشید')}</div>
              <div className="text-sm text-gray-300">
                {translateText(
                  'درخواست فروشندگی ثبت کنید، پلن انتخاب کنید و فروشگاه خود را بسازید. ',
                )}
              </div>
            </div>
          </div>
          <Link to="/account" className="btn-primary shrink-0">
            {translateText('درخواست فروشندگی ')}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default OurPolicyComponent;
