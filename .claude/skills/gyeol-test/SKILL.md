---
name: gyeol-test
description: 숭의 전시 웹앱(index.html)을 고친 뒤 브라우저에서 자동으로 점검한다. 모든 모드 오류 검사, 쌓기 동작, 아이폰 센서→화면 흉내, 실제 인식 모델 시험. 모드·인식·성능·물리를 바꿨을 때 사용.
---

# 숭의 전시 웹앱 점검

카메라·실제 사람 없이도 앱을 점검하는 도구가 `tests/`에 있다. Playwright(이 환경에 이미 설치됨)와 Chromium 가짜 카메라를 쓴다.

## 준비
저장소 루트에서 정적 서버를 띄운다 (백그라운드, 긴 timeout):

```bash
python3 -m http.server 8766
```

다른 주소를 쓰려면 `GYEOL_URL=http://.../index.html` 을 붙인다.

## 시험
| 명령 | 보는 것 | 통과 기준 |
|---|---|---|
| `node tests/smoke.js` | 모든 모드 × 화면 품질(선명/가볍게) × 그래픽 가속(켬/끔) | 오류 0, 종료코드 0 |
| `node tests/stack.js` | 쌓기: 먼 사람 제외, 같은 사람 재촬영 없음, 다음 사람 바로 찍힘, 거리 설정, Rapier 엔진 | `ok:true` |
| `node tests/stack-crowd.js` | 쌓기(사람이 많을 때): 지나다니는 사람 사이 멈춘 한 명만, 나란히 멈춘 4명은 차례로, 추적이 끊겨도 찍힘, 움직이기만 하면 안 찍힘 | `ok:true` |
| `node tests/real-models.js` | 사이트에 올린 실제 모델(분할·자세·사람 찾기·부위)을 실제 인물 영상에 | `ok:true`, `outside:0` |
| `node tests/display-sim.js 4 1920 1080 [모드,...]` | 아이폰 센서→화면을 두 창으로 흉내, 화면 CPU 4배 느리게 해서 모드별 그리기 시간 | 오류 없음, 무거운 모드는 품질 단계가 낮아짐 |

## 알아둘 것
- `tests/lib/fake.js`의 `open()`은 실제 모델 파일(`models/`, `vendor/mediapipe/`)을 막고 가짜 사람(`window.PPL = t => [{x, sc, arms, foot, drop, noobj}]`)을 넣는다. 실제 모델을 막지 않으면 진짜 모델이 가짜를 덮어써서 사람이 사라진다.
- 가짜 카메라는 4:3, 화면이 16:9면 위아래가 잘려 사람이 더 크게(가깝게) 잡힌다. 거리 시험은 960×720으로.
- 헤드리스 Chromium의 WebGL은 소프트웨어(SwiftShader)라서 `window.GLFORCE = true`를 넣어야 그래픽 경로가 켜진다. fps 숫자는 실제 기기보다 훨씬 낮으니 비교용으로만 본다.
- 중계 서버(0.peerjs.com)는 이 환경에서 막혀 있어 실제 2대 연결은 시험할 수 없다. `display-sim.js`의 BroadcastChannel 흉내로 대신한다.
- 스크린샷은 `tests/shots/`(커밋 안 함)에 저장된다. 사람이 볼 화면은 deviceScaleFactor 2로 찍는다.
