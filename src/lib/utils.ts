import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Player } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function playerLabel(p: Player): string {
  return p.number != null ? `#${p.number} ${p.name}` : p.name
}
