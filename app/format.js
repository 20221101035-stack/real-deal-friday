// format.js — small money and percent helpers for the deal finder.
// One clear job: turn numbers into the strings the cards show.

export function money(value) {
  return '$' + value.toFixed(2).replace(/\.00$/, '');
}

export function moneyFull(value) {
  return '$' + value.toFixed(2);
}

export function discountPercent(deal) {
  if (!deal.usual || deal.usual <= deal.sale) return 0;
  return Math.round(((deal.usual - deal.sale) / deal.usual) * 100);
}

export function saving(deal) {
  return Math.max(0, deal.usual - deal.sale);
}

export function usualLabel(deal) {
  return deal.usualKind === 'comp' ? 'Comp. value' : 'List price';
}
