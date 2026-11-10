// 쌓기 · 사람이 많을 때: 지나다니는 사람 사이에 멈춰 선 한 명만 찍힘 · 나란히 멈춘 여럿은 한 명씩 차례로 · 추적이 끊겨도 찍힘 · 움직이기만 하면 안 찍힘
const { chromium } = require('playwright'); const F = require('./lib/fake');
(async () => { const b = await chromium.launch({ args: F.args }); const { p, errors } = await F.open(b, { viewport: { width: 960, height: 720 } }); await F.mode(p, 'stack');
  const n = () => p.evaluate(() => window.__gyeol.STACK.n), out = {}, clear = async () => { await p.evaluate(() => { window.PPL = () => []; }); await p.waitForTimeout(1300); };
  await p.evaluate(() => { window.__gyeol.S.stackDist = 2; });
  // 멈춘 한 명 앞뒤로 두 명이 계속 가로질러 다님 (겹침)
  await p.evaluate(() => { const t0 = performance.now(); window.PPL = () => { const t = (performance.now() - t0) / 1000; return [{ x: 0.5, sc: 0.74 }, { x: 0.5 + 0.34 * Math.sin(t * 2.6), sc: 0.7 }, { x: 0.5 + 0.38 * Math.sin(t * 2.1 + 2), sc: 0.66 }]; }; });
  await p.waitForTimeout(5200); out.stillAmongWalkers = await n(); await clear();
  // 네 명이 나란히 멈춰 섬
  const n1 = await n(); await p.evaluate(() => { window.PPL = () => [0.14, 0.38, 0.62, 0.86].map(x => ({ x, sc: 0.7 })); }); await p.waitForTimeout(7500); out.rowOfFour = (await n()) - n1; await clear();
  // 추적(자세·사람 찾기)이 자꾸 끊기는 멈춘 사람
  const n2 = await n(); await p.evaluate(() => { window.PPL = () => [{ x: 0.45, sc: 0.74, drop: 0.7, noobj: true }]; }); await p.waitForTimeout(4200); out.flakyTracking = (await n()) - n2; await clear();
  // 계속 움직이는 사람들뿐
  const n3 = await n(); await p.evaluate(() => { const t0 = performance.now(); window.PPL = () => { const t = (performance.now() - t0) / 1000; return [{ x: 0.5 + 0.36 * Math.sin(t * 2.4), sc: 0.72 }, { x: 0.5 + 0.36 * Math.sin(t * 2.0 + 2.5), sc: 0.68 }]; }; }); await p.waitForTimeout(5000); out.onlyWalkers = (await n()) - n3;
  const ok = out.stillAmongWalkers === 1 && out.rowOfFour === 4 && out.flakyTracking === 1 && out.onlyWalkers === 0 && !errors.length;
  console.log(JSON.stringify({ ok, ...out, errors })); await b.close(); process.exit(ok ? 0 : 1); })();
