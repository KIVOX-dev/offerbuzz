import { describe, expect, it } from 'vitest';
import { score, searchTerms, stem, wordRegex } from '../src/utils/searchTerms';

describe('search terms', () => {
  it('strips plurals', () => {
    expect(stem('Kurthis')).toBe('kurthi');
    expect(stem('dresses')).toBe('dress');
    expect(stem('offers')).toBe('offer');
    expect(stem('glass')).toBe('glass');
  });

  it('forgives plurals and missing end letters, and maps everyday words to a category', () => {
    const t = searchTerms('Kurthis');
    expect(t.categories).toEqual(['Fashion']);
    const rx = wordRegex(t.prefixes)!;
    for (const w of ['Kurthi starts @99', 'new kurti collection', 'Kurta sets']) expect(rx.test(w)).toBe(true);
    expect(rx.test('Salon and Spa')).toBe(false);
  });

  it('ignores filler words and matches a category named in the search', () => {
    const t = searchTerms('best grocery shops near me');
    expect(t.prefixes).toEqual(['grocery'.slice(0, 5)]);
    expect(t.categories).toEqual(['Grocery']);
  });

  it('ranks a title match above a description match', () => {
    const { prefixes } = searchTerms('biryani');
    const base = { category: 'Food and Restaurant', area: 'RS Puram' };
    const inTitle = score(prefixes, { ...base, title: 'Chicken biryani combo', description: 'Hot and fresh' });
    const inText = score(prefixes, { ...base, title: 'Weekend special', description: 'Includes biryani and raita' });
    expect(inTitle).toBeGreaterThan(inText);
  });
});
