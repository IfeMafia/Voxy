/**
 * YarnGPT TTS Integration Service (Task S9)
 * Connects Voxy agent responses to YarnGPT for authentic Nigerian voice synthesis.
 */

export const YARNGPT_VOICES = [
  'Chinenye',
  'Idera',
  'Emma',
  'Zainab',
  'Osagie',
  'Wura',
  'Jude',
  'Tayo',
  'Regina',
  'Femi',
  'Adaora',
  'Umar',
  'Mary'
];

/**
 * Generate speech audio using YarnGPT API.
 * @param {string} text Sanitized speech text
 * @param {Object} options Options object ({ voice, apiKey, timeoutMs })
 * @returns {Promise<string>} Base64 audio Data URL (data:audio/mp3;base64,...)
 */
export async function generateYarnGptSpeech(text, options = {}) {
  const apiKey = options.apiKey || process.env.YARNGPT_API_KEY;
  if (!apiKey) {
    throw new Error('YARNGPT_API_KEY environment variable is not configured');
  }

  // Validate voice or fallback to default 'Chinenye'
  const requestedVoice = options.voice || 'Chinenye';
  const voice = YARNGPT_VOICES.find(
    (v) => v.toLowerCase() === requestedVoice.toLowerCase()
  ) || 'Chinenye';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 12000);

  let response;
  try {
    response = await fetch('https://yarngpt.ai/api/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice,
        response_format: 'mp3',
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('YarnGPT API request timed out after 12s');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`YarnGPT API error ${response.status}: ${errorText || response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Audio = buffer.toString('base64');

  return `data:audio/mp3;base64,${base64Audio}`;
}
