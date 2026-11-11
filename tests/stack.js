// 쌓기: 멀리 선 사람은 안 찍힘 · 찍힌 사람은 다시 안 찍힘 · 떠나면 다음 사람이 바로 찍힘 · 거리 설정 · 물리 엔진(Rapier)
const { chromium } = require('playwright'); const F = require('./lib/fake');
(async () => { const b = await chromium.launch({ args: F.args }); const { p, errors } = await F.open(b, { viewport: { width: 960, height: 720 } }); await F.mode(p, 'stack');
  const n = () => p.evaluate(() => window.__gyeol.STACK.n), out = {};
  await p.evaluate(() => { window.PPL = () => [{ x: 0.5, sc: 0.45, foot: 0.7 }]; }); await p.waitForTimeout(3500); out.farAlone = await n();
  await p.evaluate(() => { window.PPL = () => [{ x: 0.5, sc: 0.76 }]; }); await p.waitForTimeout(3300); out.first = await n();
  await p.waitForTimeout(3000); out.firstStays = await n();
  await p.evaluate(() => { window.PPL = () => []; }); await p.waitForTimeout(900);
  await p.evaluate(() => { window.PPL = () => [{ x: 0.52, sc: 0.72, arms: true }]; }); await p.waitForTimeout(3600); out.next = await n();
  /* 쌓기의 '멀리까지'는 전체 인식 거리 안에서만 통하므로, 이 장면은 인식 거리를 '모두'로 두고 본다 */ await p.evaluate(() => { window.__gyeol.S.range = 0; window.__gyeol.S.stackDist = 2; window.PPL = () => [{ x: 0.3, sc: 0.5, foot: 0.75 }]; }); await p.waitForTimeout(3600); out.farAllowed = await n();
  out.engine = await p.evaluate(() => window.__gyeol.STACK.kind);
  const ok = out.farAlone === 0 && out.first === 1 && out.firstStays === 1 && out.next === 2 && out.farAllowed === 3 && out.engine === 'rapier' && !errors.length;
  console.log(JSON.stringify({ ok, ...out, errors })); await b.close(); process.exit(ok ? 0 : 1); })();
