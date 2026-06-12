import { Store } from "../types/screenplay";
import { makeSample } from "../components/screenplay/constants";

export const STORAGE_KEY = "screenplay_store_v2";

export function loadStore(): Store {
  if (typeof window === "undefined") return { projects: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const s: Store = { projects: [makeSample()] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  return s;
}
