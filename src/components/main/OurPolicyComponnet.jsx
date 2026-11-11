import React from 'react';
import { Link } from 'react-router-dom';
import { BadgePercent } from 'lucide-react';

function OurPolicyComponent() {
  return (
    <section className="mt-8 card rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4 justify-between">
      <div className="flex items-center gap-3">
        <BadgePercent size={30} className="text-yellow shrink-0" />
        <div>
          <div className="font-black">فروشنده شوید و بفروشید</div>
          <div className="text-sm muted">
            درخواست فروشندگی ثبت کنید، پلن انتخاب کنید و فروشگاه خود را بسازید.
          </div>
        </div>
      </div>
      <Link to="/profile" className="btn-yellow shrink-0">
        درخواست فروشندگی
      </Link>
    </section>
  );
}

export default OurPolicyComponent;
