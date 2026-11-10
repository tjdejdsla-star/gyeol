// how long each mode takes to let go of where a person was, and to show them where they now are (the person jumps sideways at once)
const { chromium } = require('playwright'); const F = require('./lib/fake');
(async () => { const thr = +(process.argv[2] || 1), only = process.argv[3] ? process.argv[3].split(',') : null; const b = await chromium.launch({ args: F.args });
  const { ctx, p, errors } = await F.open(b, { viewport: { width: 960, height: 540 } }); await p.evaluate(() => { window.__gyeol.S.perf = 0; window.GLFORCE = true; });
  if (thr > 1) { const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr }); }
  const ids = await p.evaluate(() => window.__gyeol.MODES.map(m => m.id)); const rows = [];
  for (const id of ids) { if (only && !only.includes(id)) continue; if (['poem', 'stack', 'trail', 'bubble', 'balloon', 'fluid'].includes(id)) continue;
    await p.evaluate(() => { window.PX = 0.3; window.PPL = () => [{ x: window.PX, sc: 0.8 }]; }); await F.mode(p, id); await p.waitForTimeout(2600);
    const r = await p.evaluate(() => new Promise(res => { const cv = document.querySelector('#stage'), c = cv.getContext('2d'), kx = cv.width / innerWidth, ky = cv.height / innerHeight;
      // a patch of the screen where the person was (mirrored: x=0.3 in the camera is 0.7 on screen) and where they will be
      const patch = fx => { const d = c.getImageData(Math.round((fx - 0.03) * innerWidth * kx), Math.round(0.5 * innerHeight * ky), Math.round(0.06 * innerWidth * kx), Math.round(0.12 * innerHeight * ky)).data; let r = 0, g = 0, bl = 0; for (let i = 0; i < d.length; i += 16) { r += d[i]; g += d[i + 1]; bl += d[i + 2]; } const n = d.length / 16; return [r / n, g / n, bl / n]; };
      const S = []; const t0 = performance.now(); window.PX = 0.7; const tick = () => { const t = performance.now() - t0; S.push([t, patch(0.7), patch(0.3)]); if (t < 3200) requestAnimationFrame(tick); else { const fin = S[S.length - 1], dist = (a, q) => Math.hypot(a[0] - q[0], a[1] - q[1], a[2] - q[2]);
          const settle = k => { const full = dist(S[0][k], fin[k]) || 1; let last = 0; for (const s of S) if (dist(s[k], fin[k]) > Math.max(6, full * 0.15)) last = s[0]; return Math.round(last); };
          res({ leave: settle(1), arrive: settle(2), frames: S.length }); } }; requestAnimationFrame(tick); }));
    rows.push({ id, ...r }); }
  rows.sort((a, q) => Math.max(q.leave, q.arrive) - Math.max(a.leave, a.arrive)); rows.forEach(r => console.log(r.id.padEnd(10), '떠난 자리', String(r.leave).padStart(5), 'ms   새 자리', String(r.arrive).padStart(5), 'ms   (', r.frames, '프레임 )'));
  console.log(errors.slice(0, 3)); await b.close(); })();
