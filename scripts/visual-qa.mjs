import { chromium } from 'playwright';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const base = 'https://smc-headless-worker.hussain-gscx.workers.dev';
const browser = await chromium.launch({ headless: true });
const widths = [1440,1280,1024,768,430,390,375,360];
const metrics = [];

for (const width of widths) {
  const height = width <= 430 ? 844 : 900;
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(base + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
  metrics.push(await page.evaluate(() => ({
    path: location.pathname, width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    hero: document.querySelector('.hero')?.getBoundingClientRect().toJSON?.() || null,
    form: document.querySelector('[data-quote-form]')?.getBoundingClientRect().toJSON?.() || null,
    header: document.querySelector('.smc-header')?.getBoundingClientRect().toJSON?.() || null,
    h1: document.querySelector('.hero h1')?.getBoundingClientRect().toJSON?.() || null
  })));
  await page.screenshot({ path: 'qa-hero-' + width + '.jpg', type: 'jpeg', quality: 32, fullPage: false });
  if (width === 1440 || width === 390) await page.screenshot({ path: 'qa-full-' + width + '.jpg', type:'jpeg', quality:22, fullPage:true });
  await page.close();
}

for (const path of ['/free-quote','/contact-us','/faqs','/blogs','/terms-conditions','/privay-policy']) {
  for (const width of [1440,390]) {
    const page = await browser.newPage({ viewport: { width, height: width===390 ? 844 : 900 } });
    await page.goto(base + path, { waitUntil:'networkidle', timeout:60000 });
    await page.waitForTimeout(700);
    const p = path.replace(/\//g,'-').replace(/^-/, '');
    await page.screenshot({ path:'qa-' + p + '-' + width + '.jpg', type:'jpeg', quality:22, fullPage:true });
    metrics.push(await page.evaluate(() => ({path:location.pathname,width:innerWidth,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,sh:document.documentElement.scrollHeight})));
    await page.close();
  }
}

await browser.close();
fs.writeFileSync('qa-metrics.json', JSON.stringify(metrics,null,2));

const py = "from PIL import Image\nimport sys\nsrc,dst=sys.argv[1],sys.argv[2]\nim=Image.open(src)\nmaxw=min(720,im.width)\nif im.width>maxw:\n h=round(im.height*maxw/im.width); im=im.resize((maxw,h))\nim.save(dst,'JPEG',quality=28,optimize=True)";
for (const f of fs.readdirSync('.').filter(f => f.startsWith('qa-') && f.endsWith('.jpg'))) {
  const out = f.replace('.jpg','-review.jpg');
  execFileSync('python3',['-c',py,f,out]);
}

console.log('QA_METRICS_BEGIN');
console.log(fs.readFileSync('qa-metrics.json','utf8'));
console.log('QA_METRICS_END');
for (const f of fs.readdirSync('.').filter(f => f.endsWith('-review.jpg')).sort()) {
  console.log('QA_IMAGE_BEGIN ' + f);
  console.log(fs.readFileSync(f).toString('base64'));
  console.log('QA_IMAGE_END ' + f);
}