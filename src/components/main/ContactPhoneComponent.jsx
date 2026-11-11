import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const CONTACTS = [
  { icon: Phone, title: 'تلفن پشتیبانی', value: '۰۲۱-۹۱۰۰۹۱۰۰' },
  { icon: Mail, title: 'ایمیل', value: 'support@alibazar.ir' },
  { icon: MapPin, title: 'نشانی', value: 'تهران، خیابان ولیعصر، برج بازار' },
];

function ContactPhoneComponent() {
  return (
    <div className="grid md:grid-cols-3 gap-4 mt-8">
      {CONTACTS.map((c) => (
        <div key={c.title} className="card rounded-3xl p-6 text-center">
          <c.icon size={26} className="mx-auto mb-2 text-yellow" />
          <div className="font-black">{c.title}</div>
          <div className="text-sm muted mt-1">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

export default ContactPhoneComponent;
