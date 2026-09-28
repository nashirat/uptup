const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const fixture = JSON.parse(fs.readFileSync('workbook-fixture.json'));
const html = fs.readFileSync('index.html', 'utf8');
let code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
code = code.slice(0, code.indexOf('      (async function init()'));
const context = vm.createContext({ document: { getElementById: () => ({ value: String(fixture.upAwal) }) }, console, Date, Math, localStorage: {} });
vm.runInContext(code, context);
vm.runInContext(`rows = ${JSON.stringify(fixture.rows.map(({jenis,tanggal,nilai}, i) => ({id:i+1,jenis,tanggal,nilai,bulan:fixture.rows[i].A})))}; recalcAll()`, context);
const actual = JSON.parse(vm.runInContext('JSON.stringify({rows,summary:computeSummary()})', context));
for (let i=0; i<fixture.rows.length; i++) {
  const expected = fixture.rows[i], got = actual.rows[i];
  for (const [column, property] of Object.entries({F:'_totalUP',H:'_pctGUP',I:'_selisihHari',J:'_hariBulanPrev',K:'_gupIdeal',M:'_pctDisebulankan',N:'_pctSetoranTUP',O:'_nilaiKetepatan'})) {
    const value = expected[column];
    if (value === undefined || value === '' || value === '-') continue;
    assert.ok(Math.abs(Number(value)-Number(got[property])) < 1e-8,
      `row ${i+6} ${column}: expected ${value}, got ${got[property]}`);
  }
  if (expected.G) assert.equal(got._statusKetepatan, expected.G, `row ${i+6} G`);
  if (expected.P) assert.equal(got._keterangan, expected.P, `row ${i+6} P`);
}
assert.ok(Math.abs(actual.summary.nilaiKinerja - Number(fixture.summary.M52)) < 1e-12);
console.log(`Workbook comparison passed: ${fixture.rows.length} transactions, final score ${(actual.summary.nilaiKinerja*100).toFixed(8)}%`);
