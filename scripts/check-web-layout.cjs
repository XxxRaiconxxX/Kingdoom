const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const results = [];
  try {
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({width,height:900});
      await page.goto('http://127.0.0.1:5173/', {waitUntil:'domcontentloaded'});
      const nav = page.getByRole('navigation', {name:'Navegaci\u00f3n principal'});
      await nav.waitFor();
      for (const name of ['Inicio','Grimorio','Biblioteca','Mercado','Archivista']) {
        await nav.getByRole('button',{name,exact:true}).click();
        await page.waitForFunction(label => [...document.querySelectorAll('.kd-primary-nav button')]
          .some(button => button.textContent.trim() === label && button.getAttribute('aria-current') === 'page'), name);
        await page.locator('.kd-stage > section').first().waitFor({timeout:30000});
        if (name !== 'Inicio') await page.getByRole('button',{name:'Conectar',exact:true}).waitFor();
        const layout = await page.evaluate(() => {
          const shell = document.querySelector('.kd-primary-shell');
          const nav = document.querySelector('.kd-primary-nav');
          return { transform:getComputedStyle(shell).transform, viewport:document.documentElement.clientWidth,
            scroll:document.documentElement.scrollWidth, navTop:nav.getBoundingClientRect().top,
            controls:[...nav.querySelectorAll('button')].map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})) };
        });
        assert.equal(layout.transform,'none');
        assert.ok(layout.scroll <= layout.viewport + 1, `${name} at ${width}: horizontal overflow`);
        assert.ok(layout.controls.every(r=>r.w>=44 && r.h>=44), `${name} at ${width}: small navigation target`);
        assert.ok(width>=768 ? layout.navTop<40 : layout.navTop>600, 'Navigation placement');
        if(width===390 || width===1440) {
          await page.screenshot({path:`artifacts/${name.toLowerCase()}-${width}-after.png`});
        }
        if (name !== 'Inicio') {
          await page.getByRole('button',{name:'Conectar',exact:true}).click();
          await page.getByLabel('Nombre del jugador registrado',{exact:true}).waitFor();
        }
        results.push({width,section:name,...layout});
      }
    }
    assert.deepEqual(errors, [], 'Uncaught browser errors');
    fs.writeFileSync('artifacts/web-layout-results.json',JSON.stringify({results,errors},null,2));
    console.log(`PASS: ${results.length} section/viewport checks, zero uncaught errors`);
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
