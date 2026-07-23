const express = require('express');
const multer = require('multer');
const { chatCompletion } = require('../services/openrouterClient');
const { parseModelJson } = require('../lib/parseModelJson');

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const DATA_URI_PATTERN = /^data:image\/(jpeg|jpg|png|webp|avif);base64,/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
});

const router = express.Router();

const RECOGNITION_PROMPT = `당신은 냉장고 내부 사진을 분석하는 어시스턴트입니다.
사진 속에 보이는 식재료를 최대한 정확하게 인식하고, 아래 JSON 형식으로만 응답하세요.
설명이나 추가 텍스트 없이 JSON 객체만 반환해야 합니다.

{
  "items": [
    { "name": "재료명", "category": "카테고리", "estimatedQuantity": "추정 수량" }
  ]
}`;

function resolveImageDataUri(req) {
  if (req.file) {
    const mimeType = req.file.mimetype || 'image/jpeg';
    return `data:${mimeType};base64,${req.file.buffer.toString('base64')}`;
  }

  if (typeof req.body?.image === 'string') {
    return req.body.image;
  }

  return null;
}

router.post('/recognize', upload.single('image'), async (req, res) => {
  const imageDataUri = resolveImageDataUri(req);

  if (!imageDataUri) {
    return res.status(400).json({
      success: false,
      error: '이미지가 제공되지 않았습니다. "image" 필드로 파일 또는 base64 데이터를 전달하세요.',
    });
  }

  if (!DATA_URI_PATTERN.test(imageDataUri)) {
    return res.status(400).json({
      success: false,
      error: '지원하지 않는 이미지 형식입니다. jpeg, png, webp, avif만 지원합니다.',
    });
  }

  if (imageDataUri.length > MAX_IMAGE_BYTES * 1.4) {
    return res.status(413).json({
      success: false,
      error: '이미지 크기가 너무 큽니다. 10MB 이하의 이미지를 사용하세요.',
    });
  }

  let rawModelOutput;
  try {
    rawModelOutput = await chatCompletion([
      {
        role: 'user',
        content: [
          { type: 'text', text: RECOGNITION_PROMPT },
          { type: 'image_url', image_url: { url: imageDataUri } },
        ],
      },
    ]);
  } catch (err) {
    console.error('[vision.recognize] OpenRouter call failed:', err.message);
    return res.status(502).json({
      success: false,
      error: '이미지 인식 모델 호출에 실패했습니다.',
    });
  }

  try {
    const parsed = parseModelJson(rawModelOutput);
    if (!Array.isArray(parsed.items)) {
      throw new Error('Model output missing "items" array.');
    }

    return res.json({
      success: true,
      items: parsed.items,
      rawModelOutput,
    });
  } catch (err) {
    return res.status(422).json({
      success: false,
      error: '이미지를 인식할 수 없습니다.',
      rawModelOutput,
    });
  }
});

module.exports = router;
