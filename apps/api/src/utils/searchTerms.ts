import { CATEGORIES } from '@offerbuzz/shared';

const STOP = new Set(['the', 'a', 'an', 'in', 'on', 'at', 'for', 'of', 'and', 'or', 'to', 'near', 'me', 'my', 'shop', 'shops', 'store', 'stores', 'offer', 'offers', 'deal', 'deals', 'best', 'cheap']);

/** Everyday words that point at a shop category, so "kurthis" finds Fashion offers even when no offer says "kurthi". */
const SYNONYMS: Record<string, (typeof CATEGORIES)[number][]> = {
  kurti: ['Fashion'], kurta: ['Fashion'], saree: ['Fashion'], sari: ['Fashion'], shirt: ['Fashion'], tshirt: ['Fashion'], jeans: ['Fashion'],
  dress: ['Fashion'], cloth: ['Fashion'], clothes: ['Fashion'], wear: ['Fashion'], shoe: ['Fashion'], footwear: ['Fashion'], textile: ['Fashion'], boutique: ['Fashion'],
  phone: ['Mobile and Electronics'], mobile: ['Mobile and Electronics'], laptop: ['Mobile and Electronics'], computer: ['Mobile and Electronics'], tv: ['Mobile and Electronics'], camera: ['Mobile and Electronics'], charger: ['Mobile and Electronics'],
  hair: ['Salon and Spa'], salon: ['Salon and Spa'], spa: ['Salon and Spa'], facial: ['Salon and Spa'], makeup: ['Salon and Spa'], beauty: ['Salon and Spa'], parlour: ['Salon and Spa'], massage: ['Salon and Spa'],
  tour: ['Travels'], trip: ['Travels'], flight: ['Travels'], hotel: ['Travels'], ticket: ['Travels'], travel: ['Travels'],
  fridge: ['Home Appliance'], refrigerator: ['Home Appliance'], washing: ['Home Appliance'], furniture: ['Home Appliance'], sofa: ['Home Appliance'], appliance: ['Home Appliance'],
  toy: ['Gifts and Toys'], gift: ['Gifts and Toys'], flower: ['Gifts and Toys'],
  gym: ['Fitness and Sports'], yoga: ['Fitness and Sports'], fitness: ['Fitness and Sports'], sport: ['Fitness and Sports'],
  food: ['Food and Restaurant'], restaurant: ['Food and Restaurant'], biryani: ['Food and Restaurant'], meal: ['Food and Restaurant'], hotel_food: ['Food and Restaurant'],
  tuition: ['Education'], course: ['Education'], coaching: ['Education'], class: ['Education'], school: ['Education'],
  vegetable: ['Grocery', 'Organic'], fruit: ['Grocery', 'Organic'], grocery: ['Grocery'], supermarket: ['Grocery'], milk: ['Grocery'],
  medicine: ['Medical'], pharmacy: ['Medical'], doctor: ['Medical'], clinic: ['Medical'], dental: ['Medical'], lab: ['Medical'],
  cake: ['Cafe and Bakeries'], bakery: ['Cafe and Bakeries'], coffee: ['Cafe and Bakeries'], cafe: ['Cafe and Bakeries'], icecream: ['Cafe and Bakeries'],
  car: ['Automobiles'], bike: ['Automobiles'], tyre: ['Automobiles'], service: ['Automobiles'], automobile: ['Automobiles'],
  baby: ['Baby Products'], diaper: ['Baby Products'], kid: ['Baby Products', 'Fashion'],
  house: ['Real Estate'], flat: ['Real Estate'], plot: ['Real Estate'], apartment: ['Real Estate'], land: ['Real Estate'],
  gold: ['Jewellery'], silver: ['Jewellery'], diamond: ['Jewellery'], jewel: ['Jewellery'], jewellery: ['Jewellery'], ring: ['Jewellery'], watch: ['Jewellery'],
  pickle: ['Home Made Products'], homemade: ['Home Made Products'], handicraft: ['Home Made Products'],
  organic: ['Organic'], millet: ['Organic'],
};

/** "Kurthis" -> "kurthi", "dresses" -> "dress": a light plural strip, nothing clever. */
export function stem(word: string): string {
  let w = word.toLowerCase();
  if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`;
  else if (w.length > 4 && /(ses|xes|ches|shes)$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  return w;
}

export interface SearchTerms {
  /** word prefixes to look for, forgiving of plurals and one or two missing letters at the end */
  prefixes: string[];
  /** categories the words point at (kurti -> Fashion) */
  categories: (typeof CATEGORIES)[number][];
}

export function searchTerms(input: string): SearchTerms {
  const words = input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2 && !STOP.has(w));
  const prefixes = new Set<string>();
  const categories = new Set<(typeof CATEGORIES)[number]>();
  for (const raw of words) {
    const s = stem(raw);
    // longer words may lose their last letters (kurthi ~ kurti ~ kurta); short ones must match as typed
    prefixes.add(s.length >= 6 ? s.slice(0, s.length - 2) : s.length === 5 ? s.slice(0, 4) : s);
    // exact, or close enough: same first four letters and a similar length (kurthi ~ kurti)
    for (const [key, cats] of Object.entries(SYNONYMS)) {
      const close = key.length >= 4 && s.length >= 4 && key.slice(0, 4) === s.slice(0, 4) && Math.abs(key.length - s.length) <= 2;
      if (key === s || key === raw || close) for (const c of cats) categories.add(c);
    }
    // a category's own name typed in part ("fashion", "grocery", "salon")
    for (const c of CATEGORIES) if (c.toLowerCase().split(/\s+/).some((p) => p === s || p === raw)) categories.add(c);
  }
  return { prefixes: [...prefixes], categories: [...categories] };
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A regex that matches any of the prefixes at the start of a word. */
export function wordRegex(prefixes: string[]): RegExp | undefined {
  return prefixes.length ? new RegExp(`\\b(?:${prefixes.map(escapeRegex).join('|')})`, 'i') : undefined;
}

/** How well an offer's text matches: title counts most, then sub category, shop, category, description, area. */
export function score(
  prefixes: string[],
  parts: { title: string; subcategory?: string | null; shop?: string; category: string; description: string; area: string },
): number {
  let total = 0;
  for (const p of prefixes) {
    const rx = new RegExp(`\\b${escapeRegex(p)}`, 'i');
    if (rx.test(parts.title)) total += 5;
    if (parts.subcategory && rx.test(parts.subcategory)) total += 4;
    if (parts.shop && rx.test(parts.shop)) total += 3;
    if (rx.test(parts.category)) total += 3;
    if (rx.test(parts.description)) total += 2;
    if (rx.test(parts.area)) total += 1;
  }
  return total;
}
