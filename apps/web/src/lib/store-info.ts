import { useQuery } from '@tanstack/react-query';
import { q } from './api';
import { formatHour } from './site';

/**
 * Storefront copy that the owner controls from Admin → Settings / Delivery areas.
 * Use this instead of hard-coding "11 PM", "5 PM" or "Sahiwal".
 */
export function useStoreInfo() {
  const { data } = useQuery(q.settings());
  return {
    loaded: !!data,
    cutoff: formatHour(data?.cutoffHour ?? 23),
    by: data?.deliveryByLabel ?? '5 PM',
    city: data?.cityNames.join(', ') || 'Sahiwal',
    paused: !!data?.ordersPaused,
    pauseMessage: data?.pauseMessage ?? '',
    minOrder: data?.minOrderPkr ?? 0,
    whatsapp: data?.whatsappNumber ?? '923285228505',
    instagram: data?.instagramHandle ?? 'preppal.swl',
  };
}
