/**
 * Utilidades de fecha centradas en "day keys" en formato YYYY-MM-DD.
 * Trabajamos con claves de día (string) para evitar problemas de zona horaria
 * al persistir HabitLog.date.
 *
 * Todas las funciones que dependen de "ahora" aceptan un parámetro `timezone`
 * (ej. "America/Lima", "America/New_York") para calcular el día correcto
 * según la zona horaria del usuario.
 */

/**
 * Devuelve un objeto Date representando "ahora" en la timezone indicada.
 * Internamente usa Intl.DateTimeFormat para obtener las partes de fecha
 * en la zona horaria deseada y construye un Date con esos valores.
 */
export function nowInTimezone(timezone: string): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return new Date(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second"))
  );
}

/** Devuelve la clave de día YYYY-MM-DD de una fecha. */
export function toDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Clave de día de hoy, según la timezone del usuario. */
export function todayKey(timezone: string = "America/Lima"): string {
  return toDayKey(nowInTimezone(timezone));
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
export function weekDayKeys(ref?: Date, timezone?: string): string[] {
  const date = ref ?? (timezone ? nowInTimezone(timezone) : new Date());
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
export function monthDayKeys(ref?: Date, timezone?: string): string[] {
  const date = ref ?? (timezone ? nowInTimezone(timezone) : new Date());
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) =>
    toDayKey(new Date(year, month, i + 1)),
  );
}

/**
 * Devuelve todas las claves de día de los últimos `months` meses (incluyendo
 * el mes actual completo), contadas hacia atrás desde `ref`.
 * Útil para las vistas trimestral (3) y semestral (6).
 */
export function lastMonthsDayKeys(months: number, ref?: Date, timezone?: string): string[] {
  const date = ref ?? (timezone ? nowInTimezone(timezone) : new Date());
  const keys: string[] = [];
  const year = date.getFullYear();
  const month = date.getMonth();
  for (let offset = months - 1; offset >= 0; offset--) {
    const d = new Date(year, month - offset, 1);
    keys.push(...monthDayKeys(d));
  }
  return keys;
}

/**
 * Agrupa los meses de un periodo de N meses (hacia atrás desde `ref`) en un
 * arreglo de { key: "YYYY-MM", label: "Ago 2026", dayKeys: [...] }.
 * Útil para las vistas trimestral y semestral (progreso mes a mes).
 */
export function periodMonths(
  months: number,
  ref?: Date,
  timezone?: string,
): { key: string; label: string; dayKeys: string[] }[] {
  const date = ref ?? (timezone ? nowInTimezone(timezone) : new Date());
  const year = date.getFullYear();
  const month = date.getMonth();
  const out: { key: string; label: string; dayKeys: string[] }[] = [];
  for (let offset = months - 1; offset >= 0; offset--) {
    const d = new Date(year, month - offset, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    out.push({
      key: `${y}-${m}`,
      label: d.toLocaleDateString("es", { month: "short", year: "numeric" }),
      dayKeys: monthDayKeys(d),
    });
  }
  return out;
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
export function monthLabel(ref?: Date, timezone?: string): string {
  const date = ref ?? (timezone ? nowInTimezone(timezone) : new Date());
  return date.toLocaleDateString("es", { month: "long", year: "numeric" });
}

/**
 * Agrupa las claves de día del mes en semanas (lunes a domingo).
 * Cada semana es un array de 7 posiciones; las posiciones fuera del mes
 * se rellenan con `null` para alinear la cuadrícula por día de la semana.
 * Útil para el selector "Semana 1..N" de la vista mensual.
 */
export function monthWeeks(ref?: Date, timezone?: string): (string | null)[][] {
  const date = ref ?? (timezone ? nowInTimezone(timezone) : new Date());
  const keys = monthDayKeys(date);
  const weeks: (string | null)[][] = [];
  let current: (string | null)[] = [];

  for (const key of keys) {
    if (current.length === 0) {
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
