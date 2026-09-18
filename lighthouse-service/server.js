import express from "express";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { chromium } from "playwright";
import dns from "node:dns/promises";
import net from "node:net";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const SERVICE_SECRET = process.env.LIGHTHOUSE_SERVICE_SECRET;

function requireAuth(req, res, next) {
  if (!SERVICE_SECRET) {
    return res.status(500).json({ error: "service_misconfigured" });
  }
  if (req.headers.authorization !== `Bearer ${SERVICE_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
}

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local, incl. cloud metadata endpoints
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80");
  }
  return false;
}

/**
 * This service accepts an arbitrary URL from an authenticated Seovate request and fetches it
 * with a real browser — an SSRF vector if left unchecked (e.g. pointing it at internal/cloud
 * metadata addresses). Only http(s) URLs whose resolved IPs are all public are allowed.
 */
async function assertSafeUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }
  if (parsed.hostname === "localhost" || parsed.hostname === "0.0.0.0") {
    throw new Error("That host isn't allowed");
  }
  const addresses = await dns.lookup(parsed.hostname, { all: true }).catch(() => []);
  if (addresses.length === 0) {
    throw new Error("Couldn't resolve that host");
  }
  if (addresses.some((a) => isPrivateIp(a.address))) {
    throw new Error("That host isn't allowed");
  }
  return parsed.toString();
}

const VALID_CATEGORIES = ["performance", "accessibility", "best-practices", "seo"];

function buildLighthouseConfig(device, categories) {
  const onlyCategories =
    Array.isArray(categories) && categories.length > 0
      ? categories.filter((c) => VALID_CATEGORIES.includes(c))
      : VALID_CATEGORIES;

  const settings =
    device === "desktop"
      ? {
          onlyCategories,
          formFactor: "desktop",
          screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
          throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
        }
      : { onlyCategories }; // lighthouse:default is already mobile-emulated

  return { extends: "lighthouse:default", settings };
}

/** Every audit with a real score — the same set Lighthouse's own report groups into
 *  "Opportunities" / "Diagnostics" / "Passed audits". */
function summarizeAudits(lhr) {
  return Object.values(lhr.audits || {})
    .filter((a) => a.score !== null && a.score !== undefined)
    .map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      score: a.score,
      scoreDisplayMode: a.scoreDisplayMode,
      displayValue: a.displayValue ?? null,
    }));
}

let chromePathCache = null;
function getChromePath() {
  if (!chromePathCache) chromePathCache = chromium.executablePath();
  return chromePathCache;
}

app.post("/audit", requireAuth, async (req, res) => {
  const { url, device, categories } = req.body ?? {};
  if (typeof url !== "string" || !url) {
    return res.status(400).json({ error: "missing_url" });
  }

  let safeUrl;
  try {
    safeUrl = await assertSafeUrl(url);
  } catch (err) {
    return res.status(400).json({ error: "invalid_url", message: err.message });
  }

  let chrome;
  try {
    chrome = await chromeLauncher.launch({
      chromePath: getChromePath(),
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    });

    const config = buildLighthouseConfig(device, categories);
    const runnerResult = await lighthouse(safeUrl, { port: chrome.port, output: "json" }, config);

    if (!runnerResult?.lhr) {
      throw new Error("Lighthouse produced no result");
    }

    const { lhr } = runnerResult;
    // auditRefs is how Lighthouse itself knows which audits belong to which category — carry
    // that grouping through instead of just a flat audit list, so the UI can render a real
    // per-category report (matching Lighthouse's own Performance/Accessibility/... sections).
    const categorySummaries = Object.fromEntries(
      Object.entries(lhr.categories || {}).map(([key, cat]) => [
        key,
        {
          title: cat.title,
          score: cat.score,
          auditIds: (cat.auditRefs || [])
            .map((ref) => ref.id)
            .filter((id) => lhr.audits?.[id]?.score !== null && lhr.audits?.[id]?.score !== undefined),
        },
      ])
    );

    res.json({
      url: lhr.finalDisplayedUrl || safeUrl,
      fetchedAt: lhr.fetchTime,
      device: device === "desktop" ? "desktop" : "mobile",
      categories: categorySummaries,
      audits: summarizeAudits(lhr),
    });
  } catch (err) {
    console.error("Lighthouse audit failed:", err);
    res.status(502).json({ error: "audit_failed", message: err.message });
  } finally {
    if (chrome) {
      try {
        await chrome.kill();
      } catch {
        // best-effort cleanup — the process may already be gone
      }
    }
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Lighthouse service listening on :${PORT}`);
});
