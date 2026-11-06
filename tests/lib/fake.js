// 가짜 사람과 가짜 인식 모델: 실제 모델 대신 정해진 모양의 사람을 넣어, 모드들이 같은 입력에서 늘 같은 결과를 내게 한다
// person(m,w,h,cx,foot,sc,arms): 마스크에 사람 하나를 그린다 · skel(w,h,cx,foot,sc): 그 사람의 자세 점 33개
exports.setup = `(() => {
    window.person=(m,w,h,cx,foot,sc,arms)=>{const Hh=h*0.9*sc,top=foot-Hh;for(let y=Math.max(0,top|0);y<Math.min(h,foot);y++)for(let x=Math.max(0,(cx-Hh*0.35)|0);x<Math.min(w,cx+Hh*0.35);x++){const u=(y-top)/Hh,dx=(x-cx)/Hh;let on=false;
      if(u<0.15&&((dx/0.065)**2+((u-0.075)/0.075)**2<1))on=true;if(u>=0.13&&u<0.17&&Math.abs(dx)<0.035)on=true;
      if(u>=0.16&&u<0.56){const sh=u<0.2?0.11+(u-0.16)*0.5:0.13-(u-0.2)*0.08;if(Math.abs(dx)<sh)on=true;}
      if(arms){if(u>=-0.02&&u<0.22&&(Math.abs(dx-0.2+u*0.2)<0.028))on=true;if(u>=-0.1&&u<0.0&&(((dx-0.2)/0.05)**2+((u+0.05)/0.06)**2<1))on=true;if(u>=0.16&&u<0.24&&Math.abs(dx-0.15)<0.03)on=true;if(u>=0.18&&u<0.52&&Math.abs(dx+0.15-(u-0.18)*0.05)<0.03)on=true;}
      else if(u>=0.18&&u<0.52&&Math.abs(Math.abs(dx)-0.15+(u-0.18)*0.05)<0.03)on=true;
      if(u>=0.55){const k=(u-0.55)/0.45;if(Math.abs(dx-0.045-k*0.01)<0.04-k*0.012||Math.abs(dx+0.045+k*0.01)<0.04-k*0.012)on=true;}if(on)m[y*w+x]=1;}};
    window.skel=(w,h,cx,foot,sc)=>{const Hh=h*0.9*sc,top=foot-Hh,P=new Array(33).fill(0).map(()=>({x:cx/w,y:foot/h,visibility:0.1}));const set=(i,dx,u)=>P[i]={x:(cx+dx*Hh)/w,y:(top+u*Hh)/h,visibility:0.95};
      set(0,0,0.08);set(2,-0.025,0.06);set(5,0.025,0.06);set(7,-0.055,0.075);set(8,0.055,0.075);set(11,-0.12,0.19);set(12,0.12,0.19);set(13,-0.15,0.35);set(14,0.15,0.35);set(15,-0.16,0.5);set(16,0.16,0.5);
      set(23,-0.05,0.55);set(24,0.05,0.55);set(25,-0.05,0.75);set(26,0.05,0.75);set(27,-0.05,0.97);set(28,0.05,0.97);return P;};
  })()`;
// window.PPL = t => [{x, sc, arms, foot, drop, noobj}] 로 장면을 바꾼다 (x: 가로 위치 0..1, sc: 크기, foot: 발 높이 0..1)
exports.scene = function () { const v = document.querySelector('#cam'), w = v.videoWidth, h = v.videoHeight, G = window.__gyeol, F = G.FACE, t0 = performance.now(); window.PPL = () => [];
  F.state = 'ready'; F.det = { detectForVideo: () => ({ detections: [] }) }; const cur = () => window.PPL((performance.now() - t0) / 1000), ft = q => h * (q.foot || 0.98);
  F.pose = { detectForVideo: () => { const L = [], M = []; for (const q of cur()) { if (q.drop && Math.random() < q.drop) continue; L.push(skel(w, h, w * q.x, ft(q), q.sc)); const m = new Float32Array(w * h); person(m, w, h, w * q.x, ft(q), q.sc, q.arms); M.push({ width: w, height: h, getAsFloat32Array: () => m, close() {} }); } return { landmarks: L, segmentationMasks: M }; } };
  F.obj = { detectForVideo: () => ({ detections: cur().filter(q => !q.noobj).map(q => { const Hh = h * 0.9 * q.sc; return { categories: [{ categoryName: 'person', score: 0.8 }], boundingBox: { originX: w * q.x - 0.22 * Hh, originY: ft(q) - Hh, width: 0.44 * Hh, height: Hh } }; }) }) };
  const f = () => { const m = new Float32Array(w * h); for (const q of cur()) person(m, w, h, w * q.x, ft(q), q.sc, q.arms); G.SEG.mask = m; G.SEG.mw = w; G.SEG.mh = h; G.SEG.fresh = performance.now(); requestAnimationFrame(f); }; f(); };
const URL0 = process.env.GYEOL_URL || 'http://127.0.0.1:8766/index.html';
exports.URL = URL0;
// 앱을 열고 '이 기기로 시작'을 누른 뒤 가짜 사람을 넣는다. 실제 모델 파일은 막아서 가짜가 덮어써지지 않게 한다
exports.open = async (browser, opts = {}) => { const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 720 }, deviceScaleFactor: 1 }); const p = await ctx.newPage(); const errors = []; p.on('pageerror', e => errors.push(e.message));
  if (!opts.realModels) await p.route(/\/(models|vendor\/mediapipe)\//, r => r.abort());
  await p.goto(URL0); await p.waitForTimeout(500); await p.click('#btnSolo'); await p.waitForTimeout(800);
  if (!opts.realModels) { await p.evaluate(exports.setup); await p.evaluate(exports.scene); }
  return { ctx, p, errors }; };
exports.mode = (p, id) => p.evaluate(id => { const G = window.__gyeol; G.setMode(G.MODES.findIndex(m => m.id === id)); document.body.classList.remove('ui-on'); }, id);
exports.args = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--enable-unsafe-swiftshader'];
