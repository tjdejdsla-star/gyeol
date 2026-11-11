// 쌓기 · 스쳐 지나가는 사람은 찍히면 안 됨: 천천히 가로질러 걷기 · 카메라 쪽으로 다가오기 · 줄지어 지나가기 · 가까이서 빠르게 지나가기 · 제자리에서 계속 흔들리기
// 그리고 걸어와서 멈춘 사람은 멈춘 뒤에야(멈추기 전에는 안 됨) 찍혀야 함
const { chromium } = require('playwright'); const F = require('./lib/fake');
(async () => { const b = await chromium.launch({ args: F.args }); const { p, errors } = await F.open(b, { viewport: { width: 960, height: 720 } }); await F.mode(p, 'stack');
  const n = () => p.evaluate(() => window.__gyeol.STACK.n), out = {}, clear = async () => { await p.evaluate(() => { window.PPL = () => []; }); await p.waitForTimeout(1500); };
  const run = async (name, fn, ms) => { const n0 = await n(); await p.evaluate(`(() => { const t0 = performance.now(), f = ${fn}; window.PPL = () => f((performance.now() - t0) / 1000); })()`); await p.waitForTimeout(ms); out[name] = (await n()) - n0; await clear(); };
  await p.evaluate(() => { window.__gyeol.S.stackDist = 2; });
  await run('slowWalker', 't => [{ x: 0.1 + 0.05 * t, sc: 0.8 }]', 14000);                                    // 화면 너비의 5%/초로 천천히 가로지름
  await run('approaching', 't => [{ x: 0.5, sc: Math.min(1.05, 0.5 + 0.07 * t) }]', 8000);                      // 카메라 쪽으로 걸어옴 (점점 커짐)
  await run('procession', 't => [0, 1, 2, 3, 4, 5, 6].map(k => ({ x: ((0.12 * t + k * 0.17) % 1.19) - 0.1, sc: 0.78 }))', 12000); // 어깨가 닿을 만큼 줄지어 계속 지나감
  await run('closeFast', 't => [{ x: ((0.22 * t) % 1.4) - 0.2, sc: 1.1 }]', 9000);                              // 카메라 가까이서 빠르게 지나감
  await run('swaying', 't => [{ x: 0.5 + 0.05 * Math.sin(t * 2.2), sc: 0.8 }]', 7000);                          // 제자리에서 계속 좌우로 흔들림
  // 자세 모델이 사람을 전혀 못 볼 때(윤곽만으로 판단)도 같아야 함
  const NP = ', drop: 1'; // (사람 찾기 상자는 있어서 화면에는 보임)
  await run('npApproaching', 't => [{ x: 0.5, sc: Math.min(1.05, 0.5 + 0.07 * t)' + NP + ' }]', 8000);
  await run('npProcession', 't => [0, 1, 2, 3, 4, 5, 6].map(k => ({ x: ((0.12 * t + k * 0.17) % 1.19) - 0.1, sc: 0.78' + NP + ' }))', 10000);
  await run('npSlowWalker', 't => [{ x: 0.1 + 0.05 * t, sc: 0.8' + NP + ' }]', 12000);
  await run('npStill', 't => [{ x: 0.5, sc: 0.8' + NP + ' }]', 3600);
  // 잠깐(1초) 멈췄다가 다시 가는 사람은 안 찍힘
  await run('pause1s', 't => [{ x: t < 2 ? 0.1 + 0.15 * t : t < 3 ? 0.4 : 0.4 + 0.15 * (t - 3), sc: 0.8 }]', 7000);
  // 멈춰 선 사람은 찍혀야 함: 인식 결과가 조금씩 떨릴 때(가장자리 떨림) · 한 팔을 들었다 내렸다 할 때 · 자세 모델이 못 볼 때의 떨림
  const J = '0.5 + 0.003 * Math.sin(t * 37) + 0.002 * Math.sin(t * 61), sc: 0.8 + 0.006 * Math.sin(t * 43)';
  await run('jitterStill', 't => [{ x: ' + J + ' }]', 3800);
  await run('wavingStill', 't => [{ x: 0.5, sc: 0.8, arms: Math.floor(t / 0.45) % 2 === 0 }]', 3800);
  await run('npJitterStill', 't => [{ x: ' + J + NP + ' }]', 4200);
  // 걸어와서 3초에 멈춤: 3.8초까지는 안 찍히고, 그 뒤 곧 찍혀야 함
  const n0 = await n(); await p.evaluate(() => { const t0 = performance.now(); window.PPL = () => { const t = (performance.now() - t0) / 1000; return [{ x: Math.min(0.55, 0.1 + 0.15 * t), sc: 0.8 }]; }; });
  await p.waitForTimeout(3800); out.beforeStop = (await n()) - n0; await p.waitForTimeout(3600); out.afterStop = (await n()) - n0;
  const ok = !out.slowWalker && !out.approaching && !out.procession && !out.closeFast && !out.swaying && !out.npApproaching && !out.npProcession && !out.npSlowWalker && out.npStill === 1 && !out.pause1s && out.jitterStill === 1 && out.wavingStill === 1 && out.npJitterStill === 1 && out.beforeStop === 0 && out.afterStop === 1 && !errors.length;
  console.log(JSON.stringify({ ok, ...out, errors })); await b.close(); process.exit(ok ? 0 : 1); })();
