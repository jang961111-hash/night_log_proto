# NightLog Launch Runbook

이 문서는 실제 앱스토어/플레이스토어 출시를 위한 실행 절차 문서입니다.  
기능 정책과 요구사항은 `docs/master-spec.md`를 기준으로 합니다.

## 1. 사전 준비
1. Apple Developer Program 계정
2. Google Play Console 계정
3. Expo/EAS 계정
4. 앱 아이콘/스플래시/스토어 스크린샷/개인정보처리방침 URL
   - 상세 체크: `docs/store-assets-checklist.md`
5. 번들 식별자 확정
   - iOS: `ios.bundleIdentifier`
   - Android: `android.package`

## 2. 릴리즈 전 코드 게이트
1. `npm ci`
2. `npm run typecheck`
3. `npm run test`
4. `npm run doctor`
5. 실기기 수동 QA (랜딩 -> 가입/로그인 -> 홈 -> 대화 -> 결과 -> 일정 -> 캘린더)
6. 음성 권한/음성 인식 수동 QA
   - iOS: 마이크 + 음성 인식 권한 허용/거부 각각 검증
   - Android: 기본 음성 서비스 패키지 동작 확인
   - Expo Go가 아닌 Development Build/EAS 빌드에서 검증
7. GitHub 필수 체크 통과
   - `quality` (typecheck + unit test)
   - `doctor` (expo-doctor)
   - `audit` (production dependency audit)

## 3. 버전 정책
1. `app.json`의 `expo.version` 업데이트
2. Android `versionCode` 증가
3. iOS `buildNumber` 증가
4. `eas.json` production은 `autoIncrement: true` 사용

## 4. EAS 빌드
1. 로그인
   - `npx eas login`
2. 프로젝트 초기화(최초 1회)
   - `npx eas init`
3. Android AAB 빌드
   - `npx eas build -p android --profile production`
4. iOS IPA 빌드
   - `npx eas build -p ios --profile production`

## 5. 스토어 제출
1. Android 제출
   - `npx eas submit -p android --profile production`
2. iOS 제출
   - `npx eas submit -p ios --profile production`
3. 스토어 콘솔에서
   - 앱 설명/키워드/연령등급/카테고리/개인정보 응답
   - 스크린샷/아이콘/프로모션 텍스트 업로드
   - 심사 제출

## 6. 출시 체크리스트 (필수)
1. 크래시 치명도 P0 = 0
2. 로그인/회원가입 실패율 수동 점검
3. 데이터 저장/재실행 복원 확인
4. 네트워크 없는 상태에서 앱 비정상 종료 없음
5. 접근성 최소 기준
   - 버튼 role/label
   - 입력 라벨/에러 안내
6. 음성 기능 기준
   - STT 실패 시 텍스트 입력으로 정상 폴백
   - TTS 중 앱 백그라운드 전환/복귀 시 크래시 없음
6. 법적 문서
   - 개인정보처리방침 링크
   - 문의 이메일

## 7. 롤백 계획
1. 스토어 staged rollout 사용
2. 치명 버그 발생 시
   - 배포 비율 중단/축소
   - 직전 안정 빌드 재배포
3. hotfix 브랜치 규칙
   - `release/x.y.z-hotfix`
   - 수정 범위는 P0/P1만 허용

## 8. 출시 후 48시간 운영
1. 크래시/ANR 모니터링 (매 4시간)
2. 핵심 KPI 모니터링
   - 대화 완료율
   - 결과 -> 일정 전환율
3. 사용자 리뷰/문의 1차 분류
4. 48시간 리포트 작성
   - 문제 요약
   - 다음 패치 우선순위

## 9. 의존성 취약점 운영 규칙
1. 릴리즈 전 `npm audit --omit=dev` 실행
2. Expo/RN 생태계 의존 취약점은 즉시 강제 다운그레이드하지 않고 공식 패치 릴리즈 대기
3. 직접 의존성 취약점은 패치 버전 우선 적용
4. 분기마다 SDK 업그레이드 스프린트로 누적 위험 제거
