import { BRAND, footer, logoBadge } from './layout';

/** Full campaign email (marketing). Params: {{ params.discount }} (number only) and {{ params.url }}. */
const tile = (badge: string, title: string, text: string) => `
                        <td width="50%" valign="top" style="padding:4px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.tileBg};border:1px solid ${BRAND.tileBorder};border-radius:7px;">
                            <tr><td style="padding:12px;color:${BRAND.text};font-family:${BRAND.font};">
                              <span style="display:inline-block;background:#F2F0FF;color:#24212E;border-radius:10px;padding:3px 7px;font-size:10px;font-weight:bold;">${badge}</span>
                              <p style="margin:9px 0 5px;font-size:13px;font-weight:bold;">${title}</p>
                              <p style="margin:0;color:#C5C5CD;font-size:11px;line-height:1.5;">${text}</p>
                            </td></tr>
                          </table>
                        </td>`;

const button = (label: string, block: boolean) =>
  `<a href="{{ params.url }}" style="display:${block ? 'block' : 'inline-block'};background:${BRAND.purple};color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;padding:13px ${block ? '18px' : '36px'};border-radius:22px;">${label}</a>`;

const stat = (big: string, small: string) =>
  `<td align="center" style="padding:17px 5px;font-family:${BRAND.font};"><div style="font-size:24px;font-weight:bold;color:${BRAND.text};">${big}</div><div style="margin-top:5px;color:#BDBDC5;font-size:9px;letter-spacing:1px;">${small}</div></td>`;

export const BLACK_FRIDAY_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>OfferBuzz | Black Friday Deals</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.pageBg};font-family:${BRAND.font};color:${BRAND.text};">
<div style="display:none;font-size:1px;color:${BRAND.pageBg};line-height:1px;max-height:0;overflow:hidden;">Big savings are here. Discover limited-time offers from OfferBuzz.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.pageBg};">
<tr><td align="center" style="padding:24px 10px;">
  <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:${BRAND.cardBg};">

    <tr><td align="center" style="padding:24px 24px 10px;">${logoBadge()}</td></tr>

    <tr><td align="center" style="padding:14px 30px 0;">
      <h1 style="margin:0;color:#F5F5F7;font-size:48px;line-height:0.98;font-weight:800;letter-spacing:-2px;font-family:${BRAND.font};">Black<br>Friday</h1>
      <p style="margin:14px 0 0;color:#D4D4D8;font-size:12px;line-height:1.6;max-width:390px;font-family:${BRAND.font};">Discover incredible deals and limited-time savings from shops near you. Shop more and save more with OfferBuzz.</p>
    </td></tr>

    <tr><td align="center" style="padding:22px 20px 25px;">
      <table role="presentation" width="142" height="142" cellspacing="0" cellpadding="0" border="0" style="width:142px;height:142px;background:#E7E4F8;border-radius:50%;">
        <tr><td align="center" valign="middle" style="color:#15151A;font-family:${BRAND.font};">
          <div style="font-size:12px;font-weight:bold;letter-spacing:1px;">UP TO</div>
          <div style="font-size:43px;line-height:1.05;font-weight:900;letter-spacing:-2px;">{{ params.discount }}%</div>
          <div style="font-size:13px;font-weight:bold;">OFF</div>
        </td></tr>
      </table>
      <p style="margin:12px 0 0;color:#BDBDC5;font-size:11px;font-family:${BRAND.font};">Limited-time deals. While offers last.</p>
    </td></tr>

    <tr><td align="center" style="padding:0 22px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.panelBg};border-radius:10px;">
        <tr><td align="center" style="padding:20px 16px 8px;font-family:${BRAND.font};">
          <h2 style="margin:0;color:#F6F6F8;font-size:20px;line-height:1.25;">Deals Worth Opening</h2>
          <p style="margin:7px 0 0;color:#BDBDC5;font-size:11px;line-height:1.5;">Your next great find could be just one click away.</p>
        </td></tr>
        <tr><td style="padding:8px 12px 4px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>${tile('HOT DEAL', 'Top Picks', 'Explore popular offers near you at prices you will love.')}${tile('BEST VALUE', 'Smart Savings', 'Find worthwhile offers without the extra searching.')}
            </tr>
            <tr>${tile('NEW FINDS', 'Fresh Offers', 'Check out new deals from local shops.')}${tile('LIMITED TIME', 'Don&#39;t Miss Out', 'Act while your favourite offers are available.')}
            </tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:12px 18px 20px;">${button('Explore All Deals &rarr;', true)}</td></tr>
      </table>
    </td></tr>

    <tr><td align="center" style="padding:30px 26px 8px;font-family:${BRAND.font};">
      <div style="font-size:30px;line-height:1;color:${BRAND.purpleLight};">&#10022;</div>
      <h2 style="margin:12px 0 7px;color:#F5F5F7;font-size:19px;">The Best Deals Won&#39;t Last</h2>
      <p style="margin:0;color:#C3C3CB;font-size:11px;line-height:1.6;">Find your favourites before these limited-time offers end.</p>
    </td></tr>

    <tr><td align="center" style="padding:14px 22px 0;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.panelBg};border-radius:9px;">
        <tr>${stat('LIMITED', 'TIME OFFERS')}${stat('BIG', 'SAVINGS')}${stat('NOW', 'SHOP DEALS')}</tr>
      </table>
    </td></tr>

    <tr><td align="center" style="padding:16px 22px 30px;">${button('Get Your Deal', false)}</td></tr>

    ${footer(true)}
  </table>
</td></tr>
</table>
</body>
</html>
`;
