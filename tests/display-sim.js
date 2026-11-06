// 아이폰 센서 → 화면을 한 브라우저 안의 두 창으로 흉내 낸다 (중계 서버 없이). 화면 쪽 CPU를 느리게(기본 4배) 해서 모드마다 그리는 시간을 잰다
// node tests/display-sim.js [느리게 배수] [가로] [세로] [모드,모드]
const { chromium } = require('playwright'); const F = require('./lib/fake');
(async () => { const thr = +(process.argv[2] || 4), vw = +(process.argv[3] || 1920), vh = +(process.argv[4] || 1080), only = process.argv[5] ? process.argv[5].split(',') : null;
  const b = await chromium.launch({ args: F.args }); const { p: S, errors } = await F.open(b, { viewport: { width: 640, height: 480 } });
  await S.evaluate(() => { window.PPL = t => [{ x: 0.3 + 0.12 * Math.sin(t * 0.9), sc: 0.8, arms: Math.sin(t) > 0 }, { x: 0.68, sc: 0.72, arms: true }]; const ch = new BroadcastChannel('gy'); let seq = 0; window.B = 0; window.N = 0; setInterval(() => { const x = window.__gyeol.encodePacket3(seq++); window.B += x.byteLength; window.N++; ch.postMessage(x); }, 33); });
  const ctx = await b.newContext({ viewport: { width: vw, height: vh } }); const D = await ctx.newPage(); D.on('pageerror', e => errors.push('화면: ' + e.message));
  await D.goto(F.URL); await D.waitForTimeout(500);
  await D.evaluate(() => { const G = window.__gyeol; G.hideIntro(); G.A.remote = true; new BroadcastChannel('gy').onmessage = ev => G.decodePacket(ev.data); window.PT = {};
    G.MODES.forEach(m => { const d = m.draw; m.draw = function (...a) { const t0 = performance.now(), r = d.apply(this, a), q = window.PT[m.id] || (window.PT[m.id] = { s: 0, n: 0 }); q.s += performance.now() - t0; q.n++; return r; }; }); });
  const cdp = await ctx.newCDPSession(D); await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr }); await D.waitForTimeout(1500);
  const ids = await D.evaluate(() => window.__gyeol.MODES.map(m => m.id));
  for (const id of ids) { if (only && !only.includes(id)) continue; await F.mode(D, id); await D.waitForTimeout(1500); await D.evaluate(() => { window.PT = {}; }); await D.waitForTimeout(2000);
    const r = await D.evaluate(id => { const q = window.PT[id] || { s: 0, n: 1 }, G = window.__gyeol; return { ms: +(q.s / q.n).toFixed(1), lv: G.PERF.lv, people: G.A.presN }; }, id); console.log(id.padEnd(10), '그리기', String(r.ms).padStart(6), 'ms  품질단계', r.lv, '사람칸', r.people); }
  console.log('센서 한 번 전송 KB', await S.evaluate(() => +(window.B / window.N / 1024).toFixed(1)), errors.length ? errors.slice(0, 5) : '오류 없음'); await b.close(); })();
