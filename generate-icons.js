const sharp = require('sharp');

const svg = 
<svg width="512" height="512" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" fill="#0f172a" />
  <g transform="scale(0.75) translate(4, 4)" fill="none" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 7a16 16 20 0 1 10.98 4.362" />
    <path d="M12 12a13 13 0 0 1-8.66 5" />
    <path d="M16.83 13.634a16 16 0 0 1-9.267 7.328" />
    <path d="M8.17 15.366a16 16 0 0 1-1.713-11.69" />
    <circle cx="12" cy="12" r="10" />
  </g>
</svg>
;

sharp(Buffer.from(svg))
  .png()
  .toFile('public/apple-touch-icon.png')
  .then(() => console.log('apple-touch-icon.png generated'));

sharp(Buffer.from(svg))
  .resize(192, 192)
  .png()
  .toFile('public/icon-192.png')
  .then(() => console.log('icon-192.png generated'));

sharp(Buffer.from(svg))
  .resize(512, 512)
  .png()
  .toFile('public/icon-512.png')
  .then(() => console.log('icon-512.png generated'));
