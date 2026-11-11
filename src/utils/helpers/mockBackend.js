import axios from 'axios';

const DEMO_CATEGORIES = [
  { _id: 'cat-digital', name: 'کالای دیجیتال', slug: 'digital-goods', parent_id: '', status: 'ACTIVE', sort_order: 1 },
  { _id: 'cat-mobile', name: 'گوشی موبایل و تبلت', slug: 'mobile-tablet', parent_id: 'cat-digital', status: 'ACTIVE', sort_order: 1 },
  { _id: 'cat-laptop', name: 'لپ‌تاپ و اولترابوک', slug: 'laptops', parent_id: 'cat-digital', status: 'ACTIVE', sort_order: 2 },
  { _id: 'cat-audio', name: 'هدفون و تجهیزات صوتی', slug: 'audio-gear', parent_id: 'cat-digital', status: 'ACTIVE', sort_order: 3 },
  { _id: 'cat-home', name: 'لوازم خانگی و آشپزخانه', slug: 'home-appliances', parent_id: '', status: 'ACTIVE', sort_order: 2 },
  { _id: 'cat-coffee', name: 'قهوه‌ساز و نوشیدنی‌ساز', slug: 'coffee-makers', parent_id: 'cat-home', status: 'ACTIVE', sort_order: 1 },
  { _id: 'cat-smart-home', name: 'خانه هوشمند', slug: 'smart-home', parent_id: 'cat-home', status: 'ACTIVE', sort_order: 2 },
  { _id: 'cat-fashion', name: 'مد، پوشاک و اکسسوری', slug: 'fashion-style', parent_id: '', status: 'ACTIVE', sort_order: 3 },
  { _id: 'cat-watch', name: 'ساعت هوشمند و کلاسیک', slug: 'watches', parent_id: 'cat-fashion', status: 'ACTIVE', sort_order: 1 },
  { _id: 'cat-tools', name: 'ابزارآلات و تجهیزات صنعتی', slug: 'industrial-tools', parent_id: '', status: 'ACTIVE', sort_order: 4 },
];

const DEMO_USERS = [
  {
    _id: 'user-admin-1',
    username: 'parsa_admin',
    firstname: 'پارسا',
    lastname: 'سعادت',
    phone: '09120000001',
    email: 'parsa@alibazar.ir',
    role: 'admin',
    is_seller: true,
  },
  {
    _id: 'user-seller-1',
    username: 'tehran_tech',
    firstname: 'امیرحسین',
    lastname: 'رضایی',
    phone: '09121112233',
    email: 'amir@tehrantech.ir',
    role: 'seller',
    is_seller: true,
  },
  {
    _id: 'user-seller-2',
    username: 'pars_appliance',
    firstname: 'سارا',
    lastname: 'محمدی',
    phone: '09123334455',
    email: 'sara@parsappliance.ir',
    role: 'seller',
    is_seller: true,
  },
  {
    _id: 'user-buyer-1',
    username: 'ali_karimi',
    firstname: 'علی',
    lastname: 'کریمی',
    phone: '09129998877',
    email: 'ali.karimi@gmail.com',
    role: 'user',
    is_seller: false,
  },
];

const DEMO_SELLERS = [
  {
    _id: 'user-seller-1',
    username: 'tehran_tech',
    phone: '09121112233',
    seller_type: 'institutional_seller',
    national_ID: '0012345678',
    birth_date: '1372/04/15',
    seller_approved_status: true,
    seller_active_status: 'ACTIVE',
    identity_image_id: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',
    identity_verification_image_id: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    address: {
      province: 'تهران',
      city: 'تهران',
      full_address: 'خیابان ولیعصر، تقاطع طالقانی، مجتمع تجاری نور، طبقه ۴، واحد ۴۱۲',
    },
    settlement_account: {
      card_number: '6037997512345678',
      sheba_number: 'IR820540102680020817909002',
      firstname_lastname: 'امیرحسین رضایی',
    },
    subscription_expires_at: new Date(Date.now() + 45 * 86400000).toISOString(),
  },
  {
    _id: 'user-seller-2',
    username: 'pars_appliance',
    phone: '09123334455',
    seller_type: 'Individual_seller',
    national_ID: '0078945612',
    birth_date: '1375/09/22',
    seller_approved_status: false,
    seller_active_status: 'INACTIVE',
    identity_image_id: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=600&q=80',
    identity_verification_image_id: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    address: {
      province: 'اصفهان',
      city: 'اصفهان',
      full_address: 'چهارباغ عباسی، مجتمع تجاری پارسیان، طبقه ۲',
    },
    settlement_account: {
      card_number: '6219861012345678',
      sheba_number: 'IR550560081180001234567001',
      firstname_lastname: 'سارا محمدی',
    },
  },
];

