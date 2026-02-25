# NightLog Master Spec (Single Source of Truth)

## 0. 문서 메타
- 문서명: NightLog Master Spec
- 버전: v1.0 (통합본)
- 기준일: 2026-02-24
- 적용 범위: NightLog MVP 전체
- 원칙: 제품/기능/화면/API/데이터/아키텍처/개발/QA 정보의 유일한 기준 문서

## 1. 제품 정의
### 1.1 한 줄 정의
하루를 대화로 정리하고, 감정 기반 인사이트를 내일 일정 실행으로 연결하는 AI 저널 앱.

### 1.2 문제
- 일기 작성 진입장벽이 높다.
- 감정 기록과 실행 계획이 분리되어 실천율이 낮다.
- 기록 추이 시각화가 약해 회고 효율이 낮다.

### 1.3 핵심 가치
- 대화형 저널링으로 입력 부담 최소화
- 자동 감정 태그/요약 제공
- 추천 일정을 즉시 편집/저장
- 캘린더+주간 그래프로 회고 강화

## 2. 사용자/시장 가정
### 2.1 핵심 페르소나
- Persona A (루틴 빌더): 취침 전 10~20분 회고 + 내일 우선순위 정리
- Persona B (감정 관리형): 스트레스/피로 상황에서 회복 행동 도출
- Persona C (계획 최적화형): 추천 일정을 시간 블록으로 빠르게 확정

### 2.2 JTBD
"잠들기 전에 오늘을 짧게 정리하고, 내일의 첫 행동을 확정하고 싶다."

## 3. 목표/KPI
### 3.1 North Star
주간 실행 전환 사용자 수
- 정의: 결과 화면 진입 후 일정을 1개 이상 저장한 사용자 수

### 3.2 핵심 KPI (v1 목표)
1. 가입 후 첫 대화 완료율 >= 70%
2. 결과 화면 진입률(대화 시작 대비) >= 65%
3. 결과 -> 일정 조절 전환율 >= 45%
4. 일정 저장 완료율(일정 화면 진입 대비) >= 60%
5. D7 재방문율 >= 25%
6. 평균 streak >= 2.5일

### 3.3 Guardrail KPI
- 첫 입력 후 2턴 이전 이탈률 <= 30%
- 오류 세션 비율 <= 3%

## 4. 범위 정의 (MoSCoW)
### 4.1 Must
- 로그인/회원가입/관심사
- 저널 대화(Start/Turn/End)
- 결과(요약/감정/추천)
- 일정 조절(시간 편집/추가)
- 캘린더(월력/주간 그래프)
- 로컬 저장

### 4.2 Should
- 수동 카드 결과 반영 일관성
- 접근성 라벨/역할
- 저장 디바운스 최적화

### 4.3 Could
- 관심사 기반 개인화 강화
- 차트 테마 확장
- 다국어 기반

### 4.4 Won't (v1 제외)
- 서버 동기화
- 고급 음성 실시간 스트리밍 튜닝(기본 STT/TTS 범위 외)
- 푸시 알림
- 소셜 공유

### 4.5 스코프 잠금
- Must 미완료 시 Could 금지
- 릴리즈 1주 전 기능 추가 금지(버그 수정만)

## 5. 추천 품질 명세
### 5.1 목표
"내일 바로 실행 가능한 항목" 최소 1개 선택 유도

### 5.2 지표
1. 추천 카드 선택률 >= 55%
2. 선택 후 수정률 <= 40%
3. (향후) 다음날 완료 체크율 >= 35%
4. (향후) 무의미 추천 신고율 < 5%

### 5.3 점수 모델 초안
score = urgency(0~40) + effortFit(0~20) + emotionFit(0~25) + userPreference(0~15)
- urgency: 마감/예약 관련 키워드
- effortFit: 피로/스트레스 상태 반영
- emotionFit: calm/joy 확장, stress/fatigue 회복
- userPreference: 관심사/과거 선택 이력 반영

### 5.4 품질 운영
- 주 1회 샘플 50건 수동 리뷰
- 오탐 Top3 개선 룰 반영

## 6. 개인정보/보안 정책 (MVP)
### 6.1 분류
- 민감: 비밀번호, 개인 식별
- 준민감: 감정 태그/일기
- 일반: 화면 이벤트

### 6.2 현재 정책
- 로컬 저장, 서버 전송 없음
- 앱 삭제 시 데이터 소실 가능

