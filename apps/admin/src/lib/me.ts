import { useQuery } from '@tanstack/react-query';
import { get } from './api';

export interface Me {
  email: string;
  name: string;
  role: 'owner' | 'staff' | 'rider';
}

/** The signed-in admin (cached; the Shell loads it first). */
export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => get<Me>('/admin/me') });
