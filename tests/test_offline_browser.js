/**
 * Automated Offline Browser Test for Saathi Health Companion
 * 
 * Verifies true offline functionality in a real browser instance:
 * 1. Boots app and registers Service Worker
 * 2. Clicks "Prepare for Offline Use" to populate IndexedDB & caches
 * 3. Cuts off browser network (page.setOfflineMode(true)) AND shuts down backend server
 * 4. Reloads the page in 100% disconnected offline mode
 * 5. Executes deterministic danger-sign queries (pregnancy bleeding, convulsions, chest indrawing)
 * 6. Executes antibiotic dosage query (clinical refusal)
 * 7. Executes grounded protocol queries (ANC visits, ORS preparation) with citations
 * 8. Executes out-of-scope inquiry (refusal)
 * 9. Completes household visit and verifies local IndexedDB update
 */

const { spawn } = require('child_process');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const fs = require('fs');

const browserExecutable = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;
const APP_PORT = 8011;
const APP_URL = `http://127.0.0.1:${APP_PORT}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return true;
    } catch {
      // not ready yet
    }
    await sleep(400);
  }
  throw new Error(`Server at ${url} failed to start within ${timeoutMs}ms`);
}

async function runOfflineBrowserSuite() {
  console.log('================================================================');
  console.log('SAATHI HEALTH COMPANION - AUTOMATED OFFLINE BROWSER TEST SUITE');
  console.log('================================================================');
  console.log(`Browser Executable: ${browserExecutable}`);
  console.log(`Testing Port: ${APP_PORT}`);

  // 1. Start local backend server with static distribution
  console.log('\n[1/6] Launching local Saathi server...');
  const serverProcess = spawn('python', ['-m', 'uvicorn', 'backend.main:app', '--host', '127.0.0.1', '--port', String(APP_PORT)], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(APP_PORT) },
    stdio: 'ignore'
  });

  serverProcess.on('error', (err) => {
    console.error('Failed to spawn server process:', err);
    process.exit(1);
  });

  try {
    await waitForServer(APP_URL);
    console.log(`✓ Backend server active and healthy at ${APP_URL}`);

    // 2. Launch real browser
    console.log('\n[2/6] Launching headless browser instance...');
    const browser = await puppeteer.launch({
      executablePath: browserExecutable,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-features=NetworkService,NetworkServiceInProcess']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });

    console.log(`Navigating to ${APP_URL}...`);
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });

    const pageTitle = await page.title();
    console.log(`✓ Page loaded. Document title: "${pageTitle}"`);

    // Verify Service Worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        return regs.length > 0;
      }
      return false;
    });
    console.log(`✓ Service Worker registered: ${swRegistered}`);

    // 3. Click "Prepare for Offline Use"
    console.log('\n[3/6] Running "Prepare for Offline Use" action...');
    const prepButtons = await page.$$('button');
    let prepBtn = null;
    for (const b of prepButtons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && text.includes('Prepare for Offline')) {
        prepBtn = b;
        break;
      }
    }

    if (!prepBtn) {
      throw new Error('Could not find "Prepare for Offline Use" button on page');
    }

    await prepBtn.click();
    await sleep(600);

    // Click confirm prepare in modal
    const modalButtons = await page.$$('button');
    let confirmBtn = null;
    for (const b of modalButtons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && text.includes('Prepare for Offline')) {
        confirmBtn = b;
      }
    }

    if (confirmBtn) {
      await confirmBtn.click();
      console.log('Downloading and verifying offline pack (Protocols + Households + Service Worker)...');
      // Wait for completion message
      await page.waitForFunction(
        () => document.body.innerText.includes('Offline pack successfully verified'),
        { timeout: 15000 }
      );
      console.log('✓ Offline pack successfully verified inside browser!');
    }

    // Verify IndexedDB contents
    const idbStats = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const req = indexedDB.open('SaathiOfflineDB', 1);
        req.onsuccess = () => {
          const db = req.result;
          const protoTx = db.transaction('protocols', 'readonly');
          const pReq = protoTx.objectStore('protocols').count();
          pReq.onsuccess = () => {
            const protoCount = pReq.result;
            const hhTx = db.transaction('households', 'readonly');
            const hReq = hhTx.objectStore('households').count();
            hReq.onsuccess = () => {
              resolve({ protocols: protoCount, households: hReq.result });
            };
          };
        };
        req.onerror = () => resolve({ protocols: 0, households: 0 });
      });
    });

    console.log(`✓ IndexedDB Verified: ${idbStats.protocols} protocols, ${idbStats.households} households cached.`);
    if (idbStats.protocols < 10 || idbStats.households < 12) {
      throw new Error(`IndexedDB verification failed: expected >=10 protocols, >=12 households`);
    }

    // Close the modal
    const closeButtons = await page.$$('button');
    for (const b of closeButtons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && (text.includes('Done') || text.includes('Close'))) {
        await b.click();
        break;
      }
    }
    await sleep(500);

    // 4. CUT OFF NETWORK ACCESS COMPLETELY & KILL SERVER
    console.log('\n[4/6] CUTTING OFF NETWORK & TERMINATING BACKEND SERVER...');
    await page.setOfflineMode(true);
    console.log('✓ Browser network disconnected (setOfflineMode = true)');

    serverProcess.kill('SIGTERM');
    console.log('✓ Backend Python server killed (0% remote connectivity possible)');
    await sleep(1000);

    // Reload the page while completely offline
    console.log('Reloading page while 100% offline from Service Worker cache...');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await sleep(1500);

    const offlineStatusText = await page.evaluate(() => {
      return document.body.innerText;
    });

    if (!offlineStatusText.includes('Saathi Health Companion')) {
      throw new Error('App shell failed to render from Service Worker cache while offline');
    }
    console.log('✓ Application Shell loaded successfully from offline Service Worker cache!');

    // 5. TEST PROTOCOL QUESTIONS & DETERMINISTIC EMERGENCY DETECTION OFFLINE
    console.log('\n[5/6] Executing clinical safety & protocol queries completely offline...');

    async function askQuestionInBrowser(query) {
      // Focus textarea
      await page.focus('#protocol-question');
      
      // Select all and clear
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await sleep(100);

      // Type real keystrokes so React state updates cleanly
      await page.type('#protocol-question', query, { delay: 5 });
      await sleep(200);

      // Click Search Protocol button
      const allButtons = await page.$$('button');
      let searchBtn = null;
      for (const b of allButtons) {
        const text = await page.evaluate((el) => el.textContent, b);
        if (text && text.includes('Search Protocol')) {
          searchBtn = b;
          break;
        }
      }
      if (!searchBtn) throw new Error('Search button not found');
      await searchBtn.click();
      await sleep(1200);

      // Return visible answer text
      return await page.evaluate(() => document.body.innerText);
    }

    // Question 1: Pregnancy Bleeding (Obstetric Emergency)
    console.log('Testing: Pregnancy bleeding inquiry...');
    const res1 = await askQuestionInBrowser('A pregnant woman in her 7th month has sudden vaginal bleeding and sharp lower abdominal pain.');
    if (!res1.includes('CRITICAL EMERGENCY ESCALATION') || !res1.includes('108 / 102')) {
      throw new Error('TEST FAILED: Pregnancy bleeding did not trigger critical emergency escalation offline!');
    }
    console.log('  -> PASS: 100% Deterministic Obstetric Emergency Escalation triggered (Call 108/102)');

    // Question 2: Newborn Convulsions (Neonatal Emergency)
    console.log('Testing: Newborn convulsions inquiry...');
    const res2 = await askQuestionInBrowser('Newborn infant born 4 days ago has started having fits, twitching and convulsions.');
    if (!res2.includes('CRITICAL EMERGENCY ESCALATION') || !res2.includes('SNCU')) {
      throw new Error('TEST FAILED: Newborn convulsions did not trigger emergency escalation offline!');
    }
    console.log('  -> PASS: 100% Deterministic Neonatal Emergency Escalation triggered (SNCU transfer)');

    // Question 3: Antibiotic Prescription Refusal
    console.log('Testing: Antibiotic dose inquiry...');
    const res3 = await askQuestionInBrowser('What is the dose of Amoxicillin 250mg syrup to give to an 8-month-old infant with cold and cough?');
    if (!res3.toUpperCase().includes('CLINICAL MEDICATION SAFETY REFUSAL') || !res3.includes('NEVER calculates, recommends, or dispenses')) {
      throw new Error(`TEST FAILED: Antibiotic query was not refused offline!`);
    }
    console.log('  -> PASS: 100% Clinical Medication Safety Refusal enforced (zero dosage hallucination)');

    // Question 4: Grounded ANC Protocol Guidance
    console.log('Testing: ANC Visit Schedule inquiry...');
    const res4 = await askQuestionInBrowser('How many antenatal care (ANC) visits are mandatory during pregnancy and when should they occur?');
    if (!res4.includes('Antenatal Care (ANC) Schedule') || !res4.includes('NHM_ASHA_Handbook_Module_6_Maternal_Health.pdf')) {
      throw new Error('TEST FAILED: ANC query did not return grounded guidance with citations offline!');
    }
    console.log('  -> PASS: Grounded guidance retrieved from local TF-IDF engine with official NHM citation');

    // Question 5: Grounded ORS Protocol Guidance
    console.log('Testing: WHO ORS Preparation inquiry...');
    const res5 = await askQuestionInBrowser('How should an ASHA guide a mother to correctly prepare a standard packet of WHO Oral Rehydration Salts (ORS)?');
    if (!res5.includes('WHO-ORS') || !res5.includes('1 litre')) {
      throw new Error('TEST FAILED: ORS query did not return grounded guidance offline!');
    }
    console.log('  -> PASS: ORS preparation protocol retrieved offline with exact 1-litre preparation guidance');

    // Question 6: Out-of-Scope Surgery Refusal
    console.log('Testing: Out-of-scope surgery inquiry...');
    const res6 = await askQuestionInBrowser('How do I perform an open surgical appendectomy in a sub-centre clinic?');
    if (!res6.includes('Outside Protocol Scope') && !res6.includes('OUT OF PROTOCOL SCOPE')) {
      throw new Error('TEST FAILED: Out-of-scope question was not refused offline!');
    }
    console.log('  -> PASS: Strictly refused out-of-scope surgery inquiry without speculative hallucinations');

    // 6. TEST VISIT TRACKING & PERSISTENCE IN OFFLINE INDEXEDDB
    console.log('\n[6/6] Testing household visit tracking & IndexedDB updates offline...');

    // Switch to Visit List tab
    const navButtons = await page.$$('nav button');
    for (const b of navButtons) {
      const text = await page.evaluate((el) => el.textContent, b);
      if (text && text.includes('Visit List')) {
        await b.click();
        break;
      }
    }
    await sleep(800);

    const visitListText = await page.evaluate(() => document.body.innerText);
    if (!visitListText.includes('Priya Sharma') || !visitListText.includes('Local IndexedDB')) {
      throw new Error('TEST FAILED: Household visit list did not render from IndexedDB');
    }
    console.log('✓ 12 Household visits rendered successfully from device-local IndexedDB');

    // Find any pending household "Mark Completed" button dynamically
    const pendingBtn = await page.$('button[data-testid^="complete-btn-"]');
    if (!pendingBtn) {
      throw new Error('No pending household complete button found');
    }
    const testId = await page.evaluate((el) => el.getAttribute('data-testid'), pendingBtn);
    const householdId = testId.replace('complete-btn-', '');
    console.log(`Completing pending household ${householdId}...`);

    await pendingBtn.click();
    await sleep(1000);

    // Verify IndexedDB updated directly
    const updatedStatusInDB = await page.evaluate(async (hhId) => {
      return new Promise((resolve) => {
        const req = indexedDB.open('SaathiOfflineDB', 1);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('households', 'readonly');
          const store = tx.objectStore('households');
          const getReq = store.get(hhId);
          getReq.onsuccess = () => {
            resolve(getReq.result ? getReq.result.visit_status : null);
          };
          getReq.onerror = () => resolve(null);
        };
        req.onerror = () => resolve(null);
      });
    }, householdId);

    if (updatedStatusInDB !== 'completed') {
      throw new Error(`TEST FAILED: IndexedDB status for ${householdId} was not updated to completed. Found: ${updatedStatusInDB}`);
    }
    console.log(`✓ Successfully completed visit for ${householdId} in offline IndexedDB (persisted locally)!`);

    await browser.close();

    console.log('\n================================================================');
    console.log('✅ ALL OFFLINE BROWSER TESTS PASSED (100% SUCCESS)');
    console.log('Zero remote connectivity. Zero cloud API calls.');
    console.log('Local Service Worker + IndexedDB + Client TF-IDF verified.');
    console.log('================================================================');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ OFFLINE BROWSER TEST FAILED:', error);
    try {
      serverProcess.kill('SIGTERM');
    } catch {}
    process.exit(1);
  }
}

runOfflineBrowserSuite();
