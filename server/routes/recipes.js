const express = require('express');
const { chatCompletion } = require('../services/openrouterClient');
const { parseModelJson } = require('../lib/parseModelJson');

const router = express.Router();

function buildPrompt(items, preferences) {
  const preferenceLines = [];
  if (preferences?.cuisine) preferenceLines.push(`선호 요리 종류: ${preferences.cuisine}`);
  if (preferences?.maxCookTime) preferenceLines.push(`최대 조리 시간: ${preferences.maxCookTime}`);

  return `당신은 주어진 식재료로 만들 수 있는 요리를 추천하는 어시스턴트입니다.
아래 식재료 목록을 참고하여 최대 3개의 레시피를 추천하고, 아래 JSON 형식으로만 응답하세요.
설명이나 추가 텍스트 없이 JSON 객체만 반환해야 합니다.

식재료 목록:
${JSON.stringify(items)}
${preferenceLines.length > 0 ? `\n선호 사항:\n${preferenceLines.join('\n')}` : ''}

{
  "recipes": [
    {
      "title": "레시피 이름",
      "usedIngredients": ["사용된 재료"],
      "missingIngredients": ["부족한 재료"],
      "estimatedCookTime": "예상 조리 시간",
      "steps": ["조리 단계 1", "조리 단계 2"]
    }
  ]
}`;
}

router.post('/generate', async (req, res) => {
  const { items, preferences } = req.body ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      error: '식재료 목록(items)이 제공되지 않았습니다.',
    });
  }

  let rawModelOutput;
  try {
    rawModelOutput = await chatCompletion([
      { role: 'user', content: buildPrompt(items, preferences) },
    ]);
  } catch (err) {
    console.error('[recipes.generate] OpenRouter call failed:', err.message);
    return res.status(502).json({
      success: false,
      error: '레시피 생성 모델 호출에 실패했습니다.',
    });
  }

  try {
    const parsed = parseModelJson(rawModelOutput);
    if (!Array.isArray(parsed.recipes) || parsed.recipes.length === 0) {
      throw new Error('Model output missing "recipes" array.');
    }

    return res.json({ success: true, recipes: parsed.recipes });
  } catch (err) {
    return res.status(422).json({
      success: false,
      error: '레시피를 생성할 수 없습니다.',
      rawModelOutput,
    });
  }
});

module.exports = router;
