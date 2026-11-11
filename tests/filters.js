// 필터 목록: (1) 기본으로 꺼 두는 필터 여섯 개(도형·픽셀·스테인드글라스·모자이크 타일·색 그림자·먹 번짐)가 새 기기와 예전 설정이 남은 기기 모두에서 꺼져 있는지,
// 켜면 켜진 채로 남는지, (2) 필터별 머무는 시간(기본·2배·3배·5배)이 자동 전환에 반영되는지 본다.
const { chromium } = require('playwright'); const F = require('./lib/fake');
(async () => { const b = await chromium.launch({ args: F.args }); let bad = 0; const ok = (name, pass, info) => { console.log((pass ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!pass) bad++; };
  const OFF = ['shapes', 'pixel', 'stained', 'mosaic', 'cshadow', 'ink']; const errs = [];
  const open = async saved => { const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.route(/\/(models|vendor\/mediapipe)\//, r => r.abort());
    if (saved) await p.addInitScript(s => { try { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('gyeol.settings', s); sessionStorage.setItem('seeded', '1'); } } catch (e) {} }, JSON.stringify(saved));
    await p.goto(F.URL); await p.waitForTimeout(500); if (await p.isVisible('#btnSolo')) await p.click('#btnSolo'); await p.waitForTimeout(600); return { ctx, p }; };
  const st = p => p.evaluate(() => { const G = window.__gyeol; return { off: (G.S.off || []).slice().sort(), mode: G.mode.id, saved: JSON.parse(localStorage.getItem('gyeol.settings') || 'null') }; });
  // 1) 처음 여는 기기
  let { ctx, p } = await open(null); let s = await st(p); ok('새 기기: 여섯 필터가 꺼져 있다', OFF.every(id => s.off.includes(id)) && s.off.length === 6, s.off.join(',')); ok('새 기기: 꺼진 필터로 시작하지 않는다', !OFF.includes(s.mode), s.mode);
  const seen = []; for (let k = 0; k < 30; k++) { await p.keyboard.press('ArrowRight'); seen.push((await st(p)).mode); } ok('→ 키로 넘겨도 꺼진 필터는 안 나온다', !seen.some(id => OFF.includes(id)), [...new Set(seen)].length + '개 필터');
  // 켜면 켜진 채로 남는다 (새로고침 뒤에도)
  await p.evaluate(() => { const G = window.__gyeol; const i = G.MODES.findIndex(m => m.id === 'ink'); document.querySelectorAll('#modeList .switch input')[i].click(); }); await p.waitForTimeout(200); await p.reload(); await p.waitForTimeout(500); if (await p.isVisible('#btnSolo')) await p.click('#btnSolo'); await p.waitForTimeout(600);
  s = await st(p); ok('먹 번짐을 켜면 새로고침 뒤에도 켜져 있다', !s.off.includes('ink') && s.off.length === 5, s.off.join(',')); await ctx.close();
  // 2) 예전 설정이 남아 있는 기기 (필터를 끈 적 없음, 픽셀을 보고 있었음, 시는 직접 꺼 둠)
  ({ ctx, p } = await open({ off: ['poem'], mode: 3, auto: 0 })); s = await st(p); ok('예전 설정이 있는 기기: 여섯 필터가 꺼지고, 직접 꺼 둔 것도 그대로', OFF.every(id => s.off.includes(id)) && s.off.includes('poem') && s.off.length === 7, s.off.join(','));
  ok('보던 필터가 꺼졌으면 다음 필터로 넘어간다', !OFF.includes(s.mode) && s.mode !== 'poem', s.mode); await p.evaluate(() => { document.querySelector('#btnAllOn').click(); }); await p.reload(); await p.waitForTimeout(500); if (await p.isVisible('#btnSolo')) await p.click('#btnSolo'); await p.waitForTimeout(600);
  s = await st(p); ok('모두 켠 뒤에는 다시 꺼지지 않는다 (한 번만 적용)', s.off.length === 0, s.off.join(',')); await ctx.close();
  // 3) 필터별 머무는 시간
  ({ ctx, p } = await open(null)); await p.evaluate(() => { const G = window.__gyeol; G.S.crowd = false; G.S.off = G.MODES.map(m => m.id).filter(id => !['halftone', 'thermal', 'contour'].includes(id)); G.setMode(G.MODES.findIndex(m => m.id === 'halftone'));
    const i = G.MODES.findIndex(m => m.id === 'thermal'), btn = document.querySelectorAll('#modeList .dur')[i]; btn.click(); btn.click(); window.DUR = btn.textContent; G.S.auto = 2; window.LOG = []; let last = G.mode.id, t0 = performance.now(); setInterval(() => { const id = G.mode.id; if (id !== last) { window.LOG.push([last, +((performance.now() - t0) / 1000).toFixed(1)]); last = id; t0 = performance.now(); } }, 50); });
  await p.waitForTimeout(13500); const r = await p.evaluate(() => ({ log: window.LOG, dur: window.DUR, saved: JSON.parse(localStorage.getItem('gyeol.settings')).dur })); const of = id => r.log.filter(x => x[0] === id).map(x => x[1]);
  ok('단추를 두 번 누르면 3배', r.dur === '3배' && r.saved && r.saved.thermal === 3, r.dur + ' ' + JSON.stringify(r.saved)); const th = of('thermal'), co = of('contour');
  ok('3배로 둔 필터는 세 배 오래 나온다', th.length > 0 && th[0] > 5.4 && th[0] < 7, JSON.stringify(r.log)); ok('다른 필터는 기본 시간만큼', co.length > 0 && co[0] > 1.7 && co[0] < 2.8, JSON.stringify(co));
  ok('오류 없음', errs.length === 0, errs.slice(0, 3).join(' | ')); await b.close(); console.log(bad ? bad + '개 실패' : '모두 통과'); process.exit(bad ? 1 : 0); })();
