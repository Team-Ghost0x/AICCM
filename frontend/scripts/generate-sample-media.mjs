import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const heroDir = path.join(rootDir, "public", "media", "hero");
const piecesDir = path.join(rootDir, "public", "media", "pieces");

fs.mkdirSync(heroDir, { recursive: true });
fs.mkdirSync(piecesDir, { recursive: true });

// Minimal 1x1 base JPEG or SVG rendered data
function createSvgDataUri(label, sub, bg, accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
    <rect width="800" height="1000" fill="${bg}"/>
    <circle cx="400" cy="500" r="280" fill="none" stroke="${accent}" stroke-width="2" opacity="0.3"/>
    <rect x="250" y="320" width="300" height="420" rx="4" fill="#000000" stroke="${accent}" stroke-width="4"/>
    <rect x="340" y="240" width="120" height="80" rx="2" fill="#111111" stroke="${accent}" stroke-width="2"/>
    <text x="400" y="520" font-family="monospace" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">${label}</text>
    <text x="400" y="560" font-family="sans-serif" font-size="16" fill="${accent}" text-anchor="middle">${sub}</text>
    <rect x="40" y="920" width="720" height="40" fill="#000000" opacity="0.5"/>
    <text x="60" y="946" font-family="monospace" font-size="14" fill="#ffffff">RETAKE // ITERATION ARCHIVE</text>
  </svg>`;
}

const takes = [
  { file: "take-1.jpg", label: "TAKE 01 / 23", sub: "Flat light, muddy shadows", bg: "#1a1a1a", accent: "#666666" },
  { file: "take-2.jpg", label: "TAKE 04 / 23", sub: "Off-centre composition, wet stone", bg: "#151515", accent: "#888888" },
  { file: "take-3.jpg", label: "TAKE 09 / 23", sub: "Rim light & droplets applied", bg: "#121212", accent: "#4fd1c5" },
  { file: "take-4.jpg", label: "TAKE 17 / 23", sub: "Cool teal reflections on basalt", bg: "#0d1314", accent: "#38b2ac" },
  { file: "take-5.jpg", label: "TAKE 23 (FINAL)", sub: "Mist added, 4K Magnific upscale", bg: "#070b0c", accent: "#e8341c" },
];

for (const t of takes) {
  const svg = createSvgDataUri(t.label, t.sub, t.bg, t.accent);
  fs.writeFileSync(path.join(heroDir, t.file), svg, "utf8");
}

for (let i = 1; i <= 8; i++) {
  const svg = createSvgDataUri(`PIECE 0${i}`, "Sample Portfolio Asset", "#181818", "#e8341c");
  fs.writeFileSync(path.join(piecesDir, `piece-${i}.jpg`), svg, "utf8");
}

for (let i = 1; i <= 3; i++) {
  const svg = createSvgDataUri(`PIECE 0${i} (DRAFT)`, "Initial Iteration Pass", "#242424", "#777777");
  fs.writeFileSync(path.join(piecesDir, `piece-${i}-draft.jpg`), svg, "utf8");
}

console.log("Sample media assets generated in public/media/");
