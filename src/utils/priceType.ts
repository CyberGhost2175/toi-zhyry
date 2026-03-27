/** Типы цен для услуг */
export const PRICE_TYPES = ['FIXED', 'RANGE', 'NEGOTIABLE'] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

/** Русские названия типов цен для отображения на сайте */
export const PRICE_TYPE_LABELS: Record<string, string> = {
  FIXED: 'Фиксированная цена',
  RANGE: 'Диапазон цен',
  NEGOTIABLE: 'Договорная',
};

/** Варианты для выбора в форме (создание/редактирование услуги) */
export const PRICE_TYPE_OPTIONS: { value: PriceType; label: string }[] = [
  { value: 'FIXED', label: 'Фиксированная цена' },
  { value: 'RANGE', label: 'Диапазон цен' },
  { value: 'NEGOTIABLE', label: 'Договорная' },
];

/** Возвращает русское название типа цены для отображения */
export function getPriceTypeLabel(priceType: string | undefined): string {
  if (!priceType) return '';
  return PRICE_TYPE_LABELS[priceType.toUpperCase()] ?? priceType;
}

/**
 * Форматирует цену для отображения в зависимости от типа:
 * FIXED — только цена «от» (priceFrom);
 * RANGE — диапазон priceFrom – priceTo;
 * NEGOTIABLE — только «Цена договорная», без чисел.
 */
export function formatPriceByType(
  priceFrom: number,
  priceTo: number,
  priceType: string | undefined
): string {
  const type = (priceType || '').toUpperCase();
  if (type === 'NEGOTIABLE') return 'Цена договорная';
  if (type === 'FIXED') return `${(priceFrom ?? 0).toLocaleString('ru-KZ')} ₸`;
  if (type === 'RANGE') {
    const from = (priceFrom ?? 0).toLocaleString('ru-KZ');
    const to = (priceTo ?? 0).toLocaleString('ru-KZ');
    return `${from} – ${to} ₸`;
  }
  // fallback
  if (priceFrom === priceTo || !priceTo) return `${(priceFrom ?? 0).toLocaleString('ru-KZ')} ₸`;
  return `${(priceFrom ?? 0).toLocaleString('ru-KZ')} – ${(priceTo ?? 0).toLocaleString('ru-KZ')} ₸`;
}
