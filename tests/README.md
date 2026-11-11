# 자동 점검

카메라나 실제 사람 없이 앱을 점검하는 스크립트입니다. 자세한 사용법은 `.claude/skills/gyeol-test/SKILL.md`에 있습니다.

```bash
python3 -m http.server 8766
```

```bash
node tests/smoke.js
```

```bash
node tests/stack.js
node tests/stack-crowd.js   # 쌓기 · 사람이 많거나 겹칠 때
node tests/stack-pass.js    # 쌓기 · 스쳐 지나가는 사람은 안 찍히는지
```

```bash
node tests/crowd-auto.js   # 붐빌 때 자동 전환이 쌓기 · 시를 건너뛰는지 (약 2분)
```

```bash
node tests/real-models.js
```

```bash
node tests/display-sim.js 4 1920 1080
```

`tests/media/portrait.y4m`은 NASA 공개(퍼블릭 도메인) 우주비행사 초상 사진을 가짜 카메라 영상으로 바꾼 것입니다.
