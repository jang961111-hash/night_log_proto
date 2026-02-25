# NightLog (Expo React Native)

NightLog는 대화형 저널링으로 하루를 정리하고, 감정 인사이트를 내일 일정으로 연결하는 모바일 앱 프로토타입입니다.

## 현재 상태
- 멀티 화면 플로우 구현 완료
  - 인트로 -> 랜딩 -> 로그인/회원가입 -> 관심사 -> 홈 -> 대화 -> 결과 -> 일정 조절 -> 캘린더 -> 설정/정책
- 인증 이후 공통 하단 탭(메인/대화/캘린더/설정) 제공
- 로컬 계정/기록 저장(AsyncStorage)
- 대화 mock 엔진 연동(`apiChatStart/Turn/End`)
- 음성 중심 저널링(STT + TTS)과 수동 일정 추가(+) 지원
- 설정 화면에서 프로필 편집, 관심사 재설정, 데이터 초기화/계정삭제 지원
- 결과/추천 일정/주간 통계 화면 포함
- 릴리즈 기본 인프라 포함(`eas.json`, CI, 테스트)

## 기술 스택
- Expo SDK 54
- React Native 0.81
- TypeScript
- AsyncStorage
- react-native-svg
- expo-font + Noto Sans KR
- expo-speech + expo-speech-recognition

## 시작하기
```bash
npm install
npm run start
```

## 음성 기능 실행 주의사항
- `expo-speech-recognition`은 일반 Expo Go에서 제약이 있습니다.
- 음성 인식 테스트는 Development Build 또는 EAS 빌드에서 진행하세요.
- 권장: `npx expo prebuild` -> `npx expo run:android` 또는 `npx expo run:ios`

## 주요 스크립트
```bash
npm run typecheck   # 타입 검사
npm run test        # 단위 테스트
npm run doctor      # Expo 환경 검사
npm run ci          # typecheck + test
```

## CI 게이트
- GitHub Actions 필수 체크: `quality`, `doctor`, `audit`
- 릴리즈 브랜치 머지 전 3개 체크가 모두 통과되어야 합니다.

## 문서
- 통합 기준 문서: `docs/master-spec.md`
- 출시 실행 문서: `docs/launch-runbook.md`
- 스토어 산출물 체크: `docs/store-assets-checklist.md`
- 문서 인덱스: `docs/README.md`

## 실제 스토어 출시 준비
1. `app.json`의 번들 식별자/버전 확인
2. `npm run ci` + `npm run doctor` 통과
3. `npx eas build -p android --profile production`
4. `npx eas build -p ios --profile production`
5. `npx eas submit`로 각 스토어 제출

상세 절차는 `docs/launch-runbook.md`를 따릅니다.
