/** Storefront origin for "view on site" links. Set VITE_STOREFRONT_URL at build time once the domain is live. */
export const STOREFRONT_URL: string = import.meta.env.DEV
  ? 'http://localhost:5173'
  : ((import.meta.env.VITE_STOREFRONT_URL as string | undefined) ?? '');

/** wa.me link for a Pakistani mobile stored as 03XXXXXXXXX. */
export const whatsappLink = (phone: string, text: string) =>
  `https://wa.me/92${phone.replace(/^0/, '')}?text=${encodeURIComponent(text)}`;

/** "03001234567" → "0300 1234567" */
export const formatPhone = (phone: string) => phone.replace(/^(\d{4})(\d+)$/, '$1 $2');

/** Amount display for totals where 0 is a real value ("Rs 0"), unlike prices where 0 means unset. */
export const formatAmount = (pkr: number) => `Rs ${pkr.toLocaleString('en-PK')}`;

/** Hours 0–23 → "11 PM" */
export const formatHour = (h: number) => {
  const suffix = h < 12 ? 'AM' : 'PM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return h === 0 ? '12 midnight' : h === 12 ? '12 noon' : `${hr} ${suffix}`;
};
