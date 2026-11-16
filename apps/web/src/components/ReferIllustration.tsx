/** Flat illustration for the Refer & Earn page, drawn in the OfferBuzz palette (purple + yellow). Decorative only. */
export function ReferIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 560 270" role="img" aria-label="" aria-hidden className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ri-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F1EAFB" />
          <stop offset="1" stopColor="#E4D8F7" />
        </linearGradient>
        <linearGradient id="ri-shirt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8A57D6" />
          <stop offset="1" stopColor="#5E37A8" />
        </linearGradient>
        <linearGradient id="ri-shirt2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7242BD" />
          <stop offset="1" stopColor="#4F2F96" />
        </linearGradient>
        <linearGradient id="ri-lid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#D5C6F0" />
          <stop offset="1" stopColor="#9F7BE0" />
        </linearGradient>
        <linearGradient id="ri-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFD54A" />
          <stop offset="1" stopColor="#F4A900" />
        </linearGradient>
        <linearGradient id="ri-bubble" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9669D4" />
          <stop offset="1" stopColor="#5E37A8" />
        </linearGradient>
        <linearGradient id="ri-pin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8A57D6" />
          <stop offset="1" stopColor="#3E2477" />
        </linearGradient>
        <filter id="ri-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#4F2F96" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* backdrop + wavy lines */}
      <path d="M0 150 C20 80 90 56 170 70 C250 20 380 24 450 62 C530 70 560 130 548 190 C538 240 470 258 400 256 L120 258 C50 256 -4 214 0 150Z" fill="url(#ri-bg)" />
      <path d="M10 118 C80 150 140 70 230 96 S390 150 556 70" fill="none" stroke="#C9B6EE" strokeWidth="1.4" strokeDasharray="2 6" strokeLinecap="round" />
      <path d="M20 212 C120 176 210 244 330 206 S470 176 548 206" fill="none" stroke="#C9B6EE" strokeWidth="1.4" strokeDasharray="2 6" strokeLinecap="round" />
      <path d="M0 40 C60 20 110 36 170 22" fill="none" stroke="#D5C6F0" strokeWidth="1.2" strokeDasharray="2 6" strokeLinecap="round" />
      <circle cx="92" cy="40" r="4" fill="#B99DE4" />
      <circle cx="318" cy="24" r="3.5" fill="#F4B400" />
      <circle cx="430" cy="28" r="7" fill="#D5C6F0" />
      <circle cx="30" cy="150" r="5" fill="#D5C6F0" />
      <circle cx="540" cy="110" r="4" fill="#B99DE4" />
      <circle cx="205" cy="68" r="3" fill="#F4B400" />
      <circle cx="528" cy="206" r="5" fill="#D5C6F0" />

      {/* desk */}
      <rect x="40" y="252" width="480" height="7" rx="3.5" fill="#B99DE4" />
      <ellipse cx="262" cy="252" rx="150" ry="6" fill="#C9B6EE" opacity="0.8" />

      {/* chair back */}
      <path d="M338 128 C366 124 380 142 380 170 L380 250 L346 250 L346 170Z" fill="#2B1856" />
      <path d="M346 150 L346 250 L380 250 L380 170 C380 150 372 138 360 132Z" fill="#3E2477" />

      {/* torso (leaning toward the laptop) */}
      <path d="M254 156 C252 138 270 128 296 128 C326 130 346 150 350 190 L354 250 L274 250 C262 222 256 190 254 156Z" fill="url(#ri-shirt)" />
      <path d="M326 134 C344 148 350 176 352 212 L354 250 L330 250 C336 212 336 168 318 136Z" fill="#4F2F96" opacity="0.55" />
      {/* undershirt + collar */}
      <path d="M282 130 L298 156 L314 130 C304 124 292 124 282 130Z" fill="#2B1856" />
      <path d="M280 129 L296 158 L286 160 L270 138Z" fill="#9669D4" />
      <path d="M316 129 L300 158 L310 160 L326 138Z" fill="#7242BD" />

      {/* neck + head (3/4 view, looking at the laptop) */}
      <path d="M284 112 L284 134 C290 142 304 142 310 134 L310 112Z" fill="#DD9468" />
      <path d="M284 120 C290 130 304 130 310 120 L310 112 L284 112Z" fill="#C8815A" opacity="0.55" />
      {/* ear */}
      <ellipse cx="317" cy="98" rx="6.5" ry="9.5" fill="#E8A07A" />
      {/* face */}
      <path d="M276 70 C270 76 272 84 271 90 L267 100 C266 103 268 105 271 105 C270 110 271 115 275 120 C280 129 294 131 304 126 C318 121 325 108 325 90 C325 72 308 60 292 62 C284 63 279 66 276 70Z" fill="#F2B38C" />
      <path d="M296 126 C312 122 322 108 323 92 C322 108 312 120 296 126Z" fill="#E09A73" opacity="0.6" />
      <ellipse cx="292" cy="104" rx="7" ry="4.5" fill="#F0867A" opacity="0.4" />
      {/* hair: swept back quiff */}
      <path d="M266 86 C252 60 274 40 304 45 C330 50 337 76 328 104 C326 86 318 74 304 71 C290 68 278 74 274 88 C272 86 268 86 266 86Z" fill="#1F1B4A" />
      <path d="M318 76 L328 80 L327 104 L321 94Z" fill="#1F1B4A" />
      <path d="M282 56 C296 50 314 54 322 66" fill="none" stroke="#4F2F96" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      {/* eyebrow, eye, smile */}
      <path d="M277 82 Q285 76 293 81" fill="none" stroke="#1F1B4A" strokeWidth="3.6" strokeLinecap="round" />
      <ellipse cx="285" cy="91" rx="3.6" ry="4" fill="#1F1B4A" />
      <circle cx="286.2" cy="89.6" r="1.2" fill="#fff" />
      <path d="M275 112 Q285 125 299 113" fill="none" stroke="#7A3B2A" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M299 113 q3 -1 4 -5" fill="none" stroke="#C8815A" strokeWidth="1.6" strokeLinecap="round" />
      {/* headset */}
      <path d="M326 90 C332 54 288 42 270 66" fill="none" stroke="#F4B400" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="318" cy="98" r="12.5" fill="url(#ri-gold)" />
      <circle cx="318" cy="98" r="6.5" fill="#E09A00" />
      <path d="M318 110 C316 128 296 130 282 122" fill="none" stroke="#F4B400" strokeWidth="3" strokeLinecap="round" />
      <circle cx="280" cy="121" r="4.5" fill="url(#ri-gold)" />

      {/* far arm */}
      <path d="M318 156 C330 190 316 218 272 236" fill="none" stroke="#5E37A8" strokeWidth="21" strokeLinecap="round" strokeLinejoin="round" />
      {/* near arm */}
      <path d="M278 158 C284 196 272 220 236 236" fill="none" stroke="url(#ri-shirt2)" strokeWidth="23" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M252 232 L244 240" stroke="#2B1856" strokeWidth="6" strokeLinecap="round" />

      {/* laptop: back of the lid faces us, keyboard under the hands */}
      <path d="M100 242 L210 236 L292 244 L184 254Z" fill="#5E37A8" />
      <path d="M100 242 L184 254 L184 258 L100 246Z" fill="#2B1856" />
      <path d="M184 254 L292 244 L292 248 L184 258Z" fill="#3E2477" />
      <path d="M128 243.5 L212 238.5 M150 247.5 L232 241.5 M176 251 L262 243.5" fill="none" stroke="#9669D4" strokeWidth="2.4" strokeDasharray="5 4" strokeLinecap="round" />
      <path d="M98 170 L206 162 L210 236 L100 242Z" fill="url(#ri-lid)" />
      <path d="M98 170 L206 162 L210 236 L100 242Z" fill="none" stroke="#8A57D6" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M104 176 L200 169" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="154" cy="203" rx="10.5" ry="11" fill="url(#ri-gold)" />
      {/* hands on the keys */}
      <circle cx="238" cy="243" r="9.5" fill="#F2B38C" />
      <circle cx="272" cy="243" r="9" fill="#E8A07A" />

      {/* envelope */}
      <g filter="url(#ri-shadow)">
        <rect x="46" y="92" width="62" height="44" rx="8" fill="url(#ri-gold)" />
      </g>
      <path d="M50 99 L77 120 L104 99" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M50 130 L68 112 M104 130 L86 112" stroke="#fff" strokeOpacity="0.7" strokeWidth="2.4" strokeLinecap="round" />

      {/* white chat bubble */}
      <g filter="url(#ri-shadow)">
        <path d="M130 70 h50 a12 12 0 0 1 12 12 v18 a12 12 0 0 1 -12 12 h-30 l-12 12 v-12 h-8 a12 12 0 0 1 -12 -12 v-18 a12 12 0 0 1 12 -12z" fill="#fff" />
      </g>
      <circle cx="146" cy="91" r="3.6" fill="#4F2F96" />
      <circle cx="158" cy="91" r="3.6" fill="#7242BD" />
      <circle cx="170" cy="91" r="3.6" fill="#F4B400" />

      {/* paper plane */}
      <path d="M176 36 L232 16 L214 68 L200 50Z" fill="#7242BD" />
      <path d="M176 36 L200 50 L232 16Z" fill="#9F7BE0" />
      <path d="M200 50 L205 64 L214 68" fill="none" stroke="#5E37A8" strokeWidth="1.5" />

      {/* phone handset */}
      <path d="M346 36 C336 44 338 62 352 72 C360 78 368 78 374 74" fill="none" stroke="url(#ri-gold)" strokeWidth="10" strokeLinecap="round" />
      <path d="M362 30 q12 2 18 12 M364 18 q20 4 28 20" fill="none" stroke="#B99DE4" strokeWidth="2.4" strokeLinecap="round" />

      {/* rupee coin */}
      <g filter="url(#ri-shadow)">
        <circle cx="448" cy="38" r="22" fill="url(#ri-gold)" />
      </g>
      <circle cx="448" cy="38" r="16.5" fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="1.6" strokeDasharray="2 3.5" />
      <text x="448" y="47" textAnchor="middle" fontSize="23" fontWeight="800" fill="#2B1856" fontFamily="Inter, system-ui, sans-serif">₹</text>

      {/* location pin */}
      <path d="M470 82 c-14 0 -25 10 -25 23 c0 18 25 38 25 38 s25 -20 25 -38 c0 -13 -11 -23 -25 -23z" fill="url(#ri-pin)" />
      <circle cx="470" cy="105" r="9" fill="#fff" />
      <ellipse cx="470" cy="148" rx="12" ry="3.5" fill="#C9B6EE" />

      {/* purple chat bubble with dots */}
      <g filter="url(#ri-shadow)">
        <path d="M382 128 h46 a11 11 0 0 1 11 11 v16 a11 11 0 0 1 -11 11 h-28 l-12 12 v-12 h-6 a11 11 0 0 1 -11 -11 v-16 a11 11 0 0 1 11 -11z" fill="url(#ri-bubble)" />
      </g>
      <circle cx="395" cy="147" r="3.4" fill="#fff" />
      <circle cx="406" cy="147" r="3.4" fill="#fff" />
      <circle cx="417" cy="147" r="3.4" fill="#F4B400" />

      {/* text-lines bubble */}
      <g filter="url(#ri-shadow)">
        <path d="M388 186 h46 a10 10 0 0 1 10 10 v14 a10 10 0 0 1 -10 10 h-30 l-10 10 v-10 h-6 a10 10 0 0 1 -10 -10 v-14 a10 10 0 0 1 10 -10z" fill="#fff" />
      </g>
      <rect x="392" y="196" width="36" height="4" rx="2" fill="#9669D4" />
      <rect x="392" y="205" width="24" height="4" rx="2" fill="#D5C6F0" />

      {/* phone with QR */}
      <g filter="url(#ri-shadow)">
        <rect x="486" y="146" width="50" height="94" rx="10" fill="#3E2477" />
      </g>
      <rect x="491" y="155" width="40" height="76" rx="5" fill="#fff" />
      <rect x="503" y="149" width="16" height="3" rx="1.5" fill="#2B1856" />
      <rect x="494" y="160" width="34" height="38" rx="4" fill="#F6F3FB" />
      <rect x="494" y="160" width="34" height="38" rx="4" fill="none" stroke="#D5C6F0" strokeWidth="1" />
      <rect x="497.6" y="164.0" width="19.6" height="19.6" rx="1.4" fill="#2B1856" />
      <rect x="500.4" y="166.8" width="14.0" height="14.0" rx="0.8" fill="#fff" />
      <rect x="503.2" y="169.6" width="8.4" height="8.4" rx="0.8" fill="#2B1856" />
      <rect x="497.6" y="175.2" width="19.6" height="19.6" rx="1.4" fill="#2B1856" />
      <rect x="500.4" y="178.0" width="14.0" height="14.0" rx="0.8" fill="#fff" />
      <rect x="503.2" y="180.8" width="8.4" height="8.4" rx="0.8" fill="#2B1856" />
      <rect x="508.8" y="164.0" width="19.6" height="19.6" rx="1.4" fill="#2B1856" />
      <rect x="511.6" y="166.8" width="14.0" height="14.0" rx="0.8" fill="#fff" />
      <rect x="514.4" y="169.6" width="8.4" height="8.4" rx="0.8" fill="#2B1856" />
      <rect x="520.0" y="186.4" width="2.8" height="2.8" fill="#4F2F96" />
      <rect x="525.6" y="186.4" width="2.8" height="2.8" fill="#4F2F96" />
      <rect x="522.8" y="189.2" width="2.8" height="2.8" fill="#4F2F96" />
      <rect x="520.0" y="192.0" width="2.8" height="2.8" fill="#4F2F96" />
      <rect x="525.6" y="192.0" width="2.8" height="2.8" fill="#4F2F96" />
      <rect x="517.2" y="189.2" width="2.8" height="2.8" fill="#4F2F96" />
      <rect x="520.0" y="183.6" width="2.8" height="2.8" fill="#4F2F96" />
      <rect x="517.2" y="192.0" width="2.8" height="2.8" fill="#4F2F96" />
      <rect x="525.6" y="183.6" width="2.8" height="2.8" fill="#4F2F96" />
      <rect x="522.8" y="186.4" width="2.8" height="2.8" fill="#4F2F96" />
      <rect x="497" y="204" width="28" height="4" rx="2" fill="#9669D4" />
      <rect x="500" y="211" width="22" height="3" rx="1.5" fill="#D5C6F0" />
      <rect x="497" y="218" width="28" height="9" rx="4.5" fill="url(#ri-gold)" />

      {/* plant */}
      <path d="M34 214 L40 252 L72 252 L78 214Z" fill="#fff" />
      <path d="M36 224 L77 224 L76 230 L37 230Z" fill="#D5C6F0" />
      <path d="M56 214 C26 208 14 176 30 156 C52 168 62 192 56 214Z" fill="#7242BD" />
      <path d="M56 214 C84 204 92 176 80 152 C58 164 50 190 56 214Z" fill="#B99DE4" />
      <path d="M56 214 C48 190 54 168 66 150 C78 168 72 194 56 214Z" fill="#9669D4" />
      <path d="M56 214 C58 192 56 172 56 160" fill="none" stroke="#4F2F96" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
