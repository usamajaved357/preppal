/** Money is stored and passed as integer PKR (no paisa). */
export type Pkr = number;

export function formatPkr(value: Pkr | null | undefined): string {
  if (value == null || value <= 0) return 'Rs —';
  return `Rs ${value.toLocaleString('en-PK')}`;
}

export function sumPkr(values: readonly Pkr[]): Pkr {
  return values.reduce((a, b) => a + b, 0);
}
