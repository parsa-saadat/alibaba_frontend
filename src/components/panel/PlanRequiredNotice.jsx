import { t as translateText } from '../../i18n/runtime.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';

/* پیام «پلن فعال لازم است» برای ساخت محصول/فروشگاه */
function PlanRequiredNotice({ text, className = '' }) {
  return (
    <div className={`card rounded-3xl p-8 max-w-lg mx-auto text-center space-y-4 ${className}`}>
      <CreditCard size={36} className="mx-auto text-accent" />
      <h2 className="font-black text-lg">{translateText("برای ساخت محصول پلن فعال لازم است")}</h2>
      <p className="text-sm muted leading-7">
        {text || translateText("پلن فروشندگی فعالی ندارید؛ ابتدا یک پلن تهیه کنید تا بتوانید محصول اضافه کنید.")}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link to="/seller/plans" className="btn-primary inline-block">{translateText("مشاهده و خرید پلن ")}</Link>
        <Link to="/seller/products" className="btn-ghost inline-block">{translateText("بازگشت به محصولات ")}</Link>
      </div>
    </div>
  );
}

export default PlanRequiredNotice;
