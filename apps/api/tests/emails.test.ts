import { describe, expect, it } from 'vitest';
import { TEMPLATES, rawHtml, renderEmail, templateById } from '../src/emails/templates';

const sample = (params: string[]) => Object.fromEntries(params.map((p) => [p, `<${p}>`]));

describe('email templates', () => {
  it('has unique ids', () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length);
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))('%s declares exactly the params it uses', (_id, tpl) => {
    const used = new Set([...(rawHtml(tpl) + tpl.subject).matchAll(/\{\{\s*params\.(\w+)\s*\}\}/g)].map((m) => m[1]));
    expect([...used].sort()).toEqual([...tpl.params].sort());
  });

  it.each(TEMPLATES.map((t) => [t.id, t] as const))('%s renders with no placeholders left', (_id, tpl) => {
    const { html, subject } = renderEmail(tpl.id, sample(tpl.params));
    expect(html).not.toMatch(/\{\{\s*params\./);
    expect(subject).not.toMatch(/\{\{/);
    expect(html).toContain('<!doctype html>');
  });

  it('escapes user supplied values to prevent HTML injection', () => {
    const { html } = renderEmail('shop-approved', {
      name: '<script>alert(1)</script>',
      shopName: 'A & B "Store"',
      url: 'https://example.com/?a=1&b=2',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('A &amp; B &quot;Store&quot;');
  });

  it('shows the login code and expiry', () => {
    const { html, subject } = renderEmail('login-code', { code: '482913', minutes: '5' });
    expect(html).toContain('482913');
    expect(html).toContain('5 minutes');
    expect(subject).toBe('Your OfferBuzz login code');
  });

  it('fails loudly when a param is missing', () => {
    expect(() => renderEmail('login-code', { code: '123456' })).toThrow(/minutes/);
    expect(() => renderEmail('nope', {})).toThrow(/Unknown email template/);
  });

  it('only marketing templates carry an unsubscribe link', () => {
    for (const t of TEMPLATES) {
      expect(rawHtml(t).includes('{{ unsubscribe }}')).toBe(t.kind === 'marketing');
    }
    expect(templateById('deals-digest').kind).toBe('marketing');
  });
});

describe('campaign export', () => {
  it('black friday campaign html has no params left but keeps the unsubscribe link', async () => {
    const { campaignHtml } = await import('../src/emails/templates');
    const html = campaignHtml(templateById('black-friday')) as string;
    expect(html).not.toMatch(/\{\{\s*params\./);
    expect(html).toContain('{{ unsubscribe }}');
    expect(html).toContain('60%');
  });
  it('transactional templates have no campaign variant', async () => {
    const { campaignHtml } = await import('../src/emails/templates');
    expect(campaignHtml(templateById('login-code'))).toBeNull();
  });
});
