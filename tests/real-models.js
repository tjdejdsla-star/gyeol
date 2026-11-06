// 실제 인식 모델(사이트에 올린 models/)을 실제 사람 영상(tests/media/portrait.y4m, NASA 공개 사진)에 돌려 본다
const { chromium } = require('playwright'); const F = require('./lib/fake'); const path = require('path');
(async () => { const b = await chromium.launch({ args: [...F.args, '--use-file-for-fake-video-capture=' + path.join(__dirname, 'media/portrait.y4m')] });
  const { p, errors } = await F.open(b, { realModels: true }); const reqs = { site: 0, outside: 0 }; p.on('request', r => { const u = r.url(); if (/\/(models|vendor)\//.test(u) && u.startsWith(F.URL.replace('index.html', ''))) reqs.site++; else if (/googleapis|jsdelivr/.test(u)) reqs.outside++; });
  await p.evaluate(() => { window.GLFORCE = true; }); await F.mode(p, 'thermal'); let st;
  for (let i = 0; i < 90; i++) { st = await p.evaluate(() => { const G = window.__gyeol, F = G.FACE; return { seg: G.SEG.state, pose: !!F.pose, obj: !!F.obj, parts: !!G.A.part, poses: F.pres && F.pres.landmarks ? F.pres.landmarks.length : 0, persons: F.ores && F.ores.detections ? F.ores.detections.length : 0 }; }); if (st.seg === 'ready' && st.poses && st.persons && st.parts) break; await p.waitForTimeout(1000); }
  await p.screenshot({ path: path.join(__dirname, 'shots/real-thermal.png') }); const ok = st.seg === 'ready' && st.poses > 0 && st.persons > 0 && st.parts && !errors.length;
  console.log(JSON.stringify({ ok, ...st, reqs, errors: errors.slice(0, 3) })); await b.close(); process.exit(ok ? 0 : 1); })();
