import { expect, test, type Page, type Request } from "@playwright/test";

// Ubon Ratchathani, with more decimals than the message keeps.
const HOME = { latitude: 15.2448453, longitude: 104.8472619 };
const EXPECTED_MESSAGE = "📍 พิกัดบ้านที่จะติดตั้งค่ะ\nhttps://maps.google.com/?q=15.244845,104.847262";

const PAGES = {
  tt: "547968391728736",
  tas: "127725476907107",
} as const;

const FORBIDDEN = ["ติดตั้งฟรี", "ไม่มีค่าแรกเข้า", "ครับ"];
const TELEMART = /telemart|เทเลมาร์ท/i;

const TRANSPARENT_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

/** Keeps the tests offline: map tiles, Messenger and the place search are stubbed. */
async function stubNetwork(page: Page) {
  await page.route(/tile\.openstreetmap\.org|arcgisonline\.com/, (route) =>
    route.fulfill({ status: 200, contentType: "image/png", body: TRANSPARENT_PNG }),
  );
  await page.route(/^https:\/\/m\.me\//, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<p>messenger</p>" }),
  );
  await page.route(/nominatim\.openstreetmap\.org/, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { place_id: 1, display_name: "ขามใหญ่, เมืองอุบลราชธานี, อุบลราชธานี", lat: "15.2800001", lon: "104.8300004" },
      ]),
    }),
  );
}

/** Every request the page makes, to prove the coordinates never leave the browser. */
function recordRequests(page: Page) {
  const seen: string[] = [];
  page.on("request", (request: Request) => {
    seen.push(`${request.url()} ${request.postData() ?? ""}`);
  });
  return seen;
}

