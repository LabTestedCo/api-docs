// Node.js 20+. Uses a report JSON file that already contains its upload_id.
// Keep that file and the same idempotency key for retries across process restarts.
import { readFile } from 'node:fs/promises';
const [file, idempotencyKey] = process.argv.slice(2);
const key = process.env.LABTESTED_API_KEY;
if (!file || !key || !/^[A-Za-z0-9._:-]{8,128}$/.test(idempotencyKey || '')) {
  console.error('Usage: LABTESTED_API_KEY=... node examples/submit.mjs report.json IDEMPOTENCY_KEY');
  process.exit(1);
}
const base = process.env.LABTESTED_API_BASE || 'https://app.labtested.co/api/v1/labs';
const body = await readFile(file, 'utf8');
JSON.parse(body); // Fail locally if the input is not JSON.
for (let attempt = 0; attempt < 5; attempt++) {
  try {
    const response = await fetch(`${base}/reports`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(60_000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey }, body,
    });
    if (response.ok) { console.log(await response.text()); process.exit(0); }
    if (![429, 503].includes(response.status)) { console.error(await response.text()); process.exit(1); }
    const seconds = Number(response.headers.get('retry-after')) || 2 ** attempt;
    if (attempt < 4) await new Promise(resolve => setTimeout(resolve, Math.min(Math.max(seconds, 1), 300) * 1000));
  } catch {
    if (attempt < 4) await new Promise(resolve => setTimeout(resolve, 2 ** attempt * 1000));
  }
}
console.error('Delivery is not confirmed. Retry with the SAME report file and idempotency key.');
process.exit(1);
