# 함께 들어 있는 라이브러리와 모델

| 파일 | 출처 | 라이선스 |
|---|---|---|
| `vendor/mediapipe/` | @mediapipe/tasks-vision 0.10.14 (Google), SIMD 실행 파일만 (없는 브라우저는 CDN) | Apache-2.0 |
| `models/*.tflite`, `models/*.task` | MediaPipe 공식 모델 (storage.googleapis.com/mediapipe-models) | Apache-2.0 |
| `vendor/rapier2d.mjs` | @dimforge/rapier2d-compat 0.21.0 (Dimforge) | Apache-2.0 (`LICENSE-rapier.txt`) |
| `vendor/peerjs.min.js` | peerjs 1.5.4 | MIT (`LICENSE-peerjs.txt`) |
| `vendor/qrcode.js` | qrcode-generator 1.4.4 (Kazuhiko Arase) | MIT |
| index.html 안의 Matter.js | matter-js 0.19 (liabru) | MIT |

사이트에 같이 올려 두어서 CDN이 막히거나 느려도 동작하고, 한 번 받으면 기기에 저장됩니다(`sw.js`).
