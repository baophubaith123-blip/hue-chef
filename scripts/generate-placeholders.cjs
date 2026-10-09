const fs = require('fs');
const path = require('path');

const catColors = {
  bun:      { a: '#1D4ED8', b: '#3B82F6' },
  com:      { a: '#B45309', b: '#F59E0B' },
  banh:     { a: '#C2410C', b: '#F97316' },
  che:      { a: '#BE185D', b: '#EC4899' },
  nem:      { a: '#B91C1C', b: '#EF4444' },
  dacbiet:  { a: '#6D28D9', b: '#8B5CF6' },
};

const recipes = [
  ['bun-bo-hue',       'Bún bò Huế',       'bun',      'BB'],
  ['com-hen',          'Cơm hến',          'com',      'CH'],
  ['banh-beo',         'Bánh bèo',         'banh',     'BB'],
  ['banh-khoai',       'Bánh khoái',       'banh',     'BK'],
  ['banh-loc',         'Bánh lọc',         'banh',     'BL'],
  ['banh-nam',         'Bánh nậm',         'banh',     'BN'],
  ['che-hat-sen',      'Chè hạt sen',      'che',      'HS'],
  ['nem-lui',          'Nem lụi',          'nem',      'NL'],
  ['bun-thit-nuong',   'Bún thịt nướng',   'bun',      'BT'],
  ['banh-canh',        'Bánh canh',        'banh',     'BC'],
  ['banh-xeo',         'Bánh xèo Huế',     'banh',     'BX'],
  ['bun-mam',          'Bún mắm nêm',      'bun',      'BM'],
  ['com-am-phu',       'Cơm âm phủ',      'com',      'CA'],
  ['banh-bot-loc',     'Bánh bột lọc',     'banh',     'BL'],
  ['che-bap',          'Chè bắp',          'che',      'CB'],
];

const W = 400;
const H = 300;

const outDir = path.join(process.cwd(), 'public', 'images');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

let count = 0;
for (const [id, name, cat, abbr] of recipes) {
  const col = catColors[cat] || catColors.dacbiet;
  const two = String(abbr || name).slice(0, 2).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${col.a}"/>
      <stop offset="100%" stop-color="${col.b}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" rx="16" fill="url(#g)"/>
  <circle cx="${W / 2}" cy="${H / 2 - 28}" r="64" fill="rgba(255,255,255,0.2)"/>
  <text x="50%" y="44%" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial, sans-serif" font-size="60" font-weight="700">${two}</text>
  <text x="50%" y="80%" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="Arial, sans-serif" font-size="22" font-weight="600" opacity="0.96">${name}</text>
  <rect x="${W - 96}" y="12" width="76" height="22" rx="11" fill="rgba(255,255,255,0.22)"/>
  <text x="${W - 58}" y="28" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="700">${cat.toUpperCase()}</text>
</svg>
`;
  fs.writeFileSync(path.join(outDir, `${id}.svg`), svg, 'utf8');
  count += 1;
}
console.log(`Generated ${count} placeholders in ${outDir}`);