### 6.3 v1.1 보강 요구
1. 비밀번호 평문 저장 제거
2. 민감 로그 차단
3. 데이터 초기화 UI 제공
4. 보관 기간 정책 명시

## 7. 예외 플로우 (Error UX Matrix)
| 상황 | 감지 | 메시지 | 액션 |
|---|---|---|---|
| 세션 만료 | Session not found | 세션이 만료되어 새로 시작합니다 | Start CTA 강조 |
| 저장 실패 | storage write false | 저장 실패, 다시 시도해주세요 | 재시도 + 메모리 폴백 |
| 결과 없음 | result bundle null | 아직 결과가 없습니다 | 메인 복귀 |
| 시간 형식 오류 | invalid HH:mm | 시간 형식을 확인해주세요 | 09:00 보정 |
| 필수값 누락 | form validation fail | 필수 항목을 입력해주세요 | 포커스 이동 + 인라인 오류 |

원칙:
- Alert 남용 금지, 인라인 우선
- 기술 문구보다 행동 유도형 문구 사용

## 8. 콘텐츠/톤 가이드
### 8.1 톤
- 기본: 차분, 실용
- stress/fatigue: 부담 완화
- joy/calm: 확장 행동 제안

### 8.2 카피 원칙
1. 짧고 행동 중심
2. 모호한 위로 문구 지양
3. 한 화면 내 문체 일관
4. 실패 문구에 다음 행동 포함

### 8.3 금지 문구
- 단정적 진단
- 죄책감 유발
- 내부 기술 용어 노출

### 8.4 템플릿
- 성공: 좋아요. 다음으로 {행동}을 해볼까요?
- 실패: {문제}. {다음 행동} 해주세요.
- 빈 상태: 아직 데이터가 없어요. {첫 행동}부터 시작해보세요.

## 9. 기능 명세 (FR)
### FR-01 로그인
- 입력: ID, PASSWORD
- 검증: 공백 입력 불가, 계정 일치
- 성공: interests 또는 journal 이동
- 실패: 인라인 오류

### FR-02 회원가입
- 필수: ID/PW/PW확인/이름/생년월일/성별/직업
- 규칙: PW 6자+, PW 확인 일치, ID 중복 불가
- 성공: 계정 저장 후 interests 이동

### FR-03 관심사 선택
- 다중 선택 가능
- SKIP: 빈 관심사 저장
- 확인: 선택 관심사 저장

### FR-03A 홈 (Night Studio)
- 목적: 로그인 직후 첫 행동을 `대화 시작하기`로 고정
- 레이어:
  - Backdrop Layer: 작업실 배경(비인터랙티브)
  - Content Layer: 인사/기록 요약 + 중앙 CTA + 캘린더 미리보기
- 상단 우측 액션(설정/로그아웃) 제거, 설정은 하단 탭으로만 접근
- 캘린더 미리보기 데이터:
  - 주간 기록 수
  - 일관성 점수
  - 대표 감정
  - 다음 일정 제목/시간
- 데이터 부족 시 빈 상태 문구 노출:
  - "이번 주 첫 기록을 시작해보세요"
  - "최근 결과 없음"

### FR-04 저널 대화
- Start: 세션 시작
- Turn: 입력/카드/감정 갱신
- End: 요약/추천 생성
- STT/TTS 기반 핸즈프리 모드 제공(기기/권한 실패 시 텍스트 입력 폴백)
- 예외: 세션 만료 시 재시작 유도

### FR-05 수동 카드 추가
- + 버튼으로 이벤트/할일 직접 추가
- 입력 일부만 있어도 추가 가능
- 시간 형식 미입력/오류 시 09:00 보정

### FR-06 결과 화면
- 일기/회고 섹션 토글
- 감정 그래프/요약 표시
- 추천 일정 선택 가능
- 메인/일정 조절 CTA 제공

### FR-07 일정 조절
- 항목 제목/시간 편집
- + 버튼으로 행 추가
- 시간 정규화 실패 시 09:00

### FR-08 캘린더/통계
- 월력(기록 날짜 감정 점)
- 주간 감정 선형 그래프
- 주간 하이라이트 최대 3개

### FR-09 설정
- 프로필(이름/직업) 수정
- 관심사 재선택 진입
- 내 기록 초기화(해당 사용자 history/schedule/result)
- 로컬 계정 삭제

### FR-10 법적 문서
- 회원가입/설정에서 이용약관/개인정보 처리방침 열람
- 문서 화면에서 이전 화면으로 안전 복귀

