import { chromium } from "playwright-core";
const SP="/tmp/claude-1000/-home-ubuntu/1351a65c-4727-4a61-8524-0b6659748271/scratchpad";
const b = await chromium.launch({ executablePath: "/home/ubuntu/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome", args: ["--no-sandbox","--allow-file-access-from-files"] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
for (const n of process.argv.slice(2)) {
  await p.goto("file://" + SP + "/" + n + ".html", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${SP}/explain/w1080-${n}.png` });
  console.log(n, "shot");
}
await b.close();
