import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";
import { join } from "path";

const SCREENSHOT_DIR = "/home/ghost/aiccm/docs/screenshots";
mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function capture() {
  console.log("Launching Chrome for screenshots...");
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();

  // Seed authenticated brand user into localStorage
  await page.goto("http://localhost:3002/", { waitUntil: "networkidle0" });
  await page.evaluate(() => {
    const brandUser = {
      id: "usr_1024",
      name: "NexaWave Media",
      email: "brand@nexawave.in",
      company: "NexaWave Media",
      role: "brand",
      balanceInr: 1250000,
      credits: 500,
      provider: "email",
    };
    localStorage.setItem("retake_auth_user_v2", JSON.stringify(brandUser));
    localStorage.setItem("retake_token", "tok_brand_valid_session");
  });

  // 1. Creator search results (/discover)
  console.log("Capturing 1. Creator Search Results...");
  await page.goto("http://localhost:3002/discover?tool=runway-gen3", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: join(SCREENSHOT_DIR, "creator_search.png") });

  // 2. Creator profile (/creators/arjun-patel)
  console.log("Capturing 2. Creator Profile...");
  await page.goto("http://localhost:3002/creators/arjun-patel", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: join(SCREENSHOT_DIR, "creator_profile.png") });

  // 3. AI Portfolio item (scrolled into portfolio section)
  console.log("Capturing 3. AI Portfolio Item...");
  await page.evaluate(() => {
    window.scrollBy(0, 580);
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: join(SCREENSHOT_DIR, "portfolio_item.png") });

  // 4. Creative Brief Form (/briefs/new)
  console.log("Capturing 4. Creative Brief Form...");
  await page.goto("http://localhost:3002/briefs/new", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: join(SCREENSHOT_DIR, "brief_form.png") });

  await browser.close();
  console.log("All genuine screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
