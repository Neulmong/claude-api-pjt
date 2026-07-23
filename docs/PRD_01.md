# PRD_01: 냉장고 이미지 인식 (Image Recognition)

## 개요
사용자가 업로드한 냉장고 내부 사진을 분석하여, 사진 속에 어떤 식재료가 있는지 인식하고 구조화된 데이터(재료명, 추정 수량, 카테고리 등)로 반환하는 기능.

## 목표
- 사용자가 냉장고 사진을 업로드하면, AI 모델이 이미지를 분석해 식재료 목록을 추출한다.
- 추출된 식재료 목록은 2단계(레시피 추천)의 입력값으로 사용된다.

## 사용 모델
- `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` (OpenRouter 경유)
- 비전(vision) 입력을 지원하는 멀티모달 모델로 이미지 URL 또는 base64 인코딩 이미지를 프롬프트에 포함하여 호출

## 범위 (In Scope)
- 이미지 업로드 API 엔드포인트 (`POST /api/vision/recognize`)
- 업로드된 이미지를 base64로 인코딩하여 OpenRouter API에 전달
- 모델 응답을 파싱하여 식재료 목록(JSON) 구조로 변환
- 인식 실패/저품질 이미지에 대한 에러 처리

## 범위 밖 (Out of Scope)
- 레시피 생성 (PRD_02에서 다룸)
- 사용자 프로필 및 저장 기능 (PRD_03에서 다룸)
- 실시간 하드웨어 센서 연동

## 사용자 흐름
1. 사용자가 웹 UI에서 냉장고 사진을 업로드한다.
2. 프론트엔드가 이미지를 `POST /api/inventory`가 아닌 `/api/vision/recognize`로 전송한다.
3. 백엔드가 이미지를 base64로 인코딩하고, OpenRouter API를 통해 `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` 모델을 호출한다.
4. 모델은 이미지 속 식재료를 인식하여 다음과 유사한 JSON을 반환하도록 프롬프트로 유도한다:
   ```json
   {
     "items": [
       { "name": "달걀", "category": "유제품/계란", "estimatedQuantity": "6개" },
       { "name": "상추", "category": "채소", "estimatedQuantity": "1포기" }
     ]
   }
   ```
5. 백엔드는 모델 응답을 파싱하여 프론트엔드에 반환한다.
6. 프론트엔드는 인식된 식재료 목록을 사용자에게 보여주고, 필요 시 수동으로 수정할 수 있게 한다.

## API 설계 (초안)

### `POST /api/vision/recognize`
**Request**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response**
```json
{
  "success": true,
  "items": [
    { "name": "달걀", "category": "유제품/계란", "estimatedQuantity": "6개" }
  ],
  "rawModelOutput": "..."
}
```

**Error Response**
```json
{
  "success": false,
  "error": "이미지를 인식할 수 없습니다."
}
```

## 기술 고려사항
- API 키(`OPENROUTER_API_KEY`)는 `.env`에서 관리하며 `config.validateEnv()`로 시작 시 검증
- 이미지 크기 제한 (예: 10MB 이하) 및 지원 포맷 검증 (jpg, png, avif 등)
- 모델의 자유 텍스트 응답을 안정적으로 JSON으로 파싱하기 위한 프롬프트 엔지니어링 및 파싱 실패 시 재시도 로직 고려
- API 키는 절대 로그에 남기지 않음

## 성공 기준 (Acceptance Criteria)
- [ ] 사용자가 이미지를 업로드하면 5초 이내(모델 응답 시간에 따라 조정 가능)에 식재료 목록을 반환한다.
- [ ] 인식 결과가 최소 name, category 필드를 포함한 구조화된 JSON 형태로 반환된다.
- [ ] 인식 실패 시 사용자에게 명확한 에러 메시지를 제공한다.
- [ ] API 키가 코드나 로그에 노출되지 않는다.
