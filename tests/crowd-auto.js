// 혼잡 시간 자동 전환: 지나가는 사람이 계속 많으면 '붐빔'으로 판단해, 자동 전환이 가만히 서 있어야 하는 필터(쌓기 · 시)를 건너뛰는지 본다.
// 한산할 때·여럿이 서서 놀 때는 붐빔이 아니어야 하고, 그때는 쌓기·시가 차례대로 나와야 한다.
const { chromium } = require('playwright'); const F = require('./lib/fake');
(async () => { const b = await chromium.launch({ args: F.args }); let bad = 0; const ok = (name, pass, info) => { console.log((pass ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!pass) bad++; };
  const { p, errors } = await F.open(b); const st = () => p.evaluate(() => { const G = window.__gyeol, C = G.CROWD; return { on: C.on, v: +C.v.toFixed(2), runs: C.runs, occ: +C.occ.toFixed(2), flux: +C.flux.toFixed(2), mode: G.mode.id }; });
  const idx = id => p.evaluate(id => window.__gyeol.MODES.findIndex(m => m.id === id), id);
  // 자동 전환을 켜고 'before' 필터에서 기다렸을 때 다음에 나오는 필터
  const after = async before => { await p.evaluate(i => { const G = window.__gyeol; G.S.auto = 2; G.setMode(i); }, (await idx(before)) - 1 < 0 ? 0 : await idx(before) - 1); await p.waitForTimeout(3200); const m = (await st()).mode; await p.evaluate(() => { window.__gyeol.S.auto = 0; }); return m; };
  await p.evaluate(() => { const G = window.__gyeol; G.S.auto = 0; G.S.crowd = true; G.S.off = []; }); await F.mode(p, 'shapes');
  // 1) 두 사람이 서 있다 (한 명은 조금 흔들린다)
  await p.evaluate(() => { window.PPL = t => [{ x: 0.35, sc: 0.8 }, { x: 0.62 + 0.02 * Math.sin(t * 1.3), sc: 0.75 }]; }); await p.waitForTimeout(14000); let s = await st(); ok('두 사람이 서 있을 때: 붐빔 아님', !s.on, JSON.stringify(s));
  ok('한산할 때: 쌓기가 차례대로 나온다', (await after('stack')) === 'stack'); ok('한산할 때: 시가 차례대로 나온다', (await after('poem')) === 'poem');
  // 2) 네 친구가 나란히 서서 논다 (사람은 많지만 지나가지 않는다)
  await p.evaluate(() => { window.PPL = t => [{ x: 0.2, sc: 0.7 }, { x: 0.4 + 0.015 * Math.sin(t), sc: 0.72 }, { x: 0.6, sc: 0.7, arms: true }, { x: 0.8 + 0.015 * Math.sin(t * 0.7), sc: 0.68 }]; }); await F.mode(p, 'shapes'); await p.waitForTimeout(16000); s = await st(); ok('네 명이 서서 놀 때: 붐빔 아님', !s.on, JSON.stringify(s));
  // 3) 여섯 명이 저마다 다른 빠르기로 계속 지나간다
  await p.evaluate(() => { window.PPL = t => [0, 1, 2, 3, 4, 5].map(k => ({ x: (((0.16 + 0.05 * k) * t + k * 0.23) % 1.3) - 0.15, sc: 0.55 + 0.07 * k, foot: 0.8 + 0.03 * k })); }); await F.mode(p, 'shapes'); let tOn = -1; for (let k = 0; k < 30; k++) { await p.waitForTimeout(1000); if ((await st()).on) { tOn = k + 1; break; } }
  s = await st(); ok('여섯 명이 계속 지나갈 때: 붐빔으로 판단', tOn > 0, tOn + '초 · ' + JSON.stringify(s));
  const a1 = await after('stack'), a2 = await after('poem'); ok('붐빌 때: 자동 전환이 쌓기를 건너뛴다', a1 !== 'stack', '→ ' + a1); ok('붐빌 때: 자동 전환이 시를 건너뛴다', a2 !== 'poem', '→ ' + a2);
  await p.evaluate(() => { const G = window.__gyeol; G.S.auto = 90; G.setMode(G.MODES.findIndex(m => m.id === 'stack')); }); await p.waitForTimeout(8500); s = await st(); ok('붐빌 때 쌓기에 있으면 곧 다음 필터로 넘어간다', s.mode !== 'stack', '→ ' + s.mode);
  await p.evaluate(() => { const G = window.__gyeol; G.S.crowd = false; G.S.auto = 0; }); ok('설정을 끄면 붐벼도 쌓기가 나온다', (await after('stack')) === 'stack'); await p.evaluate(() => { window.__gyeol.S.crowd = true; });
  // 4) 한 사람이 가끔 지나간다 → 다시 한산
  await p.evaluate(() => { window.PPL = t => (t % 9 < 3 ? [{ x: ((t % 9) / 3) * 1.3 - 0.15, sc: 0.8 }] : []); }); await F.mode(p, 'shapes'); let tOff = -1; for (let k = 0; k < 40; k++) { await p.waitForTimeout(1000); if (!(await st()).on) { tOff = k + 1; break; } }
  ok('사람이 줄면 붐빔이 풀린다', tOff > 0, tOff + '초'); await p.waitForTimeout(12000); s = await st(); ok('한 사람이 가끔 지나갈 때: 붐빔 아님', !s.on, JSON.stringify(s));
  ok('오류 없음', errors.length === 0, errors.slice(0, 3).join(' | ')); await b.close(); console.log(bad ? bad + '개 실패' : '모두 통과'); process.exit(bad ? 1 : 0); })();
