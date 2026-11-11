// 쌓기: 멈춘 사람 위로 차오르는 색이 그 사람 모양 안에서만 차오르는지 본다 (예전에는 그 사람의 상자 전체에 칠해져 옆 사람까지 물들었다).
// 한 사람(A)은 팔을 들고 멈춰 서 있고, 바로 옆에 반쯤 겹쳐 선 사람(B)은 계속 움직인다. 한 덩어리로 붙어 보여도 각 자리는 가까운 사람의 뼈대에 속한다.
const { chromium } = require('playwright'); const F = require('./lib/fake'); const path = require('path');
(async () => { const b = await chromium.launch({ args: F.args }); let bad = 0; const ok = (name, pass, info) => { console.log((pass ? 'ok   ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!pass) bad++; };
  const { p, errors } = await F.open(b); await p.evaluate(() => { const G = window.__gyeol; G.S.range = 0; G.S.auto = 0; }); await F.mode(p, 'stack');
  const AX = 0.42, BX = 0.56; await p.evaluate(([AX, BX]) => { window.PPL = t => [{ x: AX, sc: 0.8, arms: true }, { x: BX + 0.025 * Math.sin(t * 5), sc: 0.62, foot: 0.9 }]; }, [AX, BX]);
  let got = null; for (let k = 0; k < 60 && !got; k++) { await p.waitForTimeout(100); got = await p.evaluate(([AX, BX]) => { const G = window.__gyeol, A = G.A, m = G.mode; if (!(m.hold > 1 && m.hold < 1.9) || !m.gb) return null;
      const band = (f, x, r) => { const cx = Math.round((G.S.mirror ? 1 - x : x) * A.w), rr = Math.round(A.w * r); let c = 0; for (let y = 0; y < A.h; y++) for (let xx = Math.max(0, cx - rr); xx <= Math.min(A.w - 1, cx + rr); xx++) if (f[y * A.w + xx] > 0.5) c++; return c; };
      const bx = (G.S.mirror ? 1 - BX : BX) * A.w * A.sx, x0 = m.gb[0] - A.sx * 2, x1 = m.gb[0] + m.gb[2] + A.sx * 2;
      return { hold: +m.hold.toFixed(2), hasMask: !!m.fm, fillA: m.fm ? band(m.fm, AX, 0.03) : -1, fillB: m.fm ? band(m.fm, BX, 0.02) : -1, bodyB: band(A.p, BX, 0.02), bInBox: bx > x0 && bx < x1 }; }, [AX, BX]); }
  if (got) await p.screenshot({ path: path.join(__dirname, 'shots/stack-fill.png') });
  ok('A가 멈춰 색이 차오르는 중', !!got, JSON.stringify(got)); if (got) { ok('B는 A 바로 옆에 겹쳐 서 있다', got.bodyB > 20, 'B의 칸 ' + got.bodyB);
    ok('색은 A의 모양 안에서 차오른다', got.fillA > 20, 'A의 칸 ' + got.fillA); ok('옆 사람 B에게는 번지지 않는다', got.fillB <= got.bodyB * 0.05, 'B의 칸 ' + got.bodyB + ' 가운데 ' + got.fillB); }
  ok('오류 없음', errors.length === 0, errors.slice(0, 3).join(' | ')); await b.close(); console.log(bad ? bad + '개 실패' : '모두 통과'); process.exit(bad ? 1 : 0); })();