async function readClipboard(page: Page) {
  // The Windows system clipboard stores line breaks as CRLF; phones keep LF.
  return (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n");
}

test.describe("location granted", () => {
  test.use({
    geolocation: { ...HOME, accuracy: 20 },
    permissions: ["geolocation", "clipboard-read", "clipboard-write"],
  });

  for (const key of ["tt", "tas"] as const) {
    test(`p=${key}: copies the Google Maps link and opens m.me of the right page`, async ({ page }) => {
      await stubNetwork(page);
      const requests = recordRequests(page);
      await page.goto(`/pin?p=${key}`);

      await page.getByRole("button", { name: "📍 ใช้ตำแหน่งปัจจุบัน" }).click();
      await expect(page.getByTestId("pin-status")).toContainText("ความแม่นยำประมาณ 20 เมตร");
      await expect(page.getByText("ถ้าไม่ได้อยู่บ้าน ลากหมุดไปที่บ้านได้เลยค่ะ")).toBeVisible();
      await expect(page.getByText("ตำแหน่งยังไม่ละเอียด")).toHaveCount(0);
      await expect(page.locator(".pin-marker")).toBeVisible();

      await page.getByRole("button", { name: "คัดลอกพิกัด แล้วกลับไปแชท" }).click();
      await expect(page.getByTestId("pin-copied")).toContainText("กดค้างที่ช่องพิมพ์ แล้วเลือกวาง จากนั้นกดส่ง");
      expect(await readClipboard(page)).toBe(EXPECTED_MESSAGE);
      await page.waitForURL(`https://m.me/${PAGES[key]}`);

      const leaked = requests.filter((line) => line.includes("15.24") || line.includes("104.84"));
      expect(leaked).toEqual([]);
    });
  }

  test("dragging the pin changes the copied coordinates", async ({ page }) => {
    await stubNetwork(page);
    await page.goto("/pin?p=tt");
    await page.getByRole("button", { name: "📍 ใช้ตำแหน่งปัจจุบัน" }).click();
    const marker = page.locator(".pin-marker");
    await expect(marker).toBeVisible();
    const box = (await marker.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 60, y + 40, { steps: 8 });
    await page.mouse.up();
    await expect(page.getByTestId("pin-status")).toContainText("ปักหมุดเองแล้วค่ะ");

    await page.getByRole("button", { name: "คัดลอกพิกัด แล้วกลับไปแชท" }).click();
    const copied = await readClipboard(page);
    expect(copied).toMatch(/^📍 พิกัดบ้านที่จะติดตั้งค่ะ\nhttps:\/\/maps\.google\.com\/\?q=\d+\.\d{6},\d+\.\d{6}$/);
    expect(copied).not.toBe(EXPECTED_MESSAGE);
  });
});

test.describe("low accuracy", () => {
  test.use({
    geolocation: { ...HOME, accuracy: 350 },
    permissions: ["geolocation", "clipboard-read", "clipboard-write"],
  });

  test("warns when the location is coarser than 100 m", async ({ page }) => {
    await stubNetwork(page);
    await page.goto("/pin");
    await page.getByRole("button", { name: "📍 ใช้ตำแหน่งปัจจุบัน" }).click();
    await expect(page.getByTestId("pin-status")).toContainText("ความแม่นยำประมาณ 350 เมตร");
    await expect(page.getByText("ตำแหน่งยังไม่ละเอียด ช่วยลากหมุดให้ตรงบ้านนะคะ")).toBeVisible();
  });
});

test.describe("location denied", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("falls back to search on a map of Thailand, then copies the chosen place", async ({ page }) => {
    await stubNetwork(page);
    // Behave like a customer who taps "Don't allow".
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (_ok, fail) => {
        fail?.({ code: 1, message: "User denied Geolocation", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
      };
    });
    await page.goto("/pin?p=tas");
    await page.getByRole("button", { name: "📍 ใช้ตำแหน่งปัจจุบัน" }).click();

    const manual = page.getByTestId("pin-manual");
    await expect(manual).toContainText("กด ⋯ มุมขวาบน แล้วเลือกเปิดในเบราว์เซอร์ จากนั้นลองใหม่");
    await expect(page.getByRole("button", { name: "คัดลอกพิกัด แล้วกลับไปแชท" })).toBeDisabled();

    const search = page.waitForRequest(/nominatim\.openstreetmap\.org/);
    await page.getByRole("searchbox").fill("ขามใหญ่");
    await page.getByRole("button", { name: "ค้นหา", exact: true }).click();
    const url = new URL((await search).url());
    expect(url.searchParams.get("countrycodes")).toBe("th");
    expect(url.searchParams.get("q")).toBe("ขามใหญ่");

    await page.getByRole("button", { name: /ขามใหญ่/ }).click();
    await expect(page.locator(".pin-marker")).toBeVisible();
    await page.getByRole("button", { name: "คัดลอกพิกัด แล้วกลับไปแชท" }).click();
    expect(await readClipboard(page)).toBe("📍 พิกัดบ้านที่จะติดตั้งค่ะ\nhttps://maps.google.com/?q=15.280000,104.830000");
    await page.waitForURL(`https://m.me/${PAGES.tas}`);
  });

  test("tapping the map places the pin when nothing is searched", async ({ page }) => {
    await stubNetwork(page);
    await page.goto("/pin?p=tt");
    await page.getByRole("button", { name: "ไม่ได้อยู่บ้าน ขอค้นหาเองค่ะ" }).click();
    await page.getByTestId("pin-map").click({ position: { x: 150, y: 150 } });
    await expect(page.locator(".pin-marker")).toBeVisible();
    await expect(page.getByRole("button", { name: "คัดลอกพิกัด แล้วกลับไปแชท" })).toBeEnabled();
  });
});

test.describe("clipboard blocked", () => {
  test.use({ geolocation: { ...HOME, accuracy: 20 }, permissions: ["geolocation"] });

  test("shows the message in a box to copy by hand, and does not leave the page", async ({ page }) => {
    await stubNetwork(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: () => Promise.reject(new Error("blocked")) },
      });
      document.execCommand = () => false;
    });
    await page.goto("/pin?p=tt");
    await page.getByRole("button", { name: "📍 ใช้ตำแหน่งปัจจุบัน" }).click();
    await page.getByRole("button", { name: "คัดลอกพิกัด แล้วกลับไปแชท" }).click();

    const box = page.getByRole("textbox", { name: "ข้อความพิกัดสำหรับคัดลอก" });
    await expect(box).toHaveValue(EXPECTED_MESSAGE);
    await expect(page.getByTestId("pin-chat-link")).toHaveAttribute("href", `https://m.me/${PAGES.tt}`);
    expect(page.url()).toContain("/pin");
  });
});

