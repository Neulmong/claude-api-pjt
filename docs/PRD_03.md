# PRD_03: 사용자 프로필 및 레시피 저장 (User Profile & Recipe Save)

## 개요
사용자 프로필을 생성하고, PRD_02에서 생성된 레시피를 프로필에 저장하여 나중에 다시 확인할 수 있도록 하는 기능.

## 목표
- 사용자가 회원가입/로그인 등을 통해 프로필을 생성할 수 있다.
- 사용자가 마음에 든 레시피를 자신의 프로필에 저장(북마크)할 수 있다.
- 저장된 레시피 목록을 조회, 삭제할 수 있다.

## 범위 (In Scope)
- 사용자 프로필 생성/조회 API (`POST /api/users`, `GET /api/users/:id`)
- 레시피 저장 API (`POST /api/users/:id/recipes`)
- 저장된 레시피 목록 조회 API (`GET /api/users/:id/recipes`)
- 저장된 레시피 삭제 API (`DELETE /api/users/:id/recipes/:recipeId`)
- 데이터베이스(Supabase) 스키마 설계 및 마이그레이션

## 범위 밖 (Out of Scope)
- 이미지 인식 (PRD_01에서 다룸)
- 레시피 생성 (PRD_02에서 다룸)
- 소셜 로그인, 비밀번호 재설정 등 고급 인증 기능 (추후 별도 PRD)

## 사용자 흐름
1. 사용자가 프로필을 생성한다 (이름, 이메일 등 기본 정보 입력).
2. PRD_02에서 추천받은 레시피 중 마음에 드는 레시피를 "저장" 버튼으로 저장한다.
3. 프론트엔드가 선택한 레시피 데이터를 `POST /api/users/:id/recipes`로 전송한다.
4. 백엔드가 레시피 데이터를 Supabase 데이터베이스에 저장한다.
5. 사용자는 "내 레시피" 페이지에서 저장된 레시피 목록을 확인할 수 있다.
6. 사용자는 더 이상 필요 없는 레시피를 삭제할 수 있다.

## 데이터베이스 스키마 (초안)

### `users` 테이블
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | 기본 키 |
| name | text | 사용자 이름 |
| email | text | 이메일 (unique) |
| created_at | timestamp | 생성일시 |

### `saved_recipes` 테이블
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | uuid | 기본 키 |
| user_id | uuid | `users.id` 참조 (foreign key) |
| title | text | 레시피 이름 |
| used_ingredients | jsonb | 사용된 재료 목록 |
| missing_ingredients | jsonb | 부족한 재료 목록 |
| estimated_cook_time | text | 예상 조리 시간 |
| steps | jsonb | 조리 단계 목록 |
| created_at | timestamp | 저장일시 |

## API 설계 (초안)

### `POST /api/users`
**Request**
```json
{ "name": "홍길동", "email": "hong@example.com" }
```
**Response**
```json
{ "success": true, "user": { "id": "uuid", "name": "홍길동", "email": "hong@example.com" } }
```

### `POST /api/users/:id/recipes`
**Request**
```json
{
  "title": "달걀 상추 볶음밥",
  "usedIngredients": ["달걀", "상추"],
  "missingIngredients": ["밥", "간장"],
  "estimatedCookTime": "15분",
  "steps": ["...", "...", "..."]
}
```
**Response**
```json
{ "success": true, "recipe": { "id": "uuid", "title": "달걀 상추 볶음밥", "...": "..." } }
```

### `GET /api/users/:id/recipes`
**Response**
```json
{ "success": true, "recipes": [ { "id": "uuid", "title": "달걀 상추 볶음밥", "...": "..." } ] }
```

### `DELETE /api/users/:id/recipes/:recipeId`
**Response**
```json
{ "success": true }
```

## 기술 고려사항
- 데이터베이스 스키마 변경은 반드시 마이그레이션(`npm run migrate`)을 통해 관리하고 수동 SQL은 지양
- `saved_recipes.user_id`에 대한 외래 키 제약 조건으로 데이터 무결성 보장
- 인증/인가 방식은 최소 기능(예: 이메일 기반 식별)으로 시작하고, 추후 별도 PRD에서 본격적인 인증 체계 설계
- 개인정보(이메일 등)는 로그에 남기지 않도록 주의

## 성공 기준 (Acceptance Criteria)
- [ ] 사용자가 프로필을 생성하고 조회할 수 있다.
- [ ] 사용자가 레시피를 저장하고, 저장된 레시피 목록을 조회할 수 있다.
- [ ] 사용자가 저장된 레시피를 삭제할 수 있다.
- [ ] 데이터베이스 스키마 변경 시 마이그레이션 파일로 관리된다.