const DEMO_STORES = [
  {
    _id: 'store-1',
    name: 'تهران دیجیتال سنتر',
    description: 'مرکز تخصصی عرضه لپ‌تاپ، موبایل و گجت‌های هوشمند با گارانتی ۱۸ ماهه معتبر شرکتی و ارسال فوری.',
    status: 'ENABLE',
    user: 'user-seller-1',
    rating: 4.8,
    profile_image_id: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=400&q=80',
    banner_image_id: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    contact_info: {
      email: 'info@tehrandigital.ir',
      phone: '02188994411',
      address: 'تهران، خیابان ولیعصر، مجتمع تجاری نور',
    },
  },
  {
    _id: 'store-2',
    name: 'خانه مدرن پارس',
    description: 'نمایندگی رسمی لوازم خانگی، اسپرسوسازهای حرفه‌ای و تجهیزات آشپزخانه مدرن در ایران.',
    status: 'ENABLE',
    user: 'user-seller-2',
    rating: 4.7,
    profile_image_id: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=400&q=80',
    banner_image_id: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1200&q=80',
    contact_info: {
      email: 'sales@parshome.ir',
      phone: '03132225566',
      address: 'اصفهان، چهارباغ عباسی، مجتمع پارسیان',
    },
  },
  {
    _id: 'store-3',
    name: 'گالری ساعت و استایل آریا',
    description: 'عرضه‌کننده ساعت‌های هوشمند و کلاسیک اورجینال با ضمانت اصالت کالا و بسته‌بندی ویژه هدیه.',
    status: 'ENABLE',
    user: 'user-seller-1',
    rating: 4.9,
    profile_image_id: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
    banner_image_id: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
    contact_info: {
      email: 'contact@aryawatch.ir',
      phone: '02122334455',
      address: 'تهران، بلوار میرداماد، پاساژ پایتخت',
    },
  },
  {
    _id: 'store-4',
    name: 'ابزار دقیق البرز',
    description: 'تأمین‌کننده ابزارهای صنعتی، شارژی و تجهیزات مهندسی ساخت ایران و برندهای منتخب.',
    status: 'ENABLE',
    user: 'user-admin-1',
    rating: 4.6,
    profile_image_id: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
    banner_image_id: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
    contact_info: {
      email: 'order@alborztools.ir',
      phone: '02634448899',
      address: 'کرج، بلوار بهشتی، مجتمع صنعتی البرز',
    },
  },
];

