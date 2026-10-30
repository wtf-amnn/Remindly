import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const outputDir = path.resolve(process.cwd(), 'public/icons');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Modern SVG icon with dark gradient and warm interconnected heart/connection emblem
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818cf8" />
      <stop offset="50%" stop-color="#c084fc" />
      <stop offset="100%" stop-color="#f472b6" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />
  <rect width="504" height="504" x="4" y="4" rx="124" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4" />

  <!-- Connecting Node Web (Subtle background network) -->
  <g opacity="0.25" stroke="#818cf8" stroke-width="2.5" stroke-dasharray="4 4">
    <line x1="120" y1="160" x2="256" y2="100" />
    <line x1="392" y1="160" x2="256" y2="100" />
    <line x1="120" y1="160" x2="160" y2="340" />
    <line x1="392" y1="160" x2="352" y2="340" />
    <line x1="160" y1="340" x2="256" y2="420" />
    <line x1="352" y1="340" x2="256" y2="420" />
  </g>

  <!-- Heart / Connection Core Silhouette with Glow -->
  <path
    d="M 256,396 C 248,390 136,290 136,204 C 136,150 176,112 228,112 C 248,112 272,124 284,140 C 296,124 320,112 340,112 C 392,112 432,150 432,204 C 432,290 320,390 312,396 L 284,418 C 267,432 250,432 240,422 Z"
    fill="none"
    stroke="url(#primaryGrad)"
    stroke-width="28"
    stroke-linecap="round"
    stroke-linejoin="round"
    filter="url(#glow)"
  />

  <!-- Network Nodes with pulsing core -->
  <!-- Left node -->
  <circle cx="160" cy="204" r="18" fill="#38bdf8" />
  <circle cx="160" cy="204" r="8" fill="#ffffff" />

  <!-- Right node -->
  <circle cx="408" cy="204" r="18" fill="#f472b6" />
  <circle cx="408" cy="204" r="8" fill="#ffffff" />

  <!-- Top Center node -->
  <circle cx="284" cy="140" r="14" fill="#c084fc" />

  <!-- Bottom Tip node -->
  <circle cx="284" cy="418" r="14" fill="#a78bfa" />

  <!-- Center sparkles / wishes star -->
  <path
    d="M 284,220 L 290,244 L 314,250 L 290,256 L 284,280 L 278,256 L 254,250 L 278,244 Z"
    fill="#ffffff"
    opacity="0.9"
  />
  <circle cx="230" cy="210" r="4" fill="#fbcfe8" />
  <circle cx="330" cy="290" r="5" fill="#bae6fd" />
</svg>
`;

async function generate() {
  const svgBuffer = Buffer.from(svgIcon);

  // Save the SVG icon as base
  fs.writeFileSync(path.resolve(process.cwd(), 'public/icons/icon.svg'), svgIcon.trim());
  fs.writeFileSync(path.resolve(process.cwd(), 'public/favicon.svg'), svgIcon.trim());

  // Generate 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve(outputDir, 'icon-192.png'));

  // Generate 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve(outputDir, 'icon-512.png'));

  // Generate apple-touch-icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve(outputDir, 'apple-touch-icon.png'));

  // Generate maskable icon (512x512 with safe padding)
  await sharp(svgBuffer)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: '#0f172a'
    })
    .png()
    .toFile(path.resolve(outputDir, 'maskable-icon-512.png'));

  console.log('Successfully generated all PWA icons in public/icons/');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
