/** Flat illustration for the Refer & Earn page, drawn in the OfferBuzz palette (purple + yellow). Decorative only. */
export function ReferIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 540 270" role="img" aria-label="" aria-hidden className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="ri-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#4F2F96" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* soft backdrop */}
      <path d="M30 150 C20 70 120 20 230 30 C340 8 470 30 505 110 C535 180 470 245 360 245 L140 248 C70 245 38 205 30 150Z" fill="#F6F3FB" />
      <path d="M20 120 C90 150 140 60 230 90 S380 130 520 60" fill="none" stroke="#D5C6F0" strokeWidth="1.5" strokeDasharray="3 6" strokeLinecap="round" />
      <path d="M40 230 C140 190 220 250 330 215 S470 190 520 215" fill="none" stroke="#D5C6F0" strokeWidth="1.5" strokeDasharray="3 6" strokeLinecap="round" />
      <circle cx="205" cy="22" r="5" fill="#B99DE4" />
      <circle cx="395" cy="26" r="7" fill="#D5C6F0" />
      <circle cx="28" cy="120" r="4" fill="#F4B400" />
      <circle cx="515" cy="170" r="4" fill="#B99DE4" />
      <circle cx="520" cy="90" r="5" fill="#D5C6F0" />
      <circle cx="170" cy="130" r="3" fill="#F4B400" />

      {/* floor shadow */}
      <ellipse cx="270" cy="236" rx="120" ry="8" fill="#D5C6F0" opacity="0.7" />

      {/* chair */}
      <path d="M205 150 C190 175 190 215 205 232 L335 232 C350 215 350 175 335 150Z" fill="#3E2477" />

      {/* torso */}
      <path d="M205 232 C203 190 208 160 232 150 L308 150 C332 160 337 190 335 232Z" fill="#5E37A8" />
      <path d="M252 150 L270 176 L288 150Z" fill="#EBE3F8" />

      {/* neck + head */}
      <rect x="259" y="124" width="22" height="30" rx="8" fill="#E8A57C" />
      <circle cx="270" cy="100" r="30" fill="#F2B38C" />
      <path d="M239 100 C236 70 262 62 280 67 C298 70 306 86 301 104 C298 92 290 84 276 84 C260 84 246 90 239 100Z" fill="#2B1856" />
      <circle cx="259" cy="104" r="2.6" fill="#2B1856" />
      <circle cx="281" cy="104" r="2.6" fill="#2B1856" />
      <path d="M260 115 Q270 124 280 115" fill="none" stroke="#2B1856" strokeWidth="2.4" strokeLinecap="round" />

      {/* headset */}
      <path d="M238 100 C236 66 304 66 302 100" fill="none" stroke="#F4B400" strokeWidth="4" strokeLinecap="round" />
      <rect x="231" y="94" width="10" height="20" rx="5" fill="#F4B400" />
      <rect x="299" y="94" width="10" height="20" rx="5" fill="#F4B400" />
      <path d="M236 114 C236 130 252 134 262 132" fill="none" stroke="#F4B400" strokeWidth="3" strokeLinecap="round" />
      <circle cx="264" cy="132" r="4" fill="#F4B400" />

      {/* arms to the keyboard */}
      <path d="M222 164 L204 214" stroke="#5E37A8" strokeWidth="20" strokeLinecap="round" />
      <path d="M318 164 L336 214" stroke="#5E37A8" strokeWidth="20" strokeLinecap="round" />
      <circle cx="204" cy="220" r="9" fill="#F2B38C" />
      <circle cx="336" cy="220" r="9" fill="#F2B38C" />

      {/* laptop (back of the lid faces us) */}
      <rect x="212" y="172" width="116" height="50" rx="6" fill="#B99DE4" />
      <rect x="212" y="172" width="116" height="50" rx="6" fill="none" stroke="#9669D4" strokeWidth="2" />
      <circle cx="270" cy="197" r="9" fill="#F4B400" />
      <rect x="192" y="222" width="156" height="9" rx="4.5" fill="#3E2477" />

      {/* QR card */}
      <g filter="url(#ri-shadow)">
        <rect x="52" y="52" width="68" height="68" rx="14" fill="#fff" />
      </g>
      <g fill="#4F2F96">
        <rect x="66" y="66" width="16" height="16" rx="3" />
        <rect x="90" y="66" width="16" height="16" rx="3" />
        <rect x="66" y="90" width="16" height="16" rx="3" />
        <rect x="90" y="92" width="6" height="6" />
        <rect x="100" y="100" width="6" height="6" />
        <rect x="90" y="102" width="6" height="4" />
      </g>
      <g fill="#fff">
        <rect x="71" y="71" width="6" height="6" />
        <rect x="95" y="71" width="6" height="6" />
        <rect x="71" y="95" width="6" height="6" />
      </g>

      {/* paper plane */}
      <path d="M150 32 L206 12 L186 64 L172 46Z" fill="#7242BD" />
      <path d="M150 32 L172 46 L206 12Z" fill="#9669D4" />
      <path d="M172 46 L178 60 L186 64" fill="none" stroke="#5E37A8" strokeWidth="1.5" />

      {/* rupee coin */}
      <g filter="url(#ri-shadow)">
        <circle cx="440" cy="62" r="30" fill="#F4B400" />
      </g>
      <circle cx="440" cy="62" r="23" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="2 4" />
      <text x="440" y="73" textAnchor="middle" fontSize="30" fontWeight="800" fill="#2B1856" fontFamily="Inter, system-ui, sans-serif">₹</text>

      {/* chat bubble */}
      <g filter="url(#ri-shadow)">
        <path d="M365 108 h64 a12 12 0 0 1 12 12 v22 a12 12 0 0 1 -12 12 h-40 l-14 14 v-14 h-10 a12 12 0 0 1 -12 -12 v-22 a12 12 0 0 1 12 -12z" fill="#fff" />
      </g>
      <circle cx="383" cy="131" r="4" fill="#4F2F96" />
      <circle cx="397" cy="131" r="4" fill="#7242BD" />
      <circle cx="411" cy="131" r="4" fill="#F4B400" />

      {/* location pin */}
      <path d="M470 120 c-16 0 -28 12 -28 27 c0 20 28 42 28 42 s28 -22 28 -42 c0 -15 -12 -27 -28 -27z" fill="#4F2F96" />
      <circle cx="470" cy="147" r="10" fill="#fff" />
      <ellipse cx="470" cy="196" rx="14" ry="4" fill="#D5C6F0" />

      {/* share badge */}
      <g filter="url(#ri-shadow)">
        <rect x="120" y="140" width="48" height="48" rx="12" fill="#fff" />
      </g>
      <g stroke="#4F2F96" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path d="M137 164 L152 156 M137 164 L152 172" />
      </g>
      <circle cx="136" cy="164" r="5" fill="#4F2F96" />
      <circle cx="153" cy="155" r="5" fill="#F4B400" />
      <circle cx="153" cy="173" r="5" fill="#7242BD" />

      {/* plant */}
      <path d="M62 232 L66 206 L96 206 L100 232Z" fill="#F4B400" />
      <path d="M81 206 C60 196 52 172 66 158 C84 168 90 190 81 206Z" fill="#9669D4" />
      <path d="M81 206 C96 192 100 166 90 150 C74 162 72 188 81 206Z" fill="#B99DE4" />
      <path d="M81 206 C84 190 84 176 82 164" fill="none" stroke="#5E37A8" strokeWidth="1.5" />
    </svg>
  );
}
