import React from 'react';
import { Link } from 'react-router-dom';
import { BadgePercent, Truck, ShieldCheck, Undo2, Headset } from 'lucide-react';

const perks = [
  { icon: Truck, title: 'ارسال سریع', desc: 'به سراسر کشور' },
  { icon: ShieldCheck, title: 'ضمانت اصالت', desc: 'کالای اصل و سالم' },
  { icon: Undo2, title: 'بازگشت آسان', desc: 'مرجوعی تا ۷ روز' },
  { icon: Headset, title: 'پشتیبانی', desc: 'همیشه در کنار شما' },
];

function OurPolicyComponent() {
  return (
    <section className="pb-10">
      <div className="max-w-[1440px] mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {perks.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card rounded-2xl p-4 flex items-center gap-3">
              <Icon size={28} className="text-yellow shrink-0" />
              <div>
                <div className="font-black text-sm">{title}</div>
                <div className="text-xs muted">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-4 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-4 justify-between text-white"
          style={{
            background: 'linear-gradient(135deg,#0a1736 0%,#162e66 55%,#0f2150 100%)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3">
            <BadgePercent size={30} className="shrink-0" style={{ color: 'var(--primary-color)' }} />
            <div>
              <div className="font-black">فروشنده شوید و بفروشید</div>
              <div className="text-sm text-gray-300">
                درخواست فروشندگی ثبت کنید، پلن انتخاب کنید و فروشگاه خود را بسازید.
              </div>
            </div>
          </div>
          <Link to="/profile" className="btn-yellow shrink-0">
            درخواست فروشندگی
          </Link>
        </div>
      </div>
    </section>
  );
}

export default OurPolicyComponent;