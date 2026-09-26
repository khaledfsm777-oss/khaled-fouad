const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { execSync } = require('child_process');

const publicDir = path.join(__dirname, '..', 'public');

// Master Royal Islamic Emerald Green & Brilliant Gold SVG for Al-Bunyan
const masterSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Full-Bleed Royal Islamic Emerald Green Background -->
    <radialGradient id="emeraldBg" cx="50%" cy="44%" r="65%">
      <stop offset="0%" stop-color="#115543" />
      <stop offset="35%" stop-color="#0A3C2F" />
      <stop offset="70%" stop-color="#062920" />
      <stop offset="100%" stop-color="#041A14" />
    </radialGradient>

    <!-- Radiant Golden Emerald Glow in Center -->
    <radialGradient id="goldenHubGlow" cx="50%" cy="42%" r="42%">
      <stop offset="0%" stop-color="#FCEAB0" stop-opacity="0.25" />
      <stop offset="50%" stop-color="#145A48" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#062920" stop-opacity="0" />
    </radialGradient>

    <!-- Pure Brilliant Metallic Gold Gradient -->
    <linearGradient id="goldPure" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FFFDF6" />
      <stop offset="20%" stop-color="#FCE184" />
      <stop offset="50%" stop-color="#DC9F25" />
      <stop offset="85%" stop-color="#A16F0F" />
      <stop offset="100%" stop-color="#734A05" />
    </linearGradient>

    <!-- Gleaming Lustrous Light Gold Gradient -->
    <linearGradient id="goldLight" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="#C79421" />
      <stop offset="40%" stop-color="#FFF9DF" />
      <stop offset="70%" stop-color="#FDE895" />
      <stop offset="100%" stop-color="#FFE075" />
    </linearGradient>

    <!-- Deep Golden Pillar Beam -->
    <linearGradient id="goldBeam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFDF6" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#F5C443" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#734A05" stop-opacity="0" />
    </linearGradient>

    <!-- Rich Realistic Drop Shadow Filter -->
    <filter id="vectorShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#020E0B" flood-opacity="0.8" />
    </filter>
  </defs>

  <!-- 1. FULL-BLEED ROYAL EMERALD GREEN CANVAS (Ensures zero black borders on any launcher/OS) -->
  <rect width="512" height="512" fill="url(#emeraldBg)" />

  <!-- 2. Radiant Center Glow -->
  <circle cx="256" cy="235" r="215" fill="url(#goldenHubGlow)" />

  <!-- 3. Islamic Sacred Geometry Outer Medallion Border (Double Gold Ring within Safe Zone) -->
  <circle cx="256" cy="250" r="226" stroke="url(#goldLight)" stroke-width="4.5" fill="none" opacity="0.95" />
  <circle cx="256" cy="250" r="218" stroke="url(#goldPure)" stroke-width="1.5" stroke-dasharray="5 4" fill="none" opacity="0.75" />
  <circle cx="256" cy="250" r="210" stroke="url(#goldLight)" stroke-width="0.8" fill="none" opacity="0.4" />

  <!-- 8 Sacred Islamic Geometric Gold Points around the Ring -->
  <g fill="url(#goldLight)" opacity="0.9">
    <circle cx="256" cy="24" r="3.5" />
    <circle cx="256" cy="476" r="3.5" />
    <circle cx="30" cy="250" r="3.5" />
    <circle cx="482" cy="250" r="3.5" />
    <circle cx="96" cy="90" r="3" />
    <circle cx="416" cy="90" r="3" />
    <circle cx="96" cy="410" r="3" />
    <circle cx="416" cy="410" r="3" />
  </g>

  <!-- 4. Astronomical & Mathematical Harmonic Grid (Al-Bunyan Numerical Balance) -->
  <g opacity="0.25">
    <circle cx="256" cy="225" r="175" stroke="url(#goldLight)" stroke-width="1" stroke-dasharray="3 5" fill="none" />
    <circle cx="256" cy="225" r="140" stroke="url(#goldPure)" stroke-width="0.75" fill="none" />
    <circle cx="256" cy="225" r="105" stroke="url(#goldLight)" stroke-width="0.75" stroke-dasharray="2 4" fill="none" />
    <line x1="256" y1="28" x2="256" y2="430" stroke="url(#goldPure)" stroke-width="0.75" stroke-dasharray="3 3" />
    <line x1="50" y1="225" x2="462" y2="225" stroke="url(#goldPure)" stroke-width="0.75" stroke-dasharray="3 3" />
    <line x1="112" y1="81" x2="400" y2="369" stroke="url(#goldLight)" stroke-width="0.6" />
    <line x1="112" y1="369" x2="400" y2="81" stroke="url(#goldLight)" stroke-width="0.6" />
  </g>

  <!-- 5. Harmonic Waveforms (Left and Right Wings representing energy frequency) -->
  <g opacity="0.45">
    <path d="M 52,225 Q 78,190 104,225 T 156,225 T 208,225" stroke="url(#goldLight)" stroke-width="2" fill="none" />
    <circle cx="104" cy="225" r="3.5" fill="url(#goldLight)" />
    <circle cx="156" cy="225" r="2.5" fill="url(#goldPure)" />
    <path d="M 304,225 Q 330,190 356,225 T 408,225 T 460,225" stroke="url(#goldLight)" stroke-width="2" fill="none" />
    <circle cx="356" cy="225" r="3.5" fill="url(#goldLight)" />
    <circle cx="408" cy="225" r="2.5" fill="url(#goldPure)" />
  </g>

  <!-- 6. Digital Balance Pillars / Minarets -->
  <g filter="url(#vectorShadow)">
    {/* Center Main Tower */}
    <path d="M 252,65 L 260,65 L 260,254 L 252,254 Z" fill="url(#goldPure)" />
    <path d="M 255,34 L 257,34 L 257,65 L 255,65 Z" fill="url(#goldLight)" />
    <circle cx="256" cy="28" r="6" fill="url(#goldLight)" />
    <circle cx="256" cy="28" r="2.5" fill="#FFFFFF" />

    {/* Left Pillars */}
    <path d="M 241,92 L 247,92 L 247,254 L 241,254 Z" fill="url(#goldPure)" opacity="0.95" />
    <circle cx="244" cy="87" r="4.5" fill="url(#goldLight)" />
    <path d="M 229,122 L 234,122 L 234,250 L 229,250 Z" fill="url(#goldPure)" opacity="0.85" />
    <circle cx="231.5" cy="117" r="4" fill="url(#goldLight)" />
    <path d="M 217,152 L 221,152 L 221,240 L 217,240 Z" fill="url(#goldPure)" opacity="0.7" />
    <circle cx="219" cy="148" r="3.5" fill="url(#goldLight)" />

    {/* Right Pillars */}
    <path d="M 265,92 L 271,92 L 271,254 L 265,254 Z" fill="url(#goldPure)" opacity="0.95" />
    <circle cx="268" cy="87" r="4.5" fill="url(#goldLight)" />
    <path d="M 278,122 L 283,122 L 283,250 L 278,250 Z" fill="url(#goldPure)" opacity="0.85" />
    <circle cx="280.5" cy="117" r="4" fill="url(#goldLight)" />
    <path d="M 291,152 L 295,152 L 295,240 L 291,240 Z" fill="url(#goldPure)" opacity="0.7" />
    <circle cx="293" cy="148" r="3.5" fill="url(#goldLight)" />
  </g>

  <!-- 7. Majestic Arabic Calligraphic Letter "ب" (Baa' for Al-Bunyan) -->
  <g filter="url(#vectorShadow)">
    <path 
      d="M 342,148 
         C 342,228 342,272 325,284
         C 303,299 209,299 187,279
         C 176,269 174,230 174,148
         L 191,148
         C 191,228 192,257 199,264
         C 218,279 294,279 314,264
         C 325,253 326,223 326,148
         Z" 
      fill="url(#goldPure)" 
      stroke="url(#goldLight)"
      stroke-width="1.2"
    />
    {/* Tilted Diamond Dot of Baa' */}
    <polygon 
      points="256,298 268,310 256,322 244,310" 
      fill="url(#goldLight)" 
      stroke="url(#goldPure)"
      stroke-width="1.5"
    />
  </g>

  <!-- 8. Stylized Open Holy Quran Book Foundation -->
  <g filter="url(#vectorShadow)">
    <polygon points="256,392 264,406 248,406" fill="url(#goldLight)" />
    {/* Right side page stack */}
    <path d="M 256,395 C 298,395 398,369 432,339 C 398,388 298,418 256,418 Z" fill="url(#goldPure)" />
    <path d="M 256,395 C 298,395 398,369 432,339" stroke="url(#goldLight)" stroke-width="3.8" fill="none" />
    <path d="M 256,387 C 298,387 388,362 422,334 C 388,378 298,404 256,404 Z" fill="#062920" stroke="url(#goldPure)" stroke-width="0.9" />
    <path d="M 256,379 C 298,379 378,356 412,329" stroke="url(#goldLight)" stroke-width="1.1" fill="none" opacity="0.9" />
    <path d="M 256,371 C 298,371 368,349 402,324" stroke="url(#goldPure)" stroke-width="0.75" fill="none" opacity="0.7" />

    {/* Left side page stack */}
    <path d="M 256,395 C 214,395 114,369 80,339 C 114,388 214,418 256,418 Z" fill="url(#goldPure)" />
    <path d="M 256,395 C 214,395 114,369 80,339" stroke="url(#goldLight)" stroke-width="3.8" fill="none" />
    <path d="M 256,387 C 214,387 124,362 90,334 C 124,378 214,404 256,404 Z" fill="#062920" stroke="url(#goldPure)" stroke-width="0.9" />
    <path d="M 256,379 C 214,379 134,356 100,329" stroke="url(#goldLight)" stroke-width="1.1" fill="none" opacity="0.9" />
    <path d="M 256,371 C 214,371 144,349 110,324" stroke="url(#goldPure)" stroke-width="0.75" fill="none" opacity="0.7" />
  </g>

  <!-- 9. Quranic Numeric Circuit Nodes (19, 9, 7) -->
  <g filter="url(#vectorShadow)">
    {/* Right: 19 */}
    <path d="M 280,132 L 318,132 L 334,116" stroke="url(#goldLight)" stroke-width="2" stroke-linecap="round" fill="none" />
    <circle cx="334" cy="116" r="19" fill="#062920" stroke="url(#goldLight)" stroke-width="2.8" />
    <text x="334" y="116" fill="url(#goldLight)" font-size="20" font-weight="900" font-family="'Amiri', 'Cairo', serif" text-anchor="middle" dominant-baseline="central">١٩</text>

    {/* Left: 9 */}
    <path d="M 232,132 L 194,132 L 178,116" stroke="url(#goldLight)" stroke-width="2" stroke-linecap="round" fill="none" />
    <circle cx="178" cy="116" r="19" fill="#062920" stroke="url(#goldLight)" stroke-width="2.8" />
    <text x="178" y="116" fill="url(#goldLight)" font-size="20" font-weight="900" font-family="'Amiri', 'Cairo', serif" text-anchor="middle" dominant-baseline="central">٩</text>

    {/* Bottom Left: 7 */}
    <path d="M 210,214 L 184,214 L 166,196" stroke="url(#goldLight)" stroke-width="2" stroke-linecap="round" fill="none" />
    <circle cx="166" cy="196" r="19" fill="#062920" stroke="url(#goldLight)" stroke-width="2.8" />
    <text x="166" y="196" fill="url(#goldLight)" font-size="20" font-weight="900" font-family="'Amiri', 'Cairo', serif" text-anchor="middle" dominant-baseline="central">٧</text>
  </g>

  <!-- 10. Golden Celestial Sparkles -->
  <g fill="#FFFDF6" opacity="0.9" filter="url(#vectorShadow)">
    <path d="M 124,84 Q 124,90 130,90 Q 124,90 124,96 Q 124,90 118,90 Q 124,90 124,84 Z" />
    <path d="M 388,84 Q 388,90 394,90 Q 388,90 388,96 Q 388,90 382,90 Q 388,90 388,84 Z" />
  </g>

  <!-- 11. Prominent Golden Inscription Badge: "البنيان" (Safely within lower boundary of 80% circle) -->
  <g filter="url(#vectorShadow)">
    <rect x="176" y="428" width="160" height="34" rx="17" fill="#062920" stroke="url(#goldLight)" stroke-width="2" />
    <text x="256" y="445" fill="url(#goldLight)" font-size="21" font-weight="900" font-family="'Amiri', 'Cairo', serif" text-anchor="middle" dominant-baseline="central" letter-spacing="1">البُنْيَان</text>
  </g>
</svg>`;

async function run() {
  console.log('Writing master SVG...');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), masterSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), masterSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), masterSvg);

  const svgBuffer = Buffer.from(masterSvg);

  console.log('Generating PNG icons with sharp...');
  
  // 512x512 standard & maskable
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'icon-maskable-512.png'));
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'icon.png'));

  // 192x192 standard & maskable
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'icon-maskable-192.png'));

  // 180x180 Apple Touch Icon (Required for iOS)
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Generating favicon.ico and icon.ico with ImageMagick convert...');
  try {
    execSync(`convert ${path.join(publicDir, 'icon-512.png')} -define icon:auto-resize=64,48,32,16 ${path.join(publicDir, 'favicon.ico')}`);
    execSync(`convert ${path.join(publicDir, 'icon-512.png')} -define icon:auto-resize=64,48,32,16 ${path.join(publicDir, 'icon.ico')}`);
    console.log('ICO files generated successfully.');
  } catch (err) {
    console.warn('ICO generation fallback:', err.message);
  }

  console.log('All icons generated successfully!');
}

run().catch(console.error);
