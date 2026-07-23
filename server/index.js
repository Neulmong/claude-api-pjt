const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const { config, validateEnv } = require('./config');
const visionRoutes = require('./routes/vision');
const recipeRoutes = require('./routes/recipes');

validateEnv();

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/vision', visionRoutes);
app.use('/api/recipes', recipeRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: '이미지 크기가 너무 큽니다. 10MB 이하의 이미지를 사용하세요.',
    });
  }

  console.error('[unhandled error]', err.message);
  return res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
});

app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});
