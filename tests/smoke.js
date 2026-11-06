// 모든 모드를 차례로 켜 보고, 화면 품질 세 단계와 그래픽 가속 켜기·끄기에서도 오류가 없는지 본다
const { chromium } = require('playwright'); const F = require('./lib/fake');
(async () => { const b = await chromium.launch({ args: F.args }); const { p, errors } = await F.open(b);
  await p.evaluate(() => { window.GLFORCE = true; window.PPL = t => [{ x: 0.35 + 0.1 * Math.sin(t), sc: 0.8, arms: true }, { x: 0.7, sc: 0.7 }]; });
  const ids = await p.evaluate(() => window.__gyeol.MODES.map(m => m.id)); const res = {};
  for (const lv of [0, 2]) for (const gpu of [true, false]) { await p.evaluate(([lv, gpu]) => { const G = window.__gyeol; G.S.perf = lv; G.S.gpu = gpu; }, [lv, gpu]);
    for (const id of ids) { await F.mode(p, id); await p.waitForTimeout(250); } res['lv' + lv + (gpu ? '+gl' : '')] = errors.length; }
  console.log(JSON.stringify({ modes: ids.length, errorsAfter: res, errors: errors.slice(0, 5) })); await b.close(); process.exit(errors.length ? 1 : 0); })();
