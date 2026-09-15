import { chromium } from "playwright-core";
const SP="/tmp/claude-1000/-home-ubuntu/1351a65c-4727-4a61-8524-0b6659748271/scratchpad";
const TOKEN=process.env.T;
const b = await chromium.launch({ executablePath: "/home/ubuntu/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome", args: ["--no-sandbox"] });
const ctx = await b.newContext({ viewport: { width: 1500, height: 1100 } });
const p = await ctx.newPage();
await p.goto("https://paper.perp.so/frontiers1/arena/comp/admin", { waitUntil: "domcontentloaded" });
await p.fill('input[aria-label="Operator token"]', TOKEN);
await p.keyboard.press("Enter");
await p.waitForTimeout(3500);
const foot = await p.$(".cadm__wallfoot");
if (foot) { await foot.scrollIntoViewIfNeeded(); await foot.screenshot({ path: `${SP}/explain/desk-wall-panel.png` }); console.log("panel shot"); } else { await p.screenshot({ path: `${SP}/explain/desk-wall-panel.png` }); console.log("no foot, full shot"); }
// fire a flash and catch it on the public wall
const wall = await ctx.newPage(); await wall.setViewportSize({ width: 1920, height: 1080 });
await wall.goto("https://paper.perp.so/frontiers1/arena/comp", { waitUntil: "domcontentloaded" }); await wall.waitForTimeout(3000);
const r = await p.evaluate(async () => { const x = await fetch("/frontiers1/arena/comp/api/wall", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ moment: "liq" }) }); return x.status; });
console.log("fire", r);
await wall.waitForTimeout(3300);
await wall.screenshot({ path: `${SP}/explain/wall-rehearsal-liq.png` }); console.log("wall shot");
await b.close();
