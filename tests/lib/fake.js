// 가짜 사람과 가짜 인식 모델: 실제 모델 대신 정해진 모양의 사람을 넣어, 모드들이 같은 입력에서 늘 같은 결과를 내게 한다
// person(m,w,h,cx,foot,sc,arms): 마스크에 사람 하나를 그린다 · skel(w,h,cx,foot,sc,q,t): 그 사람의 자세 점 33개
// q.hand(선택): 한쪽 팔의 자세를 바꾸고 깊이(z)도 넣는다 — rest·up·wave·side·out·front·chest·hips·crossed·hipsHidden(손목이 안 보임)
// q.noz: 깊이 없이(폰 센서처럼) · q.blink: 손목·손가락 점이 0.6초마다 0.15초씩 사라진다 · q.gap: 자세 전체가 0.7초마다 0.2초씩 빠진다
exports.setup = `(() => {
    window.person=(m,w,h,cx,foot,sc,arms)=>{const Hh=h*0.9*sc,top=foot-Hh;for(let y=Math.max(0,top|0);y<Math.min(h,foot);y++)for(let x=Math.max(0,(cx-Hh*0.35)|0);x<Math.min(w,cx+Hh*0.35);x++){const u=(y-top)/Hh,dx=(x-cx)/Hh;let on=false;
      if(u<0.15&&((dx/0.065)**2+((u-0.075)/0.075)**2<1))on=true;if(u>=0.13&&u<0.17&&Math.abs(dx)<0.035)on=true;
      if(u>=0.16&&u<0.56){const sh=u<0.2?0.11+(u-0.16)*0.5:0.13-(u-0.2)*0.08;if(Math.abs(dx)<sh)on=true;}
      if(arms){if(u>=-0.02&&u<0.22&&(Math.abs(dx-0.2+u*0.2)<0.028))on=true;if(u>=-0.1&&u<0.0&&(((dx-0.2)/0.05)**2+((u+0.05)/0.06)**2<1))on=true;if(u>=0.16&&u<0.24&&Math.abs(dx-0.15)<0.03)on=true;if(u>=0.18&&u<0.52&&Math.abs(dx+0.15-(u-0.18)*0.05)<0.03)on=true;}
      else if(u>=0.18&&u<0.52&&Math.abs(Math.abs(dx)-0.15+(u-0.18)*0.05)<0.03)on=true;
      if(u>=0.55){const k=(u-0.55)/0.45;if(Math.abs(dx-0.045-k*0.01)<0.04-k*0.012||Math.abs(dx+0.045+k*0.01)<0.04-k*0.012)on=true;}if(on)m[y*w+x]=1;}};
    window.skel=(w,h,cx,foot,sc,q,t)=>{const Hh=h*0.9*sc,top=foot-Hh,P=new Array(33).fill(0).map(()=>({x:cx/w,y:foot/h,visibility:0.1}));const set=(i,dx,u)=>P[i]={x:(cx+dx*Hh)/w,y:(top+u*Hh)/h,visibility:0.95};
      set(0,0,0.08);set(2,-0.025,0.06);set(5,0.025,0.06);set(7,-0.055,0.075);set(8,0.055,0.075);set(11,-0.12,0.19);set(12,0.12,0.19);set(13,-0.15,0.35);set(14,0.15,0.35);set(15,-0.16,0.5);set(16,0.16,0.5);
      set(23,-0.05,0.55);set(24,0.05,0.55);set(25,-0.05,0.75);set(26,0.05,0.75);set(27,-0.05,0.97);set(28,0.05,0.97);
      // 손짓: [팔꿈치, 손목, 새끼손가락 마디, 집게손가락 마디] = [가로(키 대비), 세로(키 대비), 깊이(어깨너비 대비, 음수가 카메라 쪽)]
      if(q&&q.hand){const S=0.24*Hh/w,G={rest:[[0.15,0.35,-0.1],[0.16,0.5,-0.2]],up:[[0.17,0.08,-0.2],[0.19,-0.06,-0.3],[0.215,-0.115],[0.195,-0.12]],wave:[[0.2,0.2,-0.1],[0.17,0.05,-0.3],[0.185,0],[0.165,-0.005]],
          side:[[0.27,0.2,-0.1],[0.42,0.2,-0.1],[0.48,0.215],[0.48,0.195]],out:[[0.2,0.33,-0.1],[0.3,0.45,-0.1]],front:[[0.13,0.24,-0.7],[0.125,0.2,-1.6],[0.135,0.175],[0.115,0.17]],
          chest:[[0.16,0.36,-0.2],[0.04,0.34,-0.9]],hips:[[0.24,0.38,0],[0.1,0.52,-0.1]],crossed:[[0.15,0.36,-0.2],[-0.08,0.33,-0.5]],hipsHidden:[[0.24,0.38,0],null]}[q.hand]||[],z=(i,zr)=>{if(!q.noz)P[i].z=zr*S;};
        [11,12,23,24].forEach(i=>z(i,0));z(13,-0.1);z(15,-0.2);if(G[0]){set(14,G[0][0],G[0][1]);z(14,G[0][2]);}
        if(G[1]){set(16,G[1][0],G[1][1]);z(16,G[1][2]);}else if(G.length>1)P[16].visibility=0.1;
        if(G[2]){set(18,G[2][0],G[2][1]);z(18,G[1][2]);}if(G[3]){set(20,G[3][0],G[3][1]);z(20,G[1][2]);}
        if(q.blink&&t%0.6<0.15)[16,18,20].forEach(i=>{P[i].visibility=0.1;});}
      return P;};
  })()`;
// window.PPL = t => [{x, sc, arms, foot, drop, noobj}] 로 장면을 바꾼다 (x: 가로 위치 0..1, sc: 크기, foot: 발 높이 0..1)
exports.scene = function () { const v = document.querySelector('#cam'), w = v.videoWidth, h = v.videoHeight, G = window.__gyeol, F = G.FACE, t0 = performance.now(); window.PPL = () => [];
  F.state = 'ready'; F.det = { detectForVideo: () => ({ detections: [] }) }; const cur = () => window.PPL((performance.now() - t0) / 1000), ft = q => h * (q.foot || 0.98);
  F.pose = { detectForVideo: () => { const L = [], M = [], tt = (performance.now() - t0) / 1000; for (const q of cur()) { if (q.drop && Math.random() < q.drop) continue; if (q.gap && tt % 0.7 < 0.2) continue; L.push(skel(w, h, w * q.x, ft(q), q.sc, q, tt)); const m = new Float32Array(w * h); person(m, w, h, w * q.x, ft(q), q.sc, q.arms); M.push({ width: w, height: h, getAsFloat32Array: () => m, close() {} }); } return { landmarks: L, segmentationMasks: M }; } };
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
