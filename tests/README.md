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
node tests/range.js        # 인식 거리: 먼 사람이 모양·자세·상자 모두에서 빠지는지
```

```bash
node tests/filters.js      # 기본으로 꺼 두는 필터 여섯 개, 필터별 머무는 시간
node tests/stack-fill.js   # 쌓기 · 차오르는 색이 옆 사람에게 번지지 않는지
```

```bash
node tests/bubble.js       # 비눗방울 · 손 내밀기 인식과 손바닥 위치
```

```bash
node tests/real-models.js
```

```bash
node tests/display-sim.js 4 1920 1080
```

`tests/media/portrait.y4m`은 NASA 공개(퍼블릭 도메인) 우주비행사 초상 사진을 가짜 카메라 영상으로 바꾼 것입니다.
