import { Decimal } from '@prisma/client/runtime/library';

export function toNumber(value: Decimal | number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

export function timeToHhMm(value: Date): string {
  const hours = value.getUTCHours().toString().padStart(2, '0');
  const minutes = value.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function hhMmToDate(value: string): Date {
  const [h, m] = value.split(':').map(Number);
  return new Date(Date.UTC(1970, 0, 1, h, m, 0));
}

export function isOpenNow(
  hours: Array<{
    dayOfWeek: number;
    openTime: Date;
    closeTime: Date;
    isClosed: boolean;
  }>,
  dayOfWeek: number,
  timeHhMm: string,
): boolean {
  const today = hours.find((h) => h.dayOfWeek === dayOfWeek);
  if (!today || today.isClosed) return false;

  const current = timeHhMm;
  const open = timeToHhMm(today.openTime);
  const close = timeToHhMm(today.closeTime);

  if (open <= close) {
    return current >= open && current < close;
  }

  return current >= open || current < close;
}
