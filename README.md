# claude-api-pjt

냉장고 사진을 인식해서 레시피를 추천하는 웹 애플리케이션입니다.

## 기능

- **[PRD_01](docs/PRD_01.md) 이미지 인식** — 냉장고 사진을 업로드하면 `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` 모델(OpenRouter)이 사진 속 식재료를 인식해 구조화된 목록으로 반환합니다.
- **[PRD_02](docs/PRD_02.md) 레시피 추천** — 인식된 식재료 목록을 바탕으로 같은 모델이 만들 수 있는 레시피 후보를 생성합니다.
- **[PRD_03](docs/PRD_03.md) 사용자 프로필 & 저장** — 예정 (아직 구현되지 않음)

## 기술 스택

- Node.js + Express
- OpenRouter API (vision + reasoning 모델 호출)
- 순수 HTML/JS 테스트 페이지 (`public/index.html`)

## 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 OPENROUTER_API_KEY 값을 채워주세요

# 3. 개발 서버 실행
npm run dev
```

서버가 실행되면 브라우저에서 `http://localhost:3000` 에 접속해 이미지 업로드 → 인식 → 레시피 추천까지 테스트할 수 있습니다.

## API

### `POST /api/vision/recognize`
냉장고 사진(멀티파트 파일 `image` 또는 JSON `{ "image": "data:image/...;base64,..." }`)을 받아 인식된 식재료 목록을 반환합니다.

```json
{
  "success": true,
  "items": [
    { "name": "달걀", "category": "유제품/계란", "estimatedQuantity": "6개" }
  ]
}
```

### `POST /api/recipes/generate`
식재료 목록을 받아 레시피 후보(최대 3개)를 생성합니다.

```json
{
  "items": [{ "name": "달걀", "category": "유제품/계란", "estimatedQuantity": "6개" }],
  "preferences": { "cuisine": "한식", "maxCookTime": "30분" }
}
```

## 프로젝트 구조

```
server/
  index.js               # Express 앱 엔트리포인트
  config.js              # .env 로드 및 검증
  routes/
    vision.js             # POST /api/vision/recognize
    recipes.js            # POST /api/recipes/generate
  services/
    openrouterClient.js   # OpenRouter chat completions 호출
  lib/
    parseModelJson.js     # 모델 응답에서 JSON 추출
public/
  index.html              # 수동 테스트용 웹 페이지
docs/
  PRD_01.md / PRD_02.md / PRD_03.md
```

## 참고

- `OPENROUTER_API_KEY`는 OpenRouter 무료 티어 기준 일일 요청 한도가 있습니다 (계정당 50회/일). 한도 초과 시 402/429 에러가 반환됩니다.
- `package-lock.json`은 저장소에 포함되어 있지 않습니다. `npm install` 실행 시 `package.json` 기준으로 새로 생성됩니다.
