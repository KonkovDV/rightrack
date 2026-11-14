// Собирает 2_demo_otchet.pdf из 2_demo_otchet.html: четыре листа, теги для чтения с экрана,
// в свойствах файла только Right Track. Запуск: npm run pdf
import { chromium } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT || 4174);
const URL_ = `http://127.0.0.1:${PORT}/rightrack/2_demo_otchet.html`;

const server = spawn(process.execPath, ['tests/serve.mjs'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((ok, fail) => { server.stdout.once('data', ok); server.once('error', fail) });

try {
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const page = await browser.newPage({ viewport: { width: 1000, height: 1414 }, locale: 'ru-RU', timezoneId: 'Europe/Moscow' });
  await page.goto(URL_, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
  const raw = await page.pdf({ printBackground: true, preferCSSPageSize: true, tagged: true });
  await browser.close();

  const pdf = await PDFDocument.load(raw, { updateMetadata: false });
  if (pdf.getPageCount() !== 4) throw new Error(`ожидалось 4 листа, получилось ${pdf.getPageCount()}`);
  const now = new Date();
  pdf.setTitle('Right Track: экспресс-отчёт');
  pdf.setSubject('Экспресс-отчёт · ноябрь 2026');
  pdf.setAuthor('Right Track');
  pdf.setCreator('Right Track');
  pdf.setProducer('Right Track');
  pdf.setLanguage('ru-RU');
  pdf.setCreationDate(now);
  pdf.setModificationDate(now);
  const out = await pdf.save();
  const check = await PDFDocument.load(out, { updateMetadata: false });
  for (const [name, value] of [['автор', check.getAuthor()], ['программа', check.getCreator()], ['сборщик', check.getProducer()]])
    if (value !== 'Right Track') throw new Error(`в свойствах файла ${name}: ${value}`);
  await writeFile(new URL('../2_demo_otchet.pdf', import.meta.url), out);
  console.log(`2_demo_otchet.pdf: ${pdf.getPageCount()} листа, ${Math.round(out.length / 1024)} КБ`);
} finally {
  server.kill();
}
