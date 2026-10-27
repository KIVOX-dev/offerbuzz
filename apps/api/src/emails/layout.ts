/**
 * One branded dark email layout (table based, inline styles, 600px) shared by every template.
 * Placeholders use Brevo's syntax, {{ params.name }}, so the same HTML works when pasted into Brevo
 * and when rendered by our own API. Gradients are avoided on purpose: many mail clients ignore them.
 */
export const BRAND = {
  purple: '#7242BD', // buttons: brighter than the logo purple so they read on dark
  purpleLight: '#B99DE4',
  pageBg: '#EEEEEE',
  cardBg: '#111214',
  panelBg: '#1D1E21',
  tileBg: '#2A2B2F',
  tileBorder: '#414247',
  text: '#F5F5F7',
  body: '#D4D4D8',
  muted: '#92929C',
  rule: '#393A3F',
  // Hosted copy of the logo (apps/web/public/brand). Move to the CDN bucket once Cloudflare is in front of B2.
  logoUrl: 'https://offerbuzz.vercel.app/brand/logo-horizontal.png',
  siteUrl: 'https://offerbuzz.vercel.app',
  font: 'Arial,Helvetica,sans-serif',
} as const;

export interface EmailBlock {
  /** Hidden inbox preview text. */
  preheader: string;
  heading: string;
  /** Body paragraphs, may contain inline HTML and {{ params.x }} placeholders. */
  paragraphs: string[];
  cta?: { label: string; url: string };
  /** Highlighted box, e.g. the login code. */
  highlight?: string;
  /** Small grey text under the content. */
  note?: string;
  /** Adds an unsubscribe link (Brevo fills {{ unsubscribe }} in campaigns). */
  marketing?: boolean;
}

/** White rounded badge holding the logo (the logo file has a white background, so it needs a light surface). */
export const logoBadge = (width = 150) =>
  `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border-radius:10px;"><tr><td align="center" style="padding:10px 18px;"><a href="${BRAND.siteUrl}" target="_blank"><img src="${BRAND.logoUrl}" alt="OfferBuzz" width="${width}" style="display:block;border:0;outline:none;height:auto;width:${width}px;"></a></td></tr></table>`;

export const footer = (marketing: boolean) => {
  const reason = marketing
    ? 'You are receiving this email because you signed up for OfferBuzz updates.<br><a href="{{ unsubscribe }}" style="color:#C3B6FF;text-decoration:underline;">Unsubscribe</a> from promotional emails.'
    : 'You are receiving this email because of your activity on OfferBuzz.';
  return `<tr>
            <td align="center" style="padding:0 22px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.panelBg};border-radius:9px;">
                <tr>
                  <td style="padding:20px 20px 10px;font-family:${BRAND.font};">
                    <div style="font-size:16px;font-weight:bold;color:${BRAND.text};"><span style="color:${BRAND.purpleLight};">&#9679;</span> OfferBuzz</div>
                    <p style="margin:5px 0 0;color:#A9A9B2;font-size:11px;">Shop more. Save more.</p>
                  </td>
                  <td align="right" valign="middle" style="padding:20px 20px 10px;font-family:${BRAND.font};font-size:12px;">
                    <a href="${BRAND.siteUrl}" style="color:#D9D9E0;text-decoration:none;">Website</a>
                  </td>
                </tr>
                <tr><td colspan="2" style="padding:0 20px;"><div style="border-top:1px solid ${BRAND.rule};font-size:1px;line-height:1px;">&nbsp;</div></td></tr>
                <tr>
                  <td colspan="2" style="padding:12px 20px 20px;font-family:${BRAND.font};color:${BRAND.muted};font-size:11px;line-height:1.6;">
                    ${reason}<br><br>
                    &copy; ${new Date().getFullYear()} OfferBuzz. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
};

const p = (html: string) =>
  `<p style="margin:0 0 14px;font-family:${BRAND.font};font-size:15px;line-height:24px;color:${BRAND.body};">${html}</p>`;

export function layout(title: string, b: EmailBlock): string {
  const highlight = b.highlight
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:6px 0 20px;"><tr><td align="center" bgcolor="${BRAND.tileBg}" style="border:1px solid ${BRAND.tileBorder};border-radius:8px;padding:16px;font-family:${BRAND.font};font-size:32px;line-height:40px;letter-spacing:8px;font-weight:bold;color:${BRAND.text};">${b.highlight}</td></tr></table>`
    : '';
  const cta = b.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr><td bgcolor="${BRAND.purple}" style="border-radius:22px;"><a href="${b.cta.url}" target="_blank" style="display:inline-block;padding:13px 32px;font-family:${BRAND.font};font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:22px;">${b.cta.label} &rarr;</a></td></tr></table>`
    : '';
  const note = b.note
    ? `<p style="margin:0;font-family:${BRAND.font};font-size:12px;line-height:19px;color:${BRAND.muted};">${b.note}</p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.pageBg};font-family:${BRAND.font};">
<div style="display:none;font-size:1px;color:${BRAND.pageBg};line-height:1px;max-height:0;overflow:hidden;">${b.preheader}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.pageBg};">
<tr><td align="center" style="padding:24px 10px;">
  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:${BRAND.cardBg};">
    <tr><td align="center" style="padding:24px 24px 8px;">${logoBadge()}</td></tr>
    <tr><td style="padding:16px 30px 8px;">
      <h1 style="margin:0 0 14px;font-family:${BRAND.font};font-size:26px;line-height:32px;font-weight:800;letter-spacing:-0.5px;color:${BRAND.text};">${b.heading}</h1>
      ${b.paragraphs.map(p).join('\n      ')}
      ${highlight}
      ${cta}
      ${note}
    </td></tr>
    <tr><td style="height:20px;line-height:20px;font-size:0;">&nbsp;</td></tr>
    ${footer(Boolean(b.marketing))}
  </table>
</td></tr>
</table>
</body>
</html>
`;
}