## 10. 화면 플로우
- intro -> landing
- landing -> signup | login
- signup -> interests
- login -> interests | home
- interests -> home
- home -> journal | result | calendar | settings
- journal -> result | calendar | home
- result -> home | schedule | calendar
- schedule -> home
- calendar -> home | journal | result
- settings -> interests | legal | home
- signup -> legal

하단 탭 네비게이션:
- 인증 이후 핵심 화면에 공통 탭 제공 (메인/대화/캘린더/설정)
- 결과 화면은 메인 탭 군으로 분류

### 10.1 Home IA (Night Studio)
- 우선순위:
  1. 대화 시작하기
  2. 캘린더 미리보기
  3. 최근 결과 보기(보조 링크)
- 반응형 규칙:
  - 화면 높이 `< 760`: 배경 장식 축소, 콘텐츠 간격 축소
  - 화면 높이 `>= 760`: 장식 2열 유지, 작업실 오브젝트 전체 노출
- 하단 탭 겹침 방지: 콘텐츠 하단 패딩 190 이상 유지

화면 목록:
- intro, landing, login, signup, interests, home, settings, legal, journal, result, schedule, calendar

## 11. 인터페이스/API 명세
### 11.1 Chat API (internal)
- apiChatStart(mode): Promise<StartResponse>
- apiChatTurn(sessionId, userMessage): Promise<TurnResponse>
- apiChatEnd(sessionId): Promise<EndResponse>
- 에러: Session not found

### 11.2 Storage API
- loadAccounts/saveAccounts
- loadCurrentUser/saveCurrentUser
- loadDiaryHistory/saveDiaryHistory/upsertHistoryItem
- loadScheduleDraft/saveScheduleDraft

## 12. 데이터 명세
### 12.1 핵심 타입
- UserAccount
- SignupForm
- EndResponse
- ResultBundle
- DiaryHistoryRecord
- ScheduleDraftItem

### 12.2 저장 키
- nightlog:accounts:v1
- nightlog:current-user:v1
- nightlog:history:v1
- nightlog:schedule-draft:v1

### 12.3 제약
- history 최대 300개
- 시간 파싱 실패 시 09:00 보정
- 일정 초안은 사용자별 분리 저장

## 13. 아키텍처
### 13.1 계층
- Presentation: App/screens/components/theme
- Domain: mockEngine/insights
- Data: mockApi/storage/schema/types

### 13.2 상태 소유권
- App 전역: route, user, history, result, draft
- Screen 로컬: 입력/토글/모달

### 13.3 확장 방향
- react-navigation 도입
- mockApi -> HTTP API 전환
- 인증/동기화 계층 분리

## 14. 개발 프로세스
1. 기획 확정
2. UX/UI 설계
3. 명세 고정
4. 기술 설계/세팅
5. 인증/온보딩 구현
6. 저널 핵심 구현
7. 결과/일정/캘린더 구현
8. 안정화(P0/P1)
9. QA/릴리즈 준비
10. 베타 운영/개선 반복

권장 일정:
- 1주차: 1~3
- 2주차: 4
- 3주차: 5
- 4주차: 6
- 5주차: 7
- 6주차: 8~9
- 7~8주차: 10

## 15. QA/릴리즈
### 15.1 필수 명령
- npx tsc --noEmit
- npx expo-doctor

### 15.2 핵심 수동 QA
- 가입/로그인/관심사
- 대화 Start/Turn/End
- 결과 선택 반영
- 일정 편집/추가
- 캘린더 집계 표시
- 앱 재실행 후 데이터 유지

### 15.3 릴리즈 게이트
- Must 100% 완료
- P0 결함 0건
- 핵심 플로우 회귀 통과
- CI 필수 체크 통과(`quality`, `doctor`, `audit`)

실행 런북:
- `docs/launch-runbook.md`

## 16. 변경 관리 규칙
- 모든 요구사항 변경은 본 문서 기준으로 먼저 업데이트
- 하위 문서는 본 문서 링크만 유지(중복 상세 금지)
- 버전 태그: v1.0, v1.1, ...

## 17. 시장 벤치마크 반영
- 벤치마크 문서: `docs/market-benchmark.md`
- 이번 반영 핵심:
  1. 대화/로그 이중 입력 모드
  2. 데일리 프롬프트 카드
  3. 감정 체크인 -> 결과 리포트 연계
  4. 기록 기반 Q&A 카드
