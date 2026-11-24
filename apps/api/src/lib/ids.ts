export const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 20)}`;

export const nowIso = () => new Date().toISOString();

export const formatOrderNumber = (n: number) => `PP-${String(n).padStart(6, '0')}`;
