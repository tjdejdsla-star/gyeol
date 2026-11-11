// 비눗방울: 손을 내밀면(들기 · 옆으로 뻗기 · 화면 쪽으로 내밀기) 그 손바닥에서 방울이 나오는지,
// 가만히 있는 손(늘어뜨림 · 허리 · 팔짱 · 가슴 앞 휴대폰)에서는 안 나오는지 본다.
// 가짜 사람의 손짓은 tests/lib/fake.js의 q.hand (자세 점에 깊이 z까지 넣는다)
const { chromium } = require('playwright'); const F = require('./lib/fake');
(async () => { const b = await chromium.launch({ args: F.args }); let bad = 0; const ok = (name, pass, info) => { console.log((pass ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!pass) bad++; };
  const { p, errors } = await F.open(b); const wait = ms => p.waitForTimeout(ms);
  await p.evaluate(() => { const G = window.__gyeol; G.S.auto = 0; G.S.perf = 0; G.S.range = 3; G.S.rangeH = 0; }); await F.mode(p, 'bubble');
  // 방울이 태어난 자리와 때를 모두 적어 둔다
  await p.evaluate(() => { const m = window.__gyeol.mode, arr = m.b, push = arr.push; window.BORN = []; arr.push = function (q) { window.BORN.push({ x: q.x, y: q.y, t: performance.now() }); return push.apply(this, arguments); }; });
  // 장면 하나: 먼저 모두 손을 내리고 0.8초 쉬어 앞 장면의 줄기를 끊은 뒤, ppl(문자열: t → 사람 목록)을 ms 동안 보여 준다.
  // 돌려주는 것: 태어난 방울, 첫 방울까지 걸린 시간, 지금 자세에서 계산한 각 사람의 손바닥 자리와 몸 크기
  const scene = async (ppl, ms) => { await p.evaluate(s => { const f = new Function('t', 'return ' + s); window.PPL = t => f(t).map(q => Object.assign({}, q, { hand: 'rest', blink: false, gap: false })); }, ppl); await wait(800);
    await p.evaluate(s => { window.BORN.length = 0; window.T1 = performance.now(); window.PPL = new Function('t', 'return ' + s); }, ppl); await wait(ms);
    return p.evaluate(() => { const G = window.__gyeol, P = G.poseScreen() || [], vis = q => q && q.v >= 0.3, B = window.BORN.slice();
      const hands = P.map(L => { const w = L[16], e = L[14], pk = L[18], ik = L[20], d = Math.hypot(L[11].x - L[12].x, L[11].y - L[12].y); let px, py, kn = null;
        if (vis(pk) && vis(ik)) { kn = { x: (pk.x + ik.x) / 2, y: (pk.y + ik.y) / 2 }; px = w.x + (kn.x - w.x) * 0.6; py = w.y + (kn.y - w.y) * 0.6; } else { px = w.x + (w.x - e.x) * 0.22; py = w.y + (w.y - e.y) * 0.22; }
        return { px, py, d, wx: w.x, wy: w.y, kn, z: w.z }; });
      // 방울마다: 가장 가까운 손바닥까지의 거리(몸 크기 대비), 손목에서 손가락 마디 쪽으로 얼마나 나갔는지(마디까지를 1로)
      const near = B.map(q => { let best = null, bd = 1e9; hands.forEach((hh, i) => { const dd = Math.hypot(q.x - hh.px, q.y - hh.py) / hh.d; if (dd < bd) { bd = dd; best = i; } }); const hh = hands[best]; let along = null; if (hh && hh.kn) { const hx = hh.kn.x - hh.wx, hy = hh.kn.y - hh.wy, hl = Math.hypot(hx, hy) || 1; along = ((q.x - hh.wx) * hx + (q.y - hh.wy) * hy) / (hl * hl); } return { hand: best, dist: bd, along }; });
      let gap = 0; for (let i = 1; i < B.length; i++) gap = Math.max(gap, B[i].t - B[i - 1].t);
      return { n: B.length, first: B.length ? Math.round(B[0].t - window.T1) : -1, maxDist: +Math.max(0, ...near.map(x => x.dist)).toFixed(2), maxAlong: +Math.max(0, ...near.filter(x => x.along != null).map(x => x.along)).toFixed(2), per: hands.map((hh, i) => near.filter(x => x.hand === i).length), gap: Math.round(gap), poses: P.length, z: hands.map(hh => hh.z == null ? null : +(hh.z / hh.d).toFixed(2)) }; }); };
  const one = h => `[{x:0.5,sc:0.75,hand:'${h}'}]`;
  // 1) 내밀지 않은 손: 방울이 없어야 한다
  for (const [h, name] of [['rest', '팔을 늘어뜨림'], ['hips', '허리에 손'], ['hipsHidden', '허리에 손 · 손목이 안 보임'], ['crossed', '팔짱'], ['chest', '가슴 앞 휴대폰']]) { const r = await scene(one(h), 1600); ok(name + ': 방울 없음', r.n === 0 && r.poses === 1, JSON.stringify({ n: r.n, poses: r.poses })); }
  // 2) 내민 손: 방울이 곧 나오고, 손바닥에서 태어난다 (손바닥에서 몸 크기의 0.3 안, 손가락 마디를 넘지 않음)
  for (const [h, name, lim] of [['up', '손을 위로', 500], ['wave', '머리 옆에서 흔들기(팔 굽힘)', 500], ['side', '옆으로 뻗기', 500], ['out', '옆으로 반쯤 들기', 700], ['front', '손바닥을 화면 쪽으로', 700]]) { const r = await scene(one(h), 1800);
    ok(name + ': 방울이 나온다', r.n >= 8, JSON.stringify({ n: r.n })); ok(name + ': ' + lim + 'ms 안에 시작', r.first >= 0 && r.first <= lim, r.first + 'ms'); ok(name + ': 손바닥에서 태어난다', r.n > 0 && r.maxDist <= 0.3 && r.maxAlong <= 1, JSON.stringify({ maxDist: r.maxDist, maxAlong: r.maxAlong }));
    if (h === 'up') ok('한 손에서 초당 15개쯤 (더 많지 않음)', r.n <= 15 * 1.8 + 4, r.n + '개 / 1.8초'); if (h === 'front') ok('이 기기의 자세 점에 깊이(z)가 실려 온다', r.z[0] != null && r.z[0] < -1, 'z = ' + r.z[0] + ' × 어깨너비'); }
  // 3) 깊이가 없으면(폰 센서) 화면 쪽으로 내민 손은 읽지 못하지만, 오류는 없다
  { const r = await scene(`[{x:0.5,sc:0.75,hand:'front',noz:true}]`, 1500); ok('깊이 없음(폰 센서처럼): 내민 손바닥은 안 읽힘 · 오류 없음', r.n === 0 && r.z[0] == null, JSON.stringify({ n: r.n, z: r.z })); }
  // 4) 두 사람: 저마다 자기 손바닥에서
  { const r = await scene(`[{x:0.28,sc:0.75,hand:'up'},{x:0.72,sc:0.75,hand:'side'}]`, 2000); ok('두 사람이 저마다 자기 줄기를 갖는다', r.poses === 2 && r.per.length === 2 && r.per[0] >= 8 && r.per[1] >= 8 && r.maxDist <= 0.3, JSON.stringify({ per: r.per, maxDist: r.maxDist })); }
  // 5) 자세 점이 잠깐 빠져도 줄기가 끊기지 않는다
  { const r = await scene(`[{x:0.5,sc:0.75,hand:'side',blink:true}]`, 3000); ok('손목 점이 0.15초씩 사라져도 끊기지 않는다', r.n >= 30 && r.gap < 350, JSON.stringify({ n: r.n, gap: r.gap })); }
  { const r = await scene(`[{x:0.5,sc:0.75,hand:'up',gap:true}]`, 3000); ok('자세 전체가 0.2초씩 빠져도 끊기지 않는다', r.n >= 30 && r.gap < 350, JSON.stringify({ n: r.n, gap: r.gap })); }
  // 6) 인식 거리 밖의 사람은 손을 들어도 방울이 없다 (인식 거리를 모두로 바꾸면 나온다)
  { const r = await scene(`[{x:0.5,sc:0.3,foot:0.7,hand:'up'}]`, 1500); ok('먼 사람(인식 거리 밖): 방울 없음', r.n === 0 && r.poses === 0, JSON.stringify({ n: r.n, poses: r.poses }));
    await p.evaluate(() => { window.__gyeol.S.range = 0; }); const r2 = await scene(`[{x:0.5,sc:0.3,foot:0.7,hand:'up'}]`, 1500); ok('인식 거리 모두: 먼 사람도 나온다', r2.n >= 5, JSON.stringify({ n: r2.n })); await p.evaluate(() => { window.__gyeol.S.range = 3; }); }
  // 7) 한 장 그리는 데 드는 시간 (두 사람이 손을 내민 채)
  await p.evaluate(() => { window.PPL = () => [{ x: 0.28, sc: 0.75, hand: 'up' }, { x: 0.72, sc: 0.75, hand: 'side' }]; }); await wait(1500);
  const ms = await p.evaluate(async () => { const m = window.__gyeol.mode, d = m.draw; let s2 = 0, n = 0; m.draw = function (...a) { const t0 = performance.now(); d.apply(this, a); s2 += performance.now() - t0; n++; }; await new Promise(r => setTimeout(r, 1500)); m.draw = d; return +(s2 / n).toFixed(2); }); ok('한 장에 8ms 미만', ms < 8, ms + 'ms');
  ok('오류 없음', errors.length === 0, errors.slice(0, 3).join(' | ')); await b.close(); console.log(bad ? bad + '개 실패' : '모두 통과'); process.exit(bad ? 1 : 0); })();
