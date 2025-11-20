import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncateAddress(address?: string, size = 4) {
  if (!address) return "";
  const normalized = address.trim();
  if (normalized.length <= size * 2) return normalized;
  return `${normalized.slice(0, 2 + size)}...${normalized.slice(-size)}`;
}
