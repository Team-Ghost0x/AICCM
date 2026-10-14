#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const targetDirs = [
  path.join(rootDir, "app"),
  path.join(rootDir, "components"),
];

// Banned patterns per Retake design specification
const BANNED_PATTERNS = [
  { pattern: /→/g, label: "Banned arrow character (→)" },
  { pattern: /\blorem\b/gi, label: "Banned lorem ipsum placeholder" },
  { pattern: /dangerouslySetInnerHTML/g, label: "Banned dangerouslySetInnerHTML" },
  { pattern: /console\.log\(/g, label: "Banned console.log statement" },
  { pattern: /:\s*any\b/g, label: "Banned ': any' type" },
  { pattern: /@ts-ignore/g, label: "Banned @ts-ignore directive" },
];

let totalViolations = 0;

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (/\.(tsx|ts|jsx|js|css)$/.test(entry.name)) {
      lintFile(fullPath);
    }
  }
}

function lintFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(rootDir, filePath);
  const lines = content.split("\n");

  lines.forEach((line, lineIndex) => {
    // Exclude comments that intentionally describe banned rules or scrubber animation exception
    if (line.includes("design-lint-ignore") || line.includes("animate-take-fade")) {
      return;
    }

    for (const { pattern, label } of BANNED_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        console.error(`[DESIGN LINT] ${relativePath}:${lineIndex + 1} - ${label}`);
        console.error(`  > ${line.trim()}`);
        totalViolations++;
      }
    }
  });
}

for (const dir of targetDirs) {
  scanDirectory(dir);
}

if (totalViolations > 0) {
  console.error(`\nDesign lint failed with ${totalViolations} violation(s).`);
  process.exit(1);
} else {
  console.log("Design lint passed. Clean grading-suite aesthetics maintained.");
  process.exit(0);
}
