/**
 * Utilidades de fecha centradas en "day keys" en formato YYYY-MM-DD.
 * Trabajamos con claves de día (string) para evitar problemas de zona horaria
 * al persistir HabitLog.date.
 */

/** Devuelve la clave de día YYYY-MM-DD de una fecha (en hora local). */
export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Clave de día de hoy. */
export function todayKey(): string {
  return toDayKey(new Date());
}

/** Parsea una day key a Date (medianoche local). */
export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Devuelve las 7 claves de día de la semana que contiene `ref`.
 * La semana empieza en lunes (ISO).
 */
export function weekDayKeys(ref: Date = new Date()): string[] {
  const date = new Date(ref);
  const day = date.getDay(); // 0=domingo..6=sábado
  const diffToMonday = (day + 6) % 7; // días desde el lunes
  const monday = new Date(date);
  monday.setDate(date.getDate() - diffToMonday);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toDayKey(d);
  });
}

/**
 * Devuelve todas las claves de día del mes que contiene `ref`.
 */
export function monthDayKeys(ref: Date = new Date()): string[] {
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) =>
    toDayKey(new Date(year, month, i + 1)),
  );
}

/** Nombre corto del día (Lun, Mar, ...) para una day key. */
export function shortWeekdayLabel(key: string): string {
  const labels = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return labels[fromDayKey(key).getDay()];
}

/** Número de día del mes para una day key. */
export function dayOfMonth(key: string): number {
  return fromDayKey(key).getDate();
}

/** Etiqueta legible del mes y año actual (ej. "Agosto 2026"). */
export function monthLabel(ref: Date = new Date()): string {
  return ref.toLocaleDateString("es", { month: "long", year: "numeric" });
}

/**
 * Agrupa las claves de día del mes en semanas (lunes a domingo).
 * Cada semana es un array de 7 posiciones; las posiciones fuera del mes
 * se rellenan con `null` para alinear la cuadrícula por día de la semana.
 * Útil para el selector "Semana 1..N" de la vista mensual.
 */
export function monthWeeks(ref: Date = new Date()): (string | null)[][] {
  const keys = monthDayKeys(ref);
  const weeks: (string | null)[][] = [];
  let current: (string | null)[] = [];

  for (const key of keys) {
    if (current.length === 0) {
      // Rellena al inicio hasta el día de la semana (lunes=0).
      const weekday = (fromDayKey(key).getDay() + 6) % 7;
      for (let i = 0; i < weekday; i++) current.push(null);
    }
    current.push(key);
    if (current.length === 7) {
      weeks.push(current);
      current = [];
    }
  }
  if (current.length > 0) {
    while (current.length < 7) current.push(null);
    weeks.push(current);
  }
  return weeks;
}
