# NightLog 페이지별 개선 체크리스트

기준 문서:
- `docs/master-spec.md`

작업 원칙:
- 화면별로 `구조 점검 -> 카피/상태/접근성 수정 -> 타입체크` 순서로 진행
- 한 번에 한 페이지씩 수정하고 바로 검증

## 구조 개요
- 라우팅/상태 허브: `App.tsx`
- 공통 UI: `src/components/*`
- 화면: `src/screens/*`
- 도메인 로직: `src/lib/*`
- 디자인 토큰: `src/theme/tokens.ts`

## 페이지 순서
1. [x] `LandingScreen` (`src/screens/LandingScreen.tsx`)
2. [x] `LoginScreen` (`src/screens/LoginScreen.tsx`)
3. [x] `SignupScreen` (`src/screens/SignupScreen.tsx`)
4. [x] `InterestScreen` (`src/screens/InterestScreen.tsx`)
5. [x] `HomeScreen` (`src/screens/HomeScreen.tsx`)
6. [x] `JournalScreen` (`src/screens/JournalScreen.tsx`)
7. [x] `ResultScreen` (`src/screens/ResultScreen.tsx`)
8. [x] `ScheduleScreen` (`src/screens/ScheduleScreen.tsx`)
9. [x] `CalendarInsightsScreen` (`src/screens/CalendarInsightsScreen.tsx`)
10. [x] `SettingsScreen` (`src/screens/SettingsScreen.tsx`)
11. [x] `LegalScreen` (`src/screens/LegalScreen.tsx`)
12. [x] `IntroSplashScreen` (`src/screens/IntroSplashScreen.tsx`)

## 이번 턴 적용 사항
- `LandingScreen`
  - `SafeAreaView + ScrollView`로 작은 화면 대응
  - 랜딩 카피 정리
  - CTA 라벨 정리
- `LoginScreen`
  - 제출 가능 조건(`ID/PASSWORD`) 기반 버튼 상태 제어
  - 입력 중 에러 초기화
  - 안전영역 적용
- `SignupScreen`
  - 비밀번호/확인 인라인 검증 강화
  - 생년월일(`YYYY-MM-DD`) 형식 검증 추가
  - 필수 동의/필수 입력/검증 상태 기반 제출 제어
  - 안전영역 적용
- `InterestScreen`
  - 선택 개수 표시
  - 작은 화면 안전영역 정리
  - 하단 액션 영역 유지
- `HomeScreen`
  - 안전영역 적용
  - 상단 지표를 카드형 메타칩으로 정리
  - CTA 카피/구조 정리
  - 스크롤 최소 높이 계산 안정화
- `JournalScreen`
  - 안전영역 적용
  - 음성 듣기 흐름 분리(한 번 듣기 vs 자동 재청취)
  - 조기 종료 활성화 조건 강화(최소 1회 사용자 응답)
  - 하단 고정 액션 위치 보정
- `ResultScreen`
  - 안전영역 적용
  - 추천 일정이 없을 때 빈 상태 메시지 추가
  - 하단 CTA를 오버레이 방식에서 표준 하단 바 방식으로 정리
- `ScheduleScreen`
  - 안전영역 적용
  - 하단 FAB를 표준 하단 액션 바로 교체
  - 일정 제목/시간 입력 보정(blur 시 trim/normalize)
- `CalendarInsightsScreen`
  - 안전영역 적용
  - 사용자별 데이터 필터 기준 정리
  - 질문 입력 비어 있을 때 AI 답변 버튼 비활성
  - 하단 돌아가기 버튼을 표준 하단 바로 정리
- `SettingsScreen`
  - 안전영역 적용
  - 이름/직업 입력 중 상태 메시지 자동 정리
  - 저장 가능 조건 기반 버튼 상태 제어
- `LegalScreen`
  - 안전영역 적용
  - 문서 카드 레이아웃 유지한 채 기본 읽기 흐름 정리
- `IntroSplashScreen`
  - 안전영역 적용
  - 인트로 태그라인 문구 정리
- 검증
  - `npm run typecheck`
  - `npm run test`
