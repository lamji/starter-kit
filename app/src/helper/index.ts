/** @format */
export function formatCurrency(amount: number, hideSign?: boolean): string {
  return hideSign
    ? `${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
    : `₱${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}