test.describe("page rules", () => {
  for (const [query, pageId, brand] of [
    ["?p=tt", PAGES.tt, "ตัวแทนทรูออนไลน์"],
    ["?p=tas", PAGES.tas, "True All Star"],
    ["", PAGES.tt, "ตัวแทนทรูออนไลน์"],
    ["?p=other", PAGES.tt, "ตัวแทนทรูออนไลน์"],
  ] as const) {
    test(`/pin${query}: brand, noindex, headers and wording`, async ({ page }) => {
      const response = await page.goto(`/pin${query}`);
      const headers = response!.headers();
      expect(headers["x-robots-tag"]).toContain("noindex");
      expect(headers["permissions-policy"]).toContain("geolocation=(self)");

      await expect(page.getByTestId("pin-brand")).toHaveText(brand);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

      // Only the one job: no site menu, footer, chat widget or cookie banner.
      await expect(page.locator("nav")).toHaveCount(0);
      await expect(page.locator("footer")).toHaveCount(0);
      await expect(page.getByLabel("การตั้งค่าคุกกี้")).toHaveCount(0);

      const html = await page.content();
      for (const word of FORBIDDEN) expect(html).not.toContain(word);
      if (pageId === PAGES.tas) expect(html).not.toMatch(TELEMART);
    });
  }

  test("/pin is not in the sitemap", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(await sitemap.text()).not.toContain("/pin");
  });
});

// Messenger's in-app browser on Android never shows the location prompt.
const ANDROID_MESSENGER_UA =
  "Mozilla/5.0 (Linux; Android 13; CPH2211 Build/TP1A.220905.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36 [FB_IAB/Orca-Android;FBAV/440.0.0.30.110;]";

test.describe("Android Messenger", () => {
  test.use({ userAgent: ANDROID_MESSENGER_UA });

  for (const key of ["tt", "tas"] as const) {
    test(`p=${key}: the main button opens this page in Chrome with auto-locate`, async ({ page }) => {
      await stubNetwork(page);
      await page.goto(`/pin?p=${key}`);
      const button = page.getByRole("link", { name: "📍 กดเพื่อส่งตำแหน่งบ้าน" });
      await expect(button).toBeVisible();
      const href = (await button.getAttribute("href"))!;
      expect(href.startsWith(`intent://localhost:`)).toBe(true);
      expect(href).toContain(`/pin?p=${key}&go=1#Intent;scheme=http;package=com.android.chrome;`);
      expect(href).toContain(`S.browser_fallback_url=${encodeURIComponent(new URL(`/pin?p=${key}`, page.url()).toString())};end`);
      await expect(page.getByText("ระบบจะเปิดแอป Chrome")).toBeVisible();
      await expect(page.getByRole("button", { name: "📍 ใช้ตำแหน่งปัจจุบัน" })).toHaveCount(0);
    });
  }

  test("the search fallback also offers Chrome and the type-it-in-chat way out", async ({ page }) => {
    await stubNetwork(page);
    await page.goto("/pin?p=tas");
    await page.getByRole("button", { name: "ไม่ได้อยู่บ้าน ขอค้นหาเองค่ะ" }).click();
    await expect(page.getByTestId("pin-chrome-manual")).toHaveAttribute("href", /^intent:\/\//);
    await expect(page.getByTestId("pin-manual")).toContainText("พิมพ์บอกชื่อหมู่บ้านในแชทได้เลย");
  });
});

test.describe("opened in Chrome from the Android button", () => {
  test.use({
    geolocation: { ...HOME, accuracy: 20 },
    permissions: ["geolocation", "clipboard-read", "clipboard-write"],
  });

  test("asks for the location without another tap and drops the flag from the address", async ({ page }) => {
    await stubNetwork(page);
    await page.goto("/pin?p=tt&go=1");
    await expect(page.getByTestId("pin-status")).toContainText("ความแม่นยำประมาณ 20 เมตร");
    expect(new URL(page.url()).searchParams.get("go")).toBeNull();
    await page.getByRole("button", { name: "คัดลอกพิกัด แล้วกลับไปแชท" }).click();
    expect(await readClipboard(page)).toBe(EXPECTED_MESSAGE);
    await page.waitForURL(`https://m.me/${PAGES.tt}`);
  });
});
