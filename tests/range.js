// 인식 거리: 화면에서 키가 정해진 비율보다 작게 보이는(더 먼) 사람은 모든 필터에서 빠지는지 본다.
// 사람 모양뿐 아니라 그 사람의 자세 점·사람 상자도 함께 빠져야 하고, 한계에 걸친 사람이 깜빡이면 안 된다.
// 가짜 사람의 화면 속 키는 대략 1.2 × sc − 0.14 (4:3 가짜 카메라를 16:9 화면에 꽉 채워서 위아래가 잘리기 때문)
const { chromium } = require('playwright'); const F = require('./lib/fake');
(async () => { const b = await chromium.launch({ args: F.args }); let bad = 0; const ok = (name, pass, info) => { console.log((pass ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!pass) bad++; };
  const { p, errors, ctx } = await F.open(b); const wait = ms => p.waitForTimeout(ms);
  // xs 자리(가로 0..1)마다 사람으로 잡힌 칸 수, 자세·상자 수, 지금의 한계
  const st = xs => p.evaluate(xs => { const G = window.__gyeol, A = G.A, R = G.RANGE, P = G.poseScreen(), B = G.objScreen();
    const band = x => { const cx = Math.round((G.S.mirror ? 1 - x : x) * A.w), r = Math.round(A.w * 0.06); let c = 0; for (let y = 0; y < A.h; y++) for (let xx = Math.max(0, cx - r); xx <= Math.min(A.w - 1, cx + r); xx++) if (A.p[y * A.w + xx] > 0.5) c++; return c; };
    return { seen: xs.map(band), poses: P ? P.length : 0, boxes: B ? B.length : 0, drop: R.drop, tall: +R.tall.toFixed(3), thr: +R.thr().toFixed(3) }; }, xs);
  const scene = (list, ms) => p.evaluate(l => { window.PPL = () => l; }, list).then(() => wait(ms || 1500));
  const set = (range, rangeH) => p.evaluate(([r, hh]) => { const G = window.__gyeol; G.S.range = r; G.S.rangeH = hh || 0; }, [range, rangeH]);
  ok('기본값은 약 3m', (await p.evaluate(() => window.__gyeol.S.range)) === 3 && Math.abs((await st([])).thr - 0.48) < 1e-6); await F.mode(p, 'shapes');
  // 1) 가까운 사람 · 먼 사람 · 둘이 함께
  await scene([{ x: 0.5, sc: 0.9 }]); let s = await st([0.5]); ok('가까운 사람(sc 0.9)은 보인다', s.seen[0] > 50 && s.poses === 1 && s.boxes === 1, JSON.stringify(s));
  await scene([{ x: 0.5, sc: 0.3 }]); s = await st([0.5]); ok('먼 사람(sc 0.3)은 안 보인다 · 자세와 상자도 빠진다', s.seen[0] === 0 && s.poses === 0 && s.boxes === 0 && s.drop >= 1, JSON.stringify(s));
  await scene([{ x: 0.3, sc: 0.9 }, { x: 0.75, sc: 0.3 }]); s = await st([0.3, 0.75]); ok('가까운 사람 + 먼 사람 → 가까운 사람만', s.seen[0] > 50 && s.seen[1] === 0, JSON.stringify(s));
  ok('필터가 쓰는 자세·상자 목록에서도 먼 사람이 빠진다', s.poses === 1 && s.boxes === 1, '자세 ' + s.poses + ' · 상자 ' + s.boxes);
  await F.mode(p, 'detect'); await wait(1500); const ppl = await p.evaluate(() => window.__gyeol.PEOPLE.list.length); ok('인식 필터가 세는 사람도 한 명', ppl === 1, ppl + '명'); await F.mode(p, 'shapes');
  // 2) 화면 아래에서 잘린 먼 사람 (카메라가 위를 향하면 먼 사람도 발이 잘린다)
  await scene([{ x: 0.5, sc: 0.6, foot: 1.15 }]); s = await st([0.5]); ok('발이 화면 아래로 잘린 먼 사람도 안 보인다', s.seen[0] === 0 && s.tall > 0.2 && s.tall < 0.48, JSON.stringify(s));
  // 3) 멀리서 걸어 들어온다: 한 번 나타나고, 한계 근처에서 깜빡이지 않는다
  const watch = async (ms) => { let on = 0, off = 0, prev = null; const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = (await st([0.5])).seen[0] > 20; if (prev !== null && v !== prev) { if (v) on++; else off++; } prev = v; await wait(60); } return { on, off, last: prev }; };
  await p.evaluate(() => { const t0 = performance.now(); window.PPL = () => { const t = (performance.now() - t0) / 1000; return [{ x: 0.5, sc: Math.min(0.9, 0.3 + 0.1 * t) }]; }; }); let w = await watch(7000); ok('멀리서 걸어 들어오면 한 번만 나타난다', w.on === 1 && w.off === 0 && w.last === true, JSON.stringify(w));
  await p.evaluate(() => { const t0 = performance.now(); window.PPL = () => { const t = (performance.now() - t0) / 1000; return [{ x: 0.5, sc: t < 1.5 ? 0.6 : 0.516 + 0.03 * Math.sin(t * 5) }]; }; }); await wait(1600); w = await watch(5000); s = await st([0.5]); ok('한계에 걸친 사람은 깜빡이지 않는다', w.on === 0 && w.off === 0 && w.last === true, JSON.stringify(w) + ' 키 ' + s.tall);
  await p.evaluate(() => { const t0 = performance.now(); window.PPL = () => { const t = (performance.now() - t0) / 1000; return [{ x: 0.5, sc: Math.max(0.3, 0.6 - 0.1 * t) }]; }; }); w = await watch(5000); ok('멀어지면 한 번만 사라진다', w.on === 0 && w.off === 1 && w.last === false, JSON.stringify(w));
  // 4) 모두 · 약 5m
  await set(0); await scene([{ x: 0.3, sc: 0.9 }, { x: 0.75, sc: 0.3 }]); s = await st([0.3, 0.75]); ok('모두: 먼 사람도 보인다', s.seen[0] > 50 && s.seen[1] > 10 && s.poses === 2 && s.boxes === 2, JSON.stringify(s));
  await set(5); await scene([{ x: 0.3, sc: 0.45 }, { x: 0.75, sc: 0.3 }]); s = await st([0.3, 0.75]); ok('약 5m: sc 0.45는 보이고 sc 0.3은 빠진다', s.seen[0] > 20 && s.seen[1] === 0 && Math.abs(s.thr - 0.36) < 1e-6, JSON.stringify(s));
  await set(3); await wait(800); s = await st([0.3, 0.75]); ok('약 3m: sc 0.45도 빠진다', s.seen[0] === 0 && s.seen[1] === 0, JSON.stringify(s));
  // 5) 현장에서 직접 맞추기: sc 0.4인 사람이 선 자리를 한계로
  await scene([{ x: 0.5, sc: 0.4 }]); const tall = (await st([0.5])).tall; await p.evaluate(() => window.__gyeol.RANGE.cal(1)); await wait(1800); const cal = await p.evaluate(() => { const S = window.__gyeol.S; return { range: S.range, rangeH: +S.rangeH.toFixed(3), note: document.querySelector('#rangeNote').textContent, def: document.querySelector('#btnRangeDef').style.display }; });
  ok('직접 맞추기: 그때 키의 92%가 한계가 된다', cal.range === 3 && Math.abs(cal.rangeH - tall * 0.92) < 0.02 && cal.def !== 'none' && cal.note.includes(Math.round(cal.rangeH * 100) + '%'), JSON.stringify(cal) + ' 키 ' + tall);
  await scene([{ x: 0.3, sc: 0.4 }, { x: 0.75, sc: 0.3 }]); s = await st([0.3, 0.75]); ok('맞춘 뒤: sc 0.4는 보이고 sc 0.3은 빠진다', s.seen[0] > 15 && s.seen[1] === 0, JSON.stringify(s));
  await scene([]); await p.evaluate(() => window.__gyeol.RANGE.cal(1)); await wait(1800); ok('아무도 없으면 맞추기를 거절한다', Math.abs((await p.evaluate(() => window.__gyeol.S.rangeH)) - cal.rangeH) < 1e-3);
  await p.evaluate(() => document.querySelector('#btnRangeDef').click()); ok('기본값으로 되돌리기', (await p.evaluate(() => window.__gyeol.S.rangeH)) === 0 && Math.abs((await st([])).thr - 0.48) < 1e-6);
  // 6) 계산 시간: 네 사람이 있는 장면에서 한 번에 드는 시간
  await scene([{ x: 0.2, sc: 0.4, foot: 0.7 }, { x: 0.42, sc: 0.62, foot: 0.86, arms: true }, { x: 0.68, sc: 0.95 }, { x: 0.9, sc: 0.3 }], 800);
  const ms = await p.evaluate(async () => { const R = window.__gyeol.RANGE, c = R.cut; let t = 0, n = 0; R.cut = function (...a) { const t0 = performance.now(), r = c.apply(this, a); t += performance.now() - t0; n++; return r; }; await new Promise(r => setTimeout(r, 1500)); R.cut = c; return n ? +(t / n).toFixed(3) : -1; }); ok('한 번에 0.5ms 미만', ms >= 0 && ms < 0.5, ms + 'ms');
  // 7) 2대 구성: 폰은 모두 보내고, 화면 쪽의 설정이 정한다 (같은 브라우저 창 묶음 안의 두 쪽으로 흉내)
  await set(0); await scene([{ x: 0.3, sc: 0.9 }, { x: 0.75, sc: 0.3 }], 500); await p.evaluate(() => { const ch = new BroadcastChannel('gyr'); let seq = 0; setInterval(() => ch.postMessage(window.__gyeol.encodePacket3(seq++)), 33); });
  const D = await ctx.newPage(); await D.route(/\/(models|vendor\/mediapipe)\//, r => r.abort()); D.on('pageerror', e => errors.push('화면: ' + e.message)); await D.goto(F.URL); await D.waitForTimeout(500);
  await D.evaluate(() => { const G = window.__gyeol; G.hideIntro(); G.A.remote = true; new BroadcastChannel('gyr').onmessage = ev => G.decodePacket(ev.data); }); await F.mode(D, 'shapes'); await D.waitForTimeout(1500);
  const rs = () => D.evaluate(() => { const G = window.__gyeol, A = G.A, band = x => { const cx = Math.round(x * A.w), r = Math.round(A.w * 0.06); let c = 0; for (let y = 0; y < A.h; y++) for (let xx = Math.max(0, cx - r); xx <= Math.min(A.w - 1, cx + r); xx++) if (A.p[y * A.w + xx] > 0.5) c++; return c; }; return { seen: [band(0.7), band(0.25)], drop: G.RANGE.drop, range: G.S.range }; });
  let r = await rs(); ok('2대 구성(화면 쪽 약 3m): 가까운 사람만', r.range === 3 && r.seen[0] > 50 && r.seen[1] === 0 && r.drop >= 1, JSON.stringify(r));
  await D.evaluate(() => { window.__gyeol.S.range = 0; }); await D.waitForTimeout(800); r = await rs(); ok('2대 구성(화면 쪽 모두): 둘 다 보인다', r.seen[0] > 50 && r.seen[1] > 10, JSON.stringify(r));
  ok('오류 없음', errors.length === 0, errors.slice(0, 3).join(' | ')); await b.close(); console.log(bad ? bad + '개 실패' : '모두 통과'); process.exit(bad ? 1 : 0); })();
