# NightLog Prototype (Expo)

AI 일기 앱 출시를 위한 모바일 프로토타입입니다.  
Next.js 웹 구조를 Expo(React Native) 앱으로 전환했습니다.

## Tech Stack

- Expo SDK 54
- React Native 0.81
- TypeScript
- 룰 기반 mock AI 엔진 (`src/lib/mockEngine.ts`)

## 실행

```bash
npm install
npm run start
```

## 디바이스에서 확인

1. 터미널에 표시되는 QR 코드를 Expo Go로 스캔
2. 또는:

```bash
npm run android
npm run ios
```

## 구현된 UX 흐름

- 저널링 모드 선택 (Deep Reflection / Stress Reset / Gratitude / Sleep Prep)
- 3~5턴 중심 AI 대화 (최대 7턴 상태머신 S0~S5)
- 매 턴 events/tasks/emotion 추출 카드 업데이트
- End 시 3줄 요약 + 감정 태그 + 내일 첫 행동 + 시간블록 제공
- 카드 최소 수정 기능 (`event.title`, `task.estMinutes`)
- 히스토리 검색/최근 날짜 필터/월간 요약/streak
- STT 마이크 버튼은 UI만 제공 (동작 미구현)

## 참고한 UX 방향

- Journal AI 앱 소개 페이지 흐름(가이드형 프롬프트, 감정/요약 중심 저널링) 참고
  - https://play.google.com/store/apps/details?id=com.journalai
