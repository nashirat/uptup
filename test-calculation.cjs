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
  assert.equal(String(got._gupKe), expected.C, `row ${i+6} C`);
  for (const [column, property] of Object.entries({F:'_totalUP',H:'_pctGUP',I:'_selisihHari',J:'_hariBulanPrev',K:'_gupIdeal',M:'_pctDisebulankan',N:'_pctSetoranTUP',O:'_nilaiKetepatan'})) {
    const value = expected[column];
    if (value === undefined || value === '' || value === '-') continue;
    assert.ok(Math.abs(Number(value)-Number(got[property])) < 1e-8,
      `row ${i+6} ${column}: expected ${value}, got ${got[property]}`);
  }
  if (expected.G) assert.equal(got._statusKetepatan, expected.G, `row ${i+6} G`);
  if (expected.L && expected.L !== '-') {
    const date = new Date(Date.UTC(1899, 11, 30) + Number(expected.L) * 86400000).toISOString().slice(0, 10);
    assert.equal(got._tglMaksGUP.slice(0, 10), date, `row ${i+6} L`);
  }
  if (expected.P) assert.equal(got._keterangan, expected.P, `row ${i+6} P`);
}
for (const [cell, property] of Object.entries({M51:'rataM',N51:'rataN',O51:'rataO'})) {
  assert.ok(Math.abs(actual.summary[property] - Number(fixture.summary[cell])) < 1e-12, `${cell} summary`);
}
assert.ok(Math.abs(actual.summary.nilaiKinerja - Number(fixture.summary.M52)) < 1e-12);
vm.runInContext(`rows = [{id:1, jenis:'GUP', tanggal:'2026-02-10', nilai:100}]; recalcAll()`, context);
assert.equal(vm.runInContext('rows[0]._tglMaksGUP.toISOString().slice(0, 10)', context), '2026-03-10');
console.log(`Workbook comparison passed: ${fixture.rows.length} transactions, final score ${(actual.summary.nilaiKinerja*100).toFixed(8)}%`);
