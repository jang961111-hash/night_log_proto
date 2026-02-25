# NightLog Market Benchmark (AI Diary Services)

이 문서는 시중 AI 일기 서비스의 공통 UX 패턴을 NightLog에 반영하기 위한 비교표입니다.  
제품 기준 명세는 `docs/master-spec.md`를 따릅니다.

## 1. 벤치마크 대상
1. Day One
2. Journey
3. Reflection
4. Rosebud
5. Mindsera
6. Stoic
7. Daysi

## 2. 반영 매트릭스
| 시장 패턴 | 대표 서비스 | NightLog 반영 상태 | 현재 구현 |
|---|---|---|---|
| 대화형 저널 + 빠른 로그 입력 | Day One, Reflection | 적용 완료 | `JournalScreen`에 `대화 모드/로그 모드` 추가 |
| 데일리 프롬프트 기반 진입 | Day One, Mindsera | 적용 완료 | 프롬프트 카드/순환/입력창 채우기 |
| 감정 체크인(Mood Check-in) | Journey, Stoic, Reflection | 적용 완료 | 시작 전 감정 선택, 결과/통계 반영 |
| 결과 리포트(코치형 피드백) | Rosebud, Reflection | 적용 완료 | Result의 `AI 코치 리포트` 섹션 |
| 저널 히스토리 기반 질문 응답 | Daysi, Mindsera | 적용 완료 | Calendar의 `내 기록에게 묻기` |
| 감정 필터 + 캘린더 트렌드 | Journey, Stoic | 적용 완료 | 감정 필터 칩 + 주간 그래프 |
| 프라이버시/보안 기본 강화 | Day One 계열 패턴 | 적용 완료(프로토타입 수준) | 비밀번호 해시 저장 + 로컬 저장소 마이그레이션 |
| 알림/리마인더 자동화 | Journey, Stoic | 부분 반영 | 일정 조절은 제공, 푸시 알림은 백로그 |

## 3. 이번 릴리즈에서 채택한 핵심 UX 원칙
1. 입력 진입 장벽 축소: 프롬프트와 빠른 로그를 기본 제공
2. 감정-행동 연결 강화: 체크인 감정 -> 결과 리포트 -> 일정 추천
3. 회고의 재사용성 강화: 기록 기반 질의응답 카드 추가
4. 통계 가시성 강화: 감정 필터와 주간 리포트 병행 제공

## 4. 다음 고도화 백로그
1. 온디바이스/서버 혼합 검색(RAG)으로 Q&A 정확도 개선
2. 푸시 알림(리마인더) + 설정 화면
3. 첨부 이미지/음성 일기 입력
4. 데이터 내보내기(PDF/Markdown)
5. 개인정보 잠금(PIN/생체인증)

## 5. 참고 링크
1. https://dayoneapp.com/blog/daily-chat/
2. https://dayoneapp.com/features/ai-features/
3. https://help.journey.cloud/en/article/introducing-ai-assistant-vj9s8c/
4. https://www.reflection.app/blog/five-insights-from-our-journals
5. https://www.rosebud.app/
6. https://www.mindsera.com/
7. https://www.stoicroutine.com/
8. https://daysi.com/
