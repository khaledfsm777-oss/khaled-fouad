import React from 'react';

interface BonyanLogoProps {
  className?: string;
  size?: number;
}

export default function BonyanLogo({ className = '', size = 80 }: BonyanLogoProps) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} dir="rtl">
      <svg
        width={size}
        height={size}
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 filter drop-shadow-xl"
      >
        <defs>
          {/* Deep Luxurious Islamic Emerald Green Circular Background Gradient */}
          <radialGradient id="navyGoldAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#115543" stopOpacity="1" />
            <stop offset="45%" stopColor="#0A3C2F" stopOpacity="1" />
            <stop offset="80%" stopColor="#062920" stopOpacity="1" />
            <stop offset="100%" stopColor="#041A14" stopOpacity="1" />
          </radialGradient>

          {/* Golden Sheen Overlay Glow */}
          <radialGradient id="goldenHubGlow" cx="50%" cy="45%" r="40%">
            <stop offset="0%" stopColor="#F5DF94" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#145A48" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#062920" stopOpacity="0" />
          </radialGradient>

          {/* Premium Metallic Gold Gradients */}
          <linearGradient id="goldPure" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFDF4" />
            <stop offset="25%" stopColor="#F3D575" />
            <stop offset="60%" stopColor="#C2962D" />
            <stop offset="100%" stopColor="#7B5606" />
          </linearGradient>

          <linearGradient id="goldLight" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#C2962D" />
            <stop offset="50%" stopColor="#FFF6D1" />
            <stop offset="100%" stopColor="#FFECA0" />
          </linearGradient>

          <linearGradient id="goldSpireBeam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFDF4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#E0B543" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7B5606" stopOpacity="0" />
          </linearGradient>

          {/* Soft Shadow Filter for realistic depth */}
          <filter id="vectorShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#010408" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* 1. Deep Royal Navy Background Badge with Gold Rim */}
        <circle cx="250" cy="250" r="235" fill="url(#navyGoldAura)" stroke="url(#goldLight)" strokeWidth="2.5" />
        <circle cx="250" cy="250" r="230" fill="url(#goldenHubGlow)" />
        <circle cx="250" cy="250" r="226" fill="none" stroke="url(#goldPure)" strokeWidth="0.75" opacity="0.4" />

        {/* 2. Abstract Astronomical Navigation / Geometrical Coordinate Grid */}
        <g opacity="0.18">
          <circle cx="250" cy="220" r="185" stroke="url(#goldLight)" strokeWidth="0.75" strokeDasharray="3 4" />
          <circle cx="250" cy="220" r="150" stroke="url(#goldPure)" strokeWidth="0.5" />
          <circle cx="250" cy="220" r="115" stroke="url(#goldLight)" strokeWidth="0.5" strokeDasharray="1 3" />
          
          {/* Dial Ticks */}
          <line x1="250" y1="15" x2="250" y2="425" stroke="url(#goldPure)" strokeWidth="0.5" strokeDasharray="2 3" />
          <line x1="45" y1="220" x2="455" y2="220" stroke="url(#goldPure)" strokeWidth="0.5" strokeDasharray="2 3" />
          
          {/* Diagonal Guides */}
          <line x1="105" y1="75" x2="395" y2="365" stroke="url(#goldLight)" strokeWidth="0.5" opacity="0.7" />
          <line x1="105" y1="365" x2="395" y2="75" stroke="url(#goldLight)" strokeWidth="0.5" opacity="0.7" />
        </g>

        {/* 3. Mathematical Waveforms (Left and Right Wings representing energy frequency) */}
        <g opacity="0.4">
          {/* Left Wave */}
          <path d="M 40,220 Q 65,185 90,220 T 140,220 T 190,220" stroke="url(#goldLight)" strokeWidth="1.5" fill="none" />
          <path d="M 40,220 Q 65,255 90,220 T 140,220 T 190,220" stroke="url(#goldPure)" strokeWidth="0.75" strokeDasharray="2 2" fill="none" />
          <circle cx="90" cy="220" r="3.5" fill="url(#goldLight)" />
          <circle cx="140" cy="220" r="2.5" fill="url(#goldPure)" />
          
          {/* Right Wave */}
          <path d="M 310,220 Q 335,185 360,220 T 410,220 T 460,220" stroke="url(#goldLight)" strokeWidth="1.5" fill="none" />
          <path d="M 310,220 Q 335,255 360,220 T 410,220 T 460,220" stroke="url(#goldPure)" strokeWidth="0.75" strokeDasharray="2 2" fill="none" />
          <circle cx="360" cy="220" r="3.5" fill="url(#goldLight)" />
          <circle cx="410" cy="220" r="2.5" fill="url(#goldPure)" />
        </g>

        {/* 4. Highly Symmetrical Digital Circuit Nodes & Towers */}
        <g filter="url(#vectorShadow)">
          {/* Symmetrical Vertical Minarets / Digital Frequency Pillars */}
          {/* Center Main Tower */}
          <path d="M 246,65 L 254,65 L 254,250 L 246,250 Z" fill="url(#goldPure)" />
          <path d="M 249,35 L 251,35 L 251,65 L 249,65 Z" fill="url(#goldLight)" />
          <circle cx="250" cy="30" r="5" fill="url(#goldLight)" />
          <circle cx="250" cy="30" r="2" fill="#FFFFFF" />

          {/* Left Pillar 1 */}
          <path d="M 235,90 L 240,90 L 240,250 L 235,250 Z" fill="url(#goldPure)" opacity="0.9" />
          <circle cx="237.5" cy="85" r="4" fill="url(#goldLight)" />
          {/* Left Pillar 2 */}
          <path d="M 223,120 L 227,120 L 227,245 L 223,245 Z" fill="url(#goldPure)" opacity="0.8" />
          <circle cx="225" cy="115" r="3.5" fill="url(#goldLight)" />
          {/* Left Pillar 3 */}
          <path d="M 211,150 L 214,150 L 214,235 L 211,235 Z" fill="url(#goldPure)" opacity="0.6" />
          <circle cx="212.5" cy="146" r="3" fill="url(#goldLight)" />

          {/* Right Pillar 1 */}
          <path d="M 260,90 L 265,90 L 265,250 L 260,250 Z" fill="url(#goldPure)" opacity="0.9" />
          <circle cx="262.5" cy="85" r="4" fill="url(#goldLight)" />
          {/* Right Pillar 2 */}
          <path d="M 273,120 L 277,120 L 277,245 L 273,245 Z" fill="url(#goldPure)" opacity="0.8" />
          <circle cx="275" cy="115" r="3.5" fill="url(#goldLight)" />
          {/* Right Pillar 3 */}
          <path d="M 286,150 L 289,150 L 289,235 L 286,235 Z" fill="url(#goldPure)" opacity="0.6" />
          <circle cx="287.5" cy="146" r="3" fill="url(#goldLight)" />
        </g>

        {/* 5. Majestic Arabic Calligraphic Letter "ب" (Baa' for Bonyan) */}
        <g filter="url(#vectorShadow)">
          {/* Baa' calligraphic ribbon */}
          <path 
            d="M 334,145 
               C 334,220 334,265 318,276
               C 298,290 202,290 182,272
               C 172,263 170,225 170,145
               L 185,145
               C 185,225 186,252 192,258
               C 210,272 288,272 308,258
               C 318,248 319,220 319,145
               Z" 
            fill="url(#goldPure)" 
          />

          {/* Tilted Diamond Dot of Letter "ب" */}
          <polygon 
            points="250,292 261,303 250,314 239,303" 
            fill="url(#goldLight)" 
          />
        </g>

        {/* 6. Stylized Open Holy Quran Book (Foundation at bottom) */}
        <g filter="url(#vectorShadow)">
          {/* Book Spine Center Pivot Accent */}
          <polygon points="250,392 257,405 243,405" fill="url(#goldLight)" />

          {/* RIGHT SIDE PAGE STACK */}
          {/* Thick external cover binding line */}
          <path d="M 250,395 C 290,395 390,370 425,340 C 390,388 290,418 250,418 Z" fill="url(#goldPure)" />
          <path d="M 250,395 C 290,395 390,370 425,340" stroke="url(#goldLight)" strokeWidth="3.5" fill="none" />
          {/* Delicate fanning sheets of the book */}
          <path d="M 250,387 C 290,387 380,363 415,335 C 380,378 290,404 250,404 Z" fill="#062920" stroke="url(#goldPure)" strokeWidth="0.75" />
          <path d="M 250,379 C 290,379 370,356 405,330" stroke="url(#goldLight)" strokeWidth="1" fill="none" opacity="0.8" />
          <path d="M 250,371 C 290,371 360,349 395,325" stroke="url(#goldPure)" strokeWidth="0.75" fill="none" opacity="0.6" />
          <path d="M 250,363 C 290,363 350,342 385,320" stroke="url(#goldLight)" strokeWidth="0.5" fill="none" opacity="0.4" />

          {/* LEFT SIDE PAGE STACK */}
          {/* Thick external cover binding line */}
          <path d="M 250,395 C 210,395 110,370 75,340 C 110,388 210,418 250,418 Z" fill="url(#goldPure)" />
          <path d="M 250,395 C 210,395 110,370 75,340" stroke="url(#goldLight)" strokeWidth="3.5" fill="none" />
          {/* Delicate fanning sheets of the book */}
          <path d="M 250,387 C 210,387 120,363 85,335 C 120,378 210,404 250,404 Z" fill="#062920" stroke="url(#goldPure)" strokeWidth="0.75" />
          <path d="M 250,379 C 210,379 130,356 95,330" stroke="url(#goldLight)" strokeWidth="1" fill="none" opacity="0.8" />
          <path d="M 250,371 C 210,371 140,349 105,325" stroke="url(#goldPure)" strokeWidth="0.75" fill="none" opacity="0.6" />
          <path d="M 250,363 C 210,363 150,342 115,320" stroke="url(#goldLight)" strokeWidth="0.5" fill="none" opacity="0.4" />
        </g>

        {/* 7. Floating Circuit Branches Ending in Numeric Nodes (Keys: 19, 9, 7) */}
        {/* Right branch ending in '١٩' (19) */}
        <g filter="url(#vectorShadow)">
          <path d="M 273,130 L 310,130 L 325,115" stroke="url(#goldLight)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="325" cy="115" r="17" fill="#062920" stroke="url(#goldPure)" strokeWidth="2.5" />
          <text 
            x="325" 
            y="115" 
            fill="url(#goldLight)" 
            fontSize="18" 
            fontWeight="900" 
            fontFamily="'Cairo', 'Space Grotesk', sans-serif" 
            textAnchor="middle" 
            dominantBaseline="central"
          >
            ١٩
          </text>
        </g>

        {/* Left branch ending in '٩' (9) */}
        <g filter="url(#vectorShadow)">
          <path d="M 227,130 L 190,130 L 175,115" stroke="url(#goldLight)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="175" cy="115" r="17" fill="#062920" stroke="url(#goldPure)" strokeWidth="2.5" />
          <text 
            x="175" 
            y="115" 
            fill="url(#goldLight)" 
            fontSize="18" 
            fontWeight="900" 
            fontFamily="'Cairo', 'Space Grotesk', sans-serif" 
            textAnchor="middle" 
            dominantBaseline="central"
          >
            ٩
          </text>
        </g>

        {/* Bottom Left branch ending in '٧' (7) */}
        <g filter="url(#vectorShadow)">
          <path d="M 205,210 L 182,210 L 165,193" stroke="url(#goldLight)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <circle cx="165" cy="193" r="17" fill="#062920" stroke="url(#goldPure)" strokeWidth="2.5" />
          <text 
            x="165" 
            y="193" 
            fill="url(#goldLight)" 
            fontSize="18" 
            fontWeight="900" 
            fontFamily="'Cairo', 'Space Grotesk', sans-serif" 
            textAnchor="middle" 
            dominantBaseline="central"
          >
            ٧
          </text>
        </g>

        {/* Subtle Sparkles of Light representing Mathematical Truth */}
        <g fill="#FFFFFF" opacity="0.8">
          <path d="M 120,80 Q 120,85 125,85 Q 120,85 120,90 Q 120,85 115,85 Q 120,85 120,80 Z" />
          <path d="M 380,80 Q 380,85 385,85 Q 380,85 380,90 Q 380,85 375,85 Q 380,85 380,80 Z" />
        </g>
      </svg>
    </div>
  );
}

export { BonyanLogo };
