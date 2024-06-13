import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDate(d?: Date) {
  d = d ?? new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0"); //January is 0!
  const yyyy = d.getFullYear();

  return `${yyyy}-${mm}-${dd}`;
}

export function millisecToHMS(millisec) {
  const d = new Date(millisec);
  return d
    .toISOString()
    .slice(11, 19)
    .split(":")
    .map((item) => Number(item));
}
