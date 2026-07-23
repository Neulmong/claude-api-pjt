const { config } = require('../config');

async function chatCompletion(messages) {
  const response = await fetch(`${config.openrouterBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openrouterApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.openrouterModel,
      messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`OpenRouter request failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('OpenRouter response did not contain any content.');
  }

  return content;
}

module.exports = { chatCompletion };