const DEMO_PRODUCTS = [
  {
    _id: 'prod-1',
    name: 'لپ‌تاپ ۱۵.۶ اینچی ایسوس مدل VivoBook Pro 15 OLED پردازنده Core i7',
    brand: 'ASUS',
    category_id: 'cat-laptop',
    store_id: 'store-1',
    store_name: 'تهران دیجیتال سنتر',
    seller_id: 'user-seller-1',
    price: { amount: 645000000 },
    discount: {
      percentage: 14,
      expirationDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    },
    stock: 12,
    stock_status: 'IN_STOCK',
    visibility_status: 'PUBLIC',
    warranty: true,
    production: 1403,
    sold_count: 84,
    rating: 4.8,
    dimensions: {
      length: { value: 35.9, unit: 'CM' },
      width: { value: 23.5, unit: 'CM' },
      height: { value: 1.99, unit: 'CM' },
    },
    weight: { value: 1.8, unit: 'KG' },
    images_id: [
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      '### لپ‌تاپ حرفه‌ای ایسوس VivoBook Pro 15 OLED\n\nمجهز به نمایشگر خیره‌کننده **OLED 2.8K 120Hz**، پردازنده قدرتمند نسل جدید و کارت گرافیک مجزا مناسب برنامه‌نویسی، طراحی گرافیک و تدوین ویدیو.\n\n- **حافظه رم:** ۱۶ گیگابایت DDR5\n- **حافظه داخلی:** ۱ ترابایت SSD NVMe\n- **گارانتی:** ۱۸ ماه ضمانت شرکتی معتبر در سراسر کشور',
  },
  {
    _id: 'prod-2',
    name: 'هدفون بی‌سیم سونی مدل WH-1000XM5 با قابلیت حذف نویز هوشمند',
    brand: 'Sony',
    category_id: 'cat-audio',
    store_id: 'store-1',
    store_name: 'تهران دیجیتال سنتر',
    seller_id: 'user-seller-1',
    price: { amount: 198000000 },
    discount: {
      percentage: 20,
      expirationDate: new Date(Date.now() + 10 * 86400000).toISOString(),
    },
    stock: 25,
    stock_status: 'IN_STOCK',
    visibility_status: 'PUBLIC',
    warranty: true,
    production: 1403,
    sold_count: 142,
    rating: 4.9,
    dimensions: {
      length: { value: 20, unit: 'CM' },
      width: { value: 18, unit: 'CM' },
      height: { value: 8, unit: 'CM' },
    },
    weight: { value: 250, unit: 'G' },
    images_id: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      '### هدفون پرچم‌دار Sony WH-1000XM5\n\nبهترین عملکرد حذف نویز فعال (ANC) در کلاس جهانی به همراه باتری ۳۰ ساعته و شارژ فوق سریع.',
  },
  {
    _id: 'prod-3',
    name: 'اسپرسوساز حرفه‌ای مباشی مدل ECM2035 با فشار ۲۰ بار واقعی',
    brand: 'Mebashi',
    category_id: 'cat-coffee',
    store_id: 'store-2',
    store_name: 'خانه مدرن پارس',
    seller_id: 'user-seller-2',
    price: { amount: 115000000 },
    discount: {
      percentage: 18,
      expirationDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    },
    stock: 19,
    stock_status: 'IN_STOCK',
    visibility_status: 'PUBLIC',
    warranty: true,
    production: 1403,
    sold_count: 98,
    rating: 4.7,
    dimensions: {
      length: { value: 31, unit: 'CM' },
      width: { value: 26, unit: 'CM' },
      height: { value: 30, unit: 'CM' },
    },
    weight: { value: 4.2, unit: 'KG' },
    images_id: [
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      '### اسپرسوساز نیمه‌صنعتی مباشی\n\nپمپ ایتالیایی ۲۰ بار اولکا، بدنه استیل ضدزنگ و نازل بخار حرفه‌ای جهت تهیه کاپوچینو و لاته آرت.',
  },
  {
    _id: 'prod-4',
    name: 'ساعت هوشمند اولترا تیتانیوم ۴۹ میلی‌متری با بند اوشن و GPS دقیق',
    brand: 'AriaWatch',
    category_id: 'cat-watch',
    store_id: 'store-3',
    store_name: 'گالری ساعت و استایل آریا',
    seller_id: 'user-seller-1',
    price: { amount: 89000000 },
    discount: {
      percentage: 25,
      expirationDate: new Date(Date.now() + 12 * 86400000).toISOString(),
    },
    stock: 32,
    stock_status: 'IN_STOCK',
    visibility_status: 'PUBLIC',
    warranty: true,
    production: 1403,
    sold_count: 215,
    rating: 4.9,
    dimensions: {
      length: { value: 4.9, unit: 'CM' },
      width: { value: 4.4, unit: 'CM' },
      height: { value: 1.4, unit: 'CM' },
    },
    weight: { value: 61, unit: 'G' },
    images_id: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      '### ساعت هوشمند بدنه تیتانیوم\n\nمقاوم در برابر آب و ضربه، دارای سنسور پایش ضربان قلب، اکسیژن خون و مکالمه مستقیم بلوتوثی.',
  },
  {
    _id: 'prod-5',
    name: 'گوشی موبایل سامسونگ مدل Galaxy S24 Ultra دو سیم‌کارت ظرفیت ۲۵۶ گیگابایت',
    brand: 'Samsung',
    category_id: 'cat-mobile',
    store_id: 'store-1',
    store_name: 'تهران دیجیتال سنتر',
    seller_id: 'user-seller-1',
    price: { amount: 785000000 },
    discount: {
      percentage: 8,
      expirationDate: new Date(Date.now() + 9 * 86400000).toISOString(),
    },
    stock: 9,
    stock_status: 'IN_STOCK',
    visibility_status: 'PUBLIC',
    warranty: true,
    production: 1403,
    sold_count: 176,
    rating: 4.9,
    dimensions: {
      length: { value: 16.2, unit: 'CM' },
      width: { value: 7.9, unit: 'CM' },
      height: { value: 0.86, unit: 'CM' },
    },
    weight: { value: 232, unit: 'G' },
    images_id: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      '### پرچم‌دار سامسونگ Galaxy S24 Ultra\n\nفریم تیتانیومی، قلم هوشمند S-Pen، دوربین ۲۰۰ مگاپیکسلی و هوش مصنوعی Galaxy AI با رجیستری و کد فعال‌سازی همتا.',
  },
  {
    _id: 'prod-6',
    name: 'دریل پیچ‌گوشتی شارژی صنعتی ۱۸ ولت براش‌لس به همراه ۲ باتری لیتیومی',
    brand: 'AlborzPro',
    category_id: 'cat-tools',
    store_id: 'store-4',
    store_name: 'ابزار دقیق البرز',
    seller_id: 'user-admin-1',
    price: { amount: 64000000 },
    discount: {
      percentage: 15,
      expirationDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    },
    stock: 40,
    stock_status: 'IN_STOCK',
    visibility_status: 'PUBLIC',
    warranty: true,
    production: 1403,
    sold_count: 67,
    rating: 4.6,
    dimensions: {
      length: { value: 22, unit: 'CM' },
      width: { value: 8, unit: 'CM' },
      height: { value: 24, unit: 'CM' },
    },
    weight: { value: 1.6, unit: 'KG' },
    images_id: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      '### دریل شارژی براش‌لس البرز\n\nموتور بدون زغال با گشتاور ۵۵ نیوتن‌متر، سه نظام اتوماتیک فلزی و کیف حمل ضدضربه BMC.',
  },
  {
    _id: 'prod-7',
    name: 'سرخ‌کن بدون روغن هوشمند فیلیپس مدل XXL ظرفیت ۷.۳ لیتر دیجیتال',
    brand: 'Philips',
    category_id: 'cat-home',
    store_id: 'store-2',
    store_name: 'خانه مدرن پارس',
    seller_id: 'user-seller-2',
    price: { amount: 142000000 },
    discount: { percentage: 0 },
    stock: 15,
    stock_status: 'IN_STOCK',
    visibility_status: 'PUBLIC',
    warranty: true,
    production: 1403,
    sold_count: 112,
    rating: 4.8,
    dimensions: {
      length: { value: 43, unit: 'CM' },
      width: { value: 32, unit: 'CM' },
      height: { value: 31, unit: 'CM' },
    },
    weight: { value: 7.9, unit: 'KG' },
    images_id: [
      'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      '### سرخ‌کن رژیمی فیلیپس XXL\n\nپخت سالم با ۹۰٪ چربی کمتر به کمک فناوری Rapid Air و پنل لمسی ۸ برنامه‌ای.',
  },
  {
    _id: 'prod-8',
    name: 'اسپیکر بلوتوثی قابل حمل جی‌بی‌ال مدل Charge 5 ضدآب IP67',
    brand: 'JBL',
    category_id: 'cat-audio',
    store_id: 'store-3',
    store_name: 'گالری ساعت و استایل آریا',
    seller_id: 'user-seller-1',
    price: { amount: 98000000 },
    discount: {
      percentage: 10,
      expirationDate: new Date(Date.now() + 18 * 86400000).toISOString(),
    },
    stock: 22,
    stock_status: 'IN_STOCK',
    visibility_status: 'PUBLIC',
    warranty: true,
    production: 1403,
    sold_count: 93,
    rating: 4.8,
    dimensions: {
      length: { value: 22.3, unit: 'CM' },
      width: { value: 9.6, unit: 'CM' },
      height: { value: 9.4, unit: 'CM' },
    },
    weight: { value: 960, unit: 'G' },
    images_id: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80',
    ],
    description:
      '### اسپیکر همراه JBL Charge 5\n\nصدای قدرتمند JBL Pro Sound با ۲۰ ساعت شارژدهی مداوم و پاوربانک داخلی.',
  },
];

const DEMO_PLANS = [
  {
    _id: 'plan-basic',
    name: 'پلن نقره‌ای (شروع کسب‌وکار)',
    duration_days: 30,
    amount: 4900000,
    max_products: 50,
    max_shops: 1,
    max_images: 5,
    description: 'مناسب فروشگاه‌های نوپا با پشتیبانی اختصاصی و پنل مدیریت سفارش.',
    is_featured: false,
  },
  {
    _id: 'plan-pro',
    name: 'پلن طلایی (حرفه‌ای)',
    duration_days: 90,
    amount: 11900000,
    max_products: 300,
    max_shops: 3,
    max_images: 10,
    description: 'بهترین انتخاب برای فروشندگان فعال همراه با نشان فروشنده برگزیده.',
    is_featured: true,
  },
  {
    _id: 'plan-enterprise',
    name: 'پلن الماسی (سازمانی)',
    duration_days: 365,
    amount: 34900000,
    max_products: 2000,
    max_shops: 10,
    max_images: 15,
    description: 'ویژه برندها و بازرگانی‌های بزرگ با سقف نامحدود فروش و تسویه سریع.',
    is_featured: true,
  },
];

const DEMO_ADDRESSES = [
  {
    _id: 'addr-1',
    is_default: true,
    address: {
      full_name: 'پارسا سعادت',
      province: 'تهران',
      city: 'تهران',
      neighborhood: 'سعادت‌آباد',
      full_address: 'بلوار سرو غربی، خیابان مروارید، پلاک ۲۴',
      building_number: 24,
      unit: 6,
      postal_code: '1998765432',
      is_default: true,
    },
  },
];

const DEMO_ORDERS = [
  {
    _id: 'ord-1001',
    order_number: 'ALB-10482',
    customer_id: 'user-admin-1',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    total_amount: 753300000,
    total_discount: 105400000,
    final_amount: 647900000,
    payment: { status: 'paid', ref_id: 'ZP-88492014' },
    payment_status: 'paid',
    customer_notes: 'لطفاً قبل از ارسال هماهنگ شود.',
    shipping_address: DEMO_ADDRESSES[0].address,
    sub_orders: [
      {
        _id: 'sub-2001',
        order_number: 'SUB-901',
        store_id: 'store-1',
        seller_id: 'user-seller-1',
        status: 'ready_to_ship',
        subtotal: 753300000,
        discount_applied: 105400000,
        amount: 647900000,
        shipping_address: DEMO_ADDRESSES[0].address,
        items: [
          {
            product_id: 'prod-1',
            product_name: 'لپ‌تاپ ۱۵.۶ اینچی ایسوس مدل VivoBook Pro 15 OLED',
            quantity: 1,
            unit_price: 554700000,
          },
          {
            product_id: 'prod-3',
            product_name: 'اسپرسوساز حرفه‌ای مباشی مدل ECM2035',
            quantity: 1,
            unit_price: 94300000,
          },
        ],
      },
    ],
  },
  {
    _id: 'ord-1002',
    order_number: 'ALB-10495',
    customer_id: 'user-buyer-1',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    total_amount: 198000000,
    total_discount: 39600000,
    final_amount: 158400000,
    payment: { status: 'paid', ref_id: 'ZP-99201844' },
    payment_status: 'paid',
    shipping_address: {
      full_name: 'علی کریمی',
      province: 'تهران',
      city: 'تهران',
      neighborhood: 'ونک',
      full_address: 'میدان ونک، خیابان ملاصدرا، پلاک ۱۱۸',
      building_number: 118,
      unit: 3,
      postal_code: '1435896321',
    },
    sub_orders: [
      {
        _id: 'sub-2002',
        order_number: 'SUB-902',
        store_id: 'store-1',
        seller_id: 'user-seller-1',
        status: 'awaiting_approval',
        subtotal: 198000000,
        discount_applied: 39600000,
        amount: 158400000,
        shipping_address: {
          full_name: 'علی کریمی',
          province: 'تهران',
          city: 'تهران',
          neighborhood: 'ونک',
          full_address: 'میدان ونک، خیابان ملاصدرا، پلاک ۱۱۸',
          building_number: 118,
          unit: 3,
          postal_code: '1435896321',
        },
        items: [
          {
            product_id: 'prod-2',
            product_name: 'هدفون بی‌سیم سونی مدل WH-1000XM5',
            quantity: 1,
            unit_price: 158400000,
          },
        ],
      },
    ],
  },
];

function readState(key, fallback) {
  try {
    const raw = localStorage.getItem(`alibazar_demo_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeState(key, value) {
  try {
    localStorage.setItem(`alibazar_demo_${key}`, JSON.stringify(value));
  } catch {
    // ignore
  }
}

let installed = false;

export function setupMockBackendFallback() {
  if (installed) return;
  installed = true;

  // Ensure default demo user is available if no user is logged in yet, or keep existing auth
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Only intercept if backend server is unreachable (network error)
      if (error.response || axios.isCancel(error) || error.code === 'ERR_CANCELED') {
        return Promise.reject(error);
      }

      const config = error.config || {};
      const method = (config.method || 'get').toLowerCase();
      const rawUrl = config.url || '';
      const parsed = new URL(rawUrl, 'http://localhost:3000');
      // Merge config.params into searchParams
      if (config.params && typeof config.params === 'object') {
        Object.entries(config.params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') parsed.searchParams.set(k, String(v));
        });
      }
      const path = parsed.pathname.replace(/\/+$/, '') || '/';
      const params = parsed.searchParams;
      let body = {};
      if (config.data) {
        try {
          body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        } catch {
          body = {};
        }
      }

      const ok = (resBody, message = 'موفق') => ({
        status: 200,
        data: { success: true, message, body: resBody },
        config,
        headers: {},
      });

      const categories = readState('categories', DEMO_CATEGORIES);
      const products = readState('products', DEMO_PRODUCTS);
      const stores = readState('stores', DEMO_STORES);
      const users = readState('users', DEMO_USERS);
      const sellers = readState('sellers', DEMO_SELLERS);
      const plans = readState('plans', DEMO_PLANS);
      const orders = readState('orders', DEMO_ORDERS);
      const addresses = readState('addresses', DEMO_ADDRESSES);
      const cart = readState('cart', [
        { _id: 'cart-1', product_id: 'prod-1', quantity: 1 },
        { _id: 'cart-2', product_id: 'prod-2', quantity: 1 },
      ]);

      // 1. Auth
      if (path === '/auth/pre' && method === 'post') {
        return ok('123456', 'کد تایید ارسال شد');
      }
      if (path === '/auth/login' && method === 'post') {
        const phone = body.phone || '09120000001';
        let user = users.find((u) => u.phone === phone);
        if (!user) {
          user = {
            _id: `user-${Date.now()}`,
            username: `user_${phone.slice(-4)}`,
            phone,
            role: phone.endsWith('001') ? 'admin' : phone.endsWith('233') ? 'seller' : 'admin',
            is_seller: true,
          };
          users.push(user);
          writeState('users', users);
        }
        return ok({ token: `demo-jwt-token-${user._id}`, user });
      }

      // 2. Categories
      if (path === '/category/tree' && method === 'get') {
        return ok(categories);
      }
      if (path === '/category' && method === 'get') {
        return ok({ data: categories, totalPages: 1, total: categories.length });
      }
      if (path === '/category' && method === 'post') {
        const newCat = { _id: `cat-${Date.now()}`, ...body };
        categories.push(newCat);
        writeState('categories', categories);
        return ok(newCat);
      }
      if (path.startsWith('/category/') && method === 'put') {
        const id = path.split('/')[2];
        const idx = categories.findIndex((c) => c._id === id);
        if (idx >= 0) categories[idx] = { ...categories[idx], ...body };
        writeState('categories', categories);
        return ok(categories[idx] || body);
      }
      if (path.startsWith('/category/') && method === 'delete') {
        const id = path.split('/')[2];
        const next = categories.filter((c) => c._id !== id);
        writeState('categories', next);
        return ok(true);
      }

      // 3. Products
      if ((path === '/product' || path === '/perm/products') && method === 'get') {
        let list = [...products];
        const q = (params.get('name') || '').trim().toLowerCase();
        const catId = params.get('category_id');
        const storeId = params.get('store_id');
        const brand = (params.get('brand') || '').trim().toLowerCase();
        const discount = params.get('discount');
        const warranty = params.get('warranty');
        const stockStatus = params.get('stock_status');
        const minPrice = Number(params.get('min_price') || 0);
        const maxPrice = Number(params.get('max_price') || 0);

        if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q));
        if (catId) {
          const childIds = categories.filter((c) => c.parent_id === catId).map((c) => c._id);
          const validIds = new Set([catId, ...childIds]);
          list = list.filter((p) => validIds.has(p.category_id));
        }
        if (storeId) list = list.filter((p) => p.store_id === storeId);
        if (brand) list = list.filter((p) => p.brand?.toLowerCase().includes(brand));
        if (discount === 'true') list = list.filter((p) => Number(p.discount?.percentage || 0) > 0);
        if (warranty === 'true') list = list.filter((p) => Boolean(p.warranty));
        if (stockStatus) list = list.filter((p) => p.stock_status === stockStatus);
        if (minPrice > 0) list = list.filter((p) => (p.price?.amount || 0) >= minPrice);
        if (maxPrice > 0) list = list.filter((p) => (p.price?.amount || 0) <= maxPrice);

        const limit = Number(params.get('limit') || 20);
        const page = Number(params.get('page') || 1);
        const total = list.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const paged = list.slice((page - 1) * limit, page * limit);
        return ok({ data: paged, total, totalPages });
      }
      if (path.startsWith('/product/') && method === 'get') {
        const id = path.split('/')[2];
        const found = products.find((p) => p._id === id) || products[0];
        return ok(found);
      }
      if (path === '/product' && method === 'post') {
        const store = stores.find((s) => s._id === body.store_id) || stores[0];
        const created = {
          _id: `prod-${Date.now()}`,
          sold_count: 0,
          rating: 4.8,
          store_name: store?.name || 'فروشگاه علی‌بازار',
          seller_id: store?.user || 'user-seller-1',
          ...body,
        };
        products.unshift(created);
        writeState('products', products);
        return ok(created);
      }
      if (path.startsWith('/product/') && method === 'put') {
        const id = path.split('/')[2];
        const idx = products.findIndex((p) => p._id === id);
        if (idx >= 0) {
          products[idx] = { ...products[idx], ...body };
          writeState('products', products);
        }
        return ok(products[idx] || body);
      }
      if (path.startsWith('/product/') && method === 'delete') {
        const id = path.split('/')[2];
        writeState('products', products.filter((p) => p._id !== id));
        return ok(true);
      }

      // 4. Stores
      if ((path === '/store' || path === '/perm/stores') && method === 'get') {
        return ok({ data: stores, total: stores.length, totalPages: 1 });
      }
      if (path.startsWith('/store/') && method === 'get') {
        const id = path.split('/')[2];
        return ok(stores.find((s) => s._id === id) || stores[0]);
      }
      if (path === '/store' && method === 'post') {
        const created = { _id: `store-${Date.now()}`, status: 'ENABLE', user: 'user-seller-1', ...body };
        stores.push(created);
        writeState('stores', stores);
        return ok(created);
      }
      if (path.startsWith('/store/') && method === 'put') {
        const id = path.split('/')[2];
        const idx = stores.findIndex((s) => s._id === id);
        if (idx >= 0) {
          stores[idx] = { ...stores[idx], ...body };
          writeState('stores', stores);
        }
        return ok(stores[idx] || body);
      }
      if (path.startsWith('/store/') && method === 'delete') {
        const id = path.split('/')[2];
        writeState('stores', stores.filter((s) => s._id !== id));
        return ok(true);
      }

      // 5. Cart
      if (/^\/user\/[^/]+\/cart$/.test(path)) {
        if (method === 'get') {
          return ok({ data: cart, total: cart.length });
        }
        if (method === 'post') {
          const existing = cart.find((c) => c.product_id === body.product_id);
          if (existing) existing.quantity += Number(body.quantity || 1);
          else cart.push({ _id: `cart-${Date.now()}`, product_id: body.product_id, quantity: Number(body.quantity || 1) });
          writeState('cart', cart);
          return ok(cart);
        }
      }
      if (/^\/user\/[^/]+\/cart\/[^/]+$/.test(path)) {
        const prodId = path.split('/')[4];
        if (method === 'put') {
          const item = cart.find((c) => c.product_id === prodId);
          if (item) item.quantity = Number(body.quantity || 1);
          writeState('cart', cart);
          return ok(cart);
        }
        if (method === 'delete') {
          const next = cart.filter((c) => c.product_id !== prodId);
          writeState('cart', next);
          return ok(next);
        }
      }

      // 6. Addresses
      if (/^\/users\/[^/]+\/address$/.test(path)) {
        if (method === 'get') return ok(addresses);
        if (method === 'post') {
          const created = { _id: `addr-${Date.now()}`, is_default: addresses.length === 0, address: body.address || body };
          addresses.push(created);
          writeState('addresses', addresses);
          return ok(created);
        }
      }
      if (/^\/users\/[^/]+\/address\/[^/]+$/.test(path)) {
        const addrId = path.split('/')[4];
        if (method === 'put') {
          const idx = addresses.findIndex((a) => a._id === addrId);
          if (idx >= 0) {
            addresses[idx] = { ...addresses[idx], address: { ...addresses[idx].address, ...(body.address || body) } };
            writeState('addresses', addresses);
          }
          return ok(addresses[idx] || body);
        }
        if (method === 'delete') {
          writeState('addresses', addresses.filter((a) => a._id !== addrId));
          return ok(true);
        }
      }

      // 7. Users & Sellers
      if (path === '/user' && method === 'get') {
        return ok({ data: users, total: users.length, totalPages: 1 });
      }
      if (path.startsWith('/user/') && method === 'get') {
        const id = path.split('/')[2];
        return ok(users.find((u) => u._id === id) || users[0]);
      }
      if (path.startsWith('/user/') && method === 'put') {
        const id = path.split('/')[2];
        const idx = users.findIndex((u) => u._id === id);
        if (idx >= 0) {
          users[idx] = { ...users[idx], ...body };
          writeState('users', users);
        }
        return ok(users[idx] || body);
      }
      if (path.startsWith('/user/') && method === 'delete') {
        const id = path.split('/')[2];
        writeState('users', users.filter((u) => u._id !== id));
        return ok(true);
      }
      if (path === '/sellers' && method === 'get') {
        return ok({ data: sellers, total: sellers.length });
      }
      if (path.startsWith('/seller/') && method === 'get') {
        const id = path.split('/')[2];
        return ok(sellers.find((s) => s._id === id) || sellers[0]);
      }
      if ((path === '/seller' && method === 'post') || (path.startsWith('/seller/') && method === 'put')) {
        const id = path.split('/')[2] || 'user-admin-1';
        const idx = sellers.findIndex((s) => s._id === id);
        if (idx >= 0) {
          sellers[idx] = { ...sellers[idx], ...body };
        } else {
          sellers.push({ _id: id, username: 'فروشنده جدید', seller_approved_status: false, seller_active_status: 'ACTIVE', ...body });
        }
        writeState('sellers', sellers);
        return ok(sellers[idx] || body);
      }

      // 8. Plans
      if (path === '/plan' && method === 'get') {
        return ok({ data: plans, total: plans.length });
      }
      if (path === '/plan' && method === 'post') {
        const created = { _id: `plan-${Date.now()}`, ...body };
        plans.push(created);
        writeState('plans', plans);
        return ok(created);
      }
      if (path.startsWith('/plan/') && method === 'delete') {
        const id = path.split('/')[2];
        writeState('plans', plans.filter((p) => p._id !== id));
        return ok(true);
      }
      if (path.startsWith('/subscription/') && method === 'post') {
        return ok({ pay_url: '' }, 'اشتراک با موفقیت فعال شد');
      }

      // 9. Orders & Sub-orders
      if (path === '/orders' && method === 'get') {
        return ok({ data: orders, total: orders.length });
      }
      if (path === '/order/sub/all' && method === 'get') {
        const subs = orders.flatMap((o) => o.sub_orders || []);
        return ok({ data: subs, total: subs.length });
      }
      if (path === '/order' && method === 'post') {
        const selectedAddr = addresses.find((a) => a._id === body.address_id)?.address || DEMO_ADDRESSES[0].address;
        const cartProducts = cart.map((c) => {
          const p = products.find((x) => x._id === c.product_id) || products[0];
          return {
            product_id: p._id,
            product_name: p.name,
            quantity: c.quantity,
            unit_price: p.price?.amount || 0,
          };
        });
        const totalAmount = cartProducts.reduce((s, i) => s + i.unit_price * i.quantity, 0);
        const newOrder = {
          _id: `ord-${Date.now()}`,
          order_number: `ALB-${Math.floor(10000 + Math.random() * 90000)}`,
          created_at: new Date().toISOString(),
          total_amount: totalAmount,
          total_discount: 0,
          final_amount: totalAmount,
          payment: { status: 'paid', ref_id: `ZP-${Math.floor(10000000 + Math.random() * 90000000)}` },
          payment_status: 'paid',
          customer_notes: body.note || '',
          shipping_address: selectedAddr,
          sub_orders: [
            {
              _id: `sub-${Date.now()}`,
              order_number: `SUB-${Math.floor(100 + Math.random() * 900)}`,
              store_id: 'store-1',
              status: 'preparing',
              subtotal: totalAmount,
              discount_applied: 0,
              amount: totalAmount,
              shipping_address: selectedAddr,
              items: cartProducts,
            },
          ],
        };
        orders.unshift(newOrder);
        writeState('orders', orders);
        writeState('cart', []);
        return ok({ _id: newOrder._id, parent: newOrder });
      }
      if (/^\/order\/[^/]+\/pay$/.test(path)) {
        return ok({ status: 'paid' }, 'پرداخت با موفقیت انجام شد');
      }
      if (/^\/order\/sub\/[^/]+\/approve$/.test(path)) {
        const subId = path.split('/')[3];
        orders.forEach((o) => {
          (o.sub_orders || []).forEach((s) => {
            if (s._id === subId) s.status = 'preparing';
          });
        });
        writeState('orders', orders);
        return ok(true);
      }
      if (/^\/order\/sub\/[^/]+\/status$/.test(path)) {
        const subId = path.split('/')[3];
        orders.forEach((o) => {
          (o.sub_orders || []).forEach((s) => {
            if (s._id === subId) s.status = body.status;
          });
        });
        writeState('orders', orders);
        return ok(true);
      }
      if (/^\/order\/sub\/[^/]+$/.test(path) && method === 'put') {
        const subId = path.split('/')[3];
        orders.forEach((o) => {
          (o.sub_orders || []).forEach((s) => {
            if (s._id === subId) {
              s.status = 'cancelled';
              s.cancellation_details = { reason: body.reason || 'لغو شده' };
            }
          });
        });
        writeState('orders', orders);
        return ok(true);
      }

      // 10. Storage upload / fetch
      if (path === '/storage' && method === 'post') {
        return ok([
          {
            _id: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
          },
        ]);
      }

      return ok({});
    },
  );
}
