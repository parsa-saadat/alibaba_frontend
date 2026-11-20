// Website contact addresses. Product and transaction questions belong with the seller.
export const SUPPORT_EMAIL = 'support@geokala.ir';
export const INFO_EMAIL = 'info@geokala.ir';
export const emailHref = (address, subject) =>
  `mailto:${address}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
