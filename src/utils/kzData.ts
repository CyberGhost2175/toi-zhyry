export const KZ_CITIES = [
  "Алматы",
  "Астана",
  "Шымкент",
  "Актау",
  "Актобе",
  "Атырау",
  "Караганда",
  "Кокшетау",
  "Костанай",
  "Кызылорда",
  "Павлодар",
  "Петропавловск",
  "Семей",
  "Талдыкорган",
  "Тараз",
  "Туркестан",
  "Уральск",
  "Усть-Каменогорск",
  "Жезказган",
];

export const KZ_REGIONS = [
  "Абайская область",
  "Акмолинская область",
  "Актюбинская область",
  "Алматинская область",
  "Атырауская область",
  "Восточно-Казахстанская область",
  "Жамбылская область",
  "Жетысуская область",
  "Западно-Казахстанская область",
  "Карагандинская область",
  "Костанайская область",
  "Кызылординская область",
  "Мангистауская область",
  "Павлодарская область",
  "Северо-Казахстанская область",
  "Туркестанская область",
  "Улытауская область",
  "Астана",
  "Алматы",
  "Шымкент",
];

export function normalizeKzPhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("8")) return `7${digits.slice(1, 11)}`;
  if (digits.startsWith("7")) return digits.slice(0, 11);
  return `7${digits}`.slice(0, 11);
}

export function formatKzPhoneInput(raw: string): string {
  const normalized = normalizeKzPhone(raw);
  const local = normalized.startsWith("7") ? normalized.slice(1) : normalized;
  const a = local.slice(0, 3);
  const b = local.slice(3, 6);
  const c = local.slice(6, 8);
  const d = local.slice(8, 10);

  let result = "+7";
  if (a) result += ` (${a}`;
  if (a.length === 3) result += ")";
  if (b) result += ` ${b}`;
  if (c) result += `-${c}`;
  if (d) result += `-${d}`;
  return result;
}
