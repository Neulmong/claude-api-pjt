# PRD_02: 레시피 추천 생성 (Recipe Generation)

## 개요
PRD_01(이미지 인식) 단계에서 추출된 식재료 목록을 입력으로 받아, AI 모델을 통해 해당 재료로 만들 수 있는 레시피를 추천하는 기능.

## 목표
- 인식된 식재료 목록을 기반으로 실행 가능한 레시피(요리명, 재료, 조리법)를 생성한다.
- 사용자가 보유하지 않은 재료가 있다면 대체 가능한 재료 또는 추가 구매가 필요한 재료를 안내한다.

## 사용 모델
- `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` (OpenRouter 경유)
- 텍스트 기반 추론(reasoning) 모델로, 식재료 목록을 프롬프트에 포함하여 레시피를 생성

## 범위 (In Scope)
- 레시피 생성 API 엔드포인트 (`POST /api/recipes/generate`)
- PRD_01의 식재료 목록(JSON)을 입력으로 받아 레시피 후보를 생성
- 레시피 응답을 구조화된 형식(레시피명, 재료, 조리 단계, 예상 조리 시간)으로 파싱
- 다수의 레시피 후보(예: 3개) 중 사용자가 선택할 수 있도록 제공

## 범위 밖 (Out of Scope)
- 이미지 인식 (PRD_01에서 다룸)
- 사용자 프로필 생성 및 레시피 저장 (PRD_03에서 다룸)
- 실제 배송/구매 연동

## 사용자 흐름
1. 사용자가 PRD_01에서 인식/수정한 식재료 목록을 확인 후 "레시피 추천받기" 버튼을 클릭한다.
2. 프론트엔드가 식재료 목록을 `POST /api/recipes/generate`로 전송한다.
3. 백엔드가 식재료 목록을 프롬프트에 포함하여 OpenRouter API의 `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` 모델을 호출한다.
4. 모델은 아래와 유사한 형식의 레시피 후보를 반환하도록 프롬프트로 유도한다:
   ```json
   {
     "recipes": [
       {
         "title": "달걀 상추 볶음밥",
         "usedIngredients": ["달걀", "상추"],
         "missingIngredients": ["밥", "간장"],
         "estimatedCookTime": "15분",
         "steps": [
           "팬에 기름을 두르고 달걀을 스크램블한다.",
           "밥을 넣고 볶은 후 상추를 썰어 넣는다.",
           "간장으로 간을 맞춘다."
         ]
       }
     ]
   }
   ```
5. 프론트엔드는 레시피 후보 목록을 카드 형태로 사용자에게 보여준다.
6. 사용자는 마음에 드는 레시피를 선택할 수 있다 (선택 시 PRD_03의 저장 기능과 연동).

## API 설계 (초안)

### `POST /api/recipes/generate`
**Request**
```json
{
  "items": [
    { "name": "달걀", "category": "유제품/계란", "estimatedQuantity": "6개" },
    { "name": "상추", "category": "채소", "estimatedQuantity": "1포기" }
  ],
  "preferences": {
    "cuisine": "한식",
    "maxCookTime": "30분"
  }
}
```
> `preferences`는 선택 필드 (없으면 기본값으로 다양한 레시피 생성)

**Response**
```json
{
  "success": true,
  "recipes": [
    {
      "title": "달걀 상추 볶음밥",
      "usedIngredients": ["달걀", "상추"],
      "missingIngredients": ["밥", "간장"],
      "estimatedCookTime": "15분",
      "steps": ["...", "...", "..."]
    }
  ]
}
```

**Error Response**
```json
{
  "success": false,
  "error": "레시피를 생성할 수 없습니다."
}
```

## 기술 고려사항
- PRD_01과 동일하게 `OPENROUTER_API_KEY`를 `.env`에서 관리하고 시작 시 검증
- 식재료가 적거나 애매한 경우에도 최소 1개 이상의 레시피를 생성하도록 프롬프트 설계
- 모델 응답을 JSON으로 안정적으로 파싱하기 위한 스키마 검증 및 파싱 실패 시 재시도 로직
- 응답 시간이 길어질 수 있으므로 로딩 상태 UI 고려

## 성공 기준 (Acceptance Criteria)
- [ ] 식재료 목록 입력 시 최소 1개 이상, 최대 3개의 레시피 후보를 반환한다.
- [ ] 각 레시피는 재료, 조리 단계, 예상 조리 시간을 포함한다.
- [ ] 보유하지 않은 재료(missingIngredients)를 명확히 구분하여 제공한다.
- [ ] 레시피 생성 실패 시 사용자에게 명확한 에러 메시지를 제공한다.
