import { describe, expect, it } from 'vitest';
import { formatOrderNumber } from '../src/lib/ids';
import { imageUrl } from '../src/lib/images';
import { whatsappOrderUrl } from '../src/lib/notify';

describe('api helpers', () => {
  it('formats order numbers', () => {
    expect(formatOrderNumber(123)).toBe('PP-000123');
  });

  it('maps image keys', () => {
    expect(imageUrl('/images/products/x.jpg')).toBe('/images/products/x.jpg');
    expect(imageUrl('products/abc.webp')).toBe('/api/img/products/abc.webp');
    expect(imageUrl('')).toBeNull();
  });

  it('builds a WhatsApp deep link', () => {
    const url = whatsappOrderUrl('923285228505', {
      number: 'PP-000001',
      totalPkr: 380,
      items: [{ name: 'Gross Matar', label: '1 kg', qty: 2 }],
    });
    expect(url.startsWith('https://wa.me/923285228505?text=')).toBe(true);
    expect(decodeURIComponent(url)).toContain('PP-000001');
  });
});
