/**
 * CVMatch AI Smoke Test
 * Tests key pages and features with Playwright/Chromium
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';
const DEMO_EMAIL = 'demo@cvmatch.ai';
const DEMO_PASSWORD = 'recruiter123';
const ADMIN_EMAIL = 'admin@cvmatch.ai';
const ADMIN_PASSWORD = 'admin123';

const results = [];
let jsErrors = [];

function log(status, label, detail = '') {
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : 'i';
  console.log(`  [${status}] ${label}${detail ? ' — ' + detail : ''}`);
  results.push({ status, label, detail });
}

async function collectJsErrors(page) {
  jsErrors = [];
  page.on('pageerror', (err) => jsErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') jsErrors.push(msg.text());
  });
}

async function loginAs(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for redirect away from /login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

async function checkPage(page, path, label, checks = {}) {
  jsErrors = [];
  try {
    const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: 20000 });
    const status = response?.status() ?? 'unknown';
    const title = await page.title();

    if (status >= 400) {
      log('FAIL', label, `HTTP ${status}`);
      return;
    }

    const errsBefore = [...jsErrors];

    // Run custom checks
    if (checks.countSelector) {
      const els = await page.$$(checks.countSelector);
      const count = els.length;
      const pass = checks.minCount ? count >= checks.minCount : true;
      log(
        pass ? 'PASS' : 'FAIL',
        label,
        `title="${title}" | ${checks.countLabel || 'elements'}=${count}${checks.minCount ? ` (expected >=${checks.minCount})` : ''}`
      );
    } else if (checks.textPresent) {
      const bodyText = await page.textContent('body');
      const found = checks.textPresent.every((t) => bodyText.includes(t));
      log(
        found ? 'PASS' : 'FAIL',
        label,
        `title="${title}" | looked for: ${checks.textPresent.join(', ')}`
      );
    } else {
      log('PASS', label, `title="${title}" | HTTP ${status}`);
    }

    if (errsBefore.length > 0) {
      errsBefore.forEach((e) => log('FAIL', `  JS error on ${path}`, e.substring(0, 120)));
    }
  } catch (err) {
    log('FAIL', label, err.message.substring(0, 120));
  }
}

async function run() {
  console.log('\n==============================');
  console.log(' CVMatch AI Smoke Test');
  console.log('==============================\n');

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();
  collectJsErrors(page);

  // ─── 1. Login as demo user ───────────────────────────────────────────
  console.log('── Scenario 1: Login as demo@cvmatch.ai ──');
  try {
    await loginAs(page, DEMO_EMAIL, DEMO_PASSWORD);
    const url = page.url();
    if (!url.includes('/login')) {
      log('PASS', 'Login (demo@cvmatch.ai)', `redirected to ${url}`);
    } else {
      log('FAIL', 'Login (demo@cvmatch.ai)', 'still on login page');
    }
  } catch (err) {
    log('FAIL', 'Login (demo@cvmatch.ai)', err.message.substring(0, 120));
  }

  // ─── 2. Check pages as demo user ─────────────────────────────────────
  console.log('\n── Scenario 2: Demo user pages ──');

  await checkPage(page, '/dashboard', 'GET /dashboard');

  // /vacancies — expect 10 vacancy cards (Card components in a grid)
  await checkPage(page, '/vacancies', 'GET /vacancies (10 vacancies)', {
    countSelector: '.grid .shadow-sm, [class*="card-hover"]',
    countLabel: 'vacancy cards',
    minCount: 10,
  });

  // /candidates — expect 60 candidates (Card components in space-y-3)
  await checkPage(page, '/candidates', 'GET /candidates (60 candidates)', {
    countSelector: '.space-y-3 .shadow-sm',
    countLabel: 'candidate cards',
    minCount: 60,
  });

  await checkPage(page, '/email', 'GET /email');
  await checkPage(page, '/analytics', 'GET /analytics');
  await checkPage(page, '/settings', 'GET /settings');

  // /support — new page: check it loads and shows the New Ticket button + Your Tickets section
  await checkPage(page, '/support', 'GET /support (support page)', {
    textPresent: ['Support', 'New Ticket', 'Your Tickets'],
  });

  // Click "New Ticket" and verify the form fields appear
  try {
    await page.goto(`${BASE_URL}/support`, { waitUntil: 'networkidle' });
    const newTicketBtn = await page.getByRole('button', { name: /new ticket/i }).first();
    if (!newTicketBtn) {
      log('FAIL', '/support New Ticket button', 'button not found');
    } else {
      await newTicketBtn.click();
      await page.waitForTimeout(400);
      // After click the subject input and message textarea should appear
      const subjectInput = await page.$('input[placeholder*="issue"]');
      const messageArea = await page.$('textarea[placeholder*="Describe"]');
      const hasSubject = !!subjectInput;
      const hasMessage = !!messageArea;
      log(
        hasSubject && hasMessage ? 'PASS' : 'FAIL',
        '/support New Ticket form opens',
        `subject input=${hasSubject}, message textarea=${hasMessage}`
      );
    }
  } catch (e) {
    log('FAIL', '/support form open check', e.message.substring(0, 120));
  }

  // ─── 3. Logout demo, login as admin ──────────────────────────────────
  console.log('\n── Scenario 3: Login as admin@cvmatch.ai ──');

  // Clear session by navigating to logout or clearing cookies
  try {
    await page.goto(`${BASE_URL}/api/auth/signout`, { waitUntil: 'networkidle' }).catch(() => {});
    await context.clearCookies();
  } catch (_) {}

  try {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const url = page.url();
    if (!url.includes('/login')) {
      log('PASS', 'Login (admin@cvmatch.ai)', `redirected to ${url}`);
    } else {
      log('FAIL', 'Login (admin@cvmatch.ai)', 'still on login page');
    }
  } catch (err) {
    log('FAIL', 'Login (admin@cvmatch.ai)', err.message.substring(0, 120));
  }

  // /admin — check for companies table and support tickets tab
  console.log('\n── Scenario 4: Admin page ──');
  await checkPage(page, '/admin', 'GET /admin', {
    textPresent: ['Companies', 'Support'],
  });

  // Check specifically for companies table and support tickets tab
  try {
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });

    const companiesTable = await page.$('table, [data-testid="companies-table"], [class*="companies"]');
    log(
      companiesTable ? 'PASS' : 'FAIL',
      '/admin has companies table',
      companiesTable ? 'table element found' : 'no table element found'
    );

    // Look for support tickets tab
    const bodyText = await page.textContent('body');
    const hasSupport = bodyText.toLowerCase().includes('support ticket') || bodyText.toLowerCase().includes('support');
    log(
      hasSupport ? 'PASS' : 'FAIL',
      '/admin has support tickets section',
      hasSupport ? 'support text found' : 'no support text found'
    );

    // Count companies rows if table found
    const rows = await page.$$('tbody tr');
    if (rows.length > 0) {
      log('INFO', `/admin companies table rows`, `${rows.length} rows`);
    }
  } catch (err) {
    log('FAIL', '/admin detailed check', err.message.substring(0, 120));
  }

  // ─── Summary ──────────────────────────────────────────────────────────
  await browser.close();

  const passes = results.filter((r) => r.status === 'PASS').length;
  const fails = results.filter((r) => r.status === 'FAIL').length;
  const infos = results.filter((r) => r.status === 'INFO').length;

  console.log('\n==============================');
  console.log(` SUMMARY: ${passes} PASS | ${fails} FAIL | ${infos} INFO`);
  console.log('==============================\n');

  if (fails > 0) {
    console.log('Failed checks:');
    results.filter((r) => r.status === 'FAIL').forEach((r) => {
      console.log(`  ✗ ${r.label}: ${r.detail}`);
    });
    console.log('');
  }

  process.exit(fails > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
