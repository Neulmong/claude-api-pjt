function parseModelJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON object found in model output.');
  }

  return JSON.parse(candidate.slice(start, end + 1));
}

module.exports = { parseModelJson };
