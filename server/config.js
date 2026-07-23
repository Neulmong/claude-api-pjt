require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openrouterModel: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  openrouterBaseUrl: 'https://openrouter.ai/api/v1',
};

function validateEnv() {
  const missing = [];
  if (!config.openrouterApiKey) missing.push('OPENROUTER_API_KEY');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in real values.'
    );
  }
}

module.exports = { config, validateEnv };
