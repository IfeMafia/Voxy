/**
 * Voice Sanitizer & Pacing Engine (Task S10)
 * Prepares raw agent markdown/text responses for natural, low-latency spoken speech.
 */

/**
 * Clean markdown, emojis, URLs, and formatting, converting currency/symbols for TTS.
 * @param {string} text Raw agent text response
 * @param {number} maxChars Maximum character limit for low-latency voice synthesis
 * @returns {string} Clean speakable text
 */
export function sanitizeForSpeech(text, maxChars = 400) {
  if (!text || typeof text !== 'string') return '';

  let clean = text
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove raw URLs
    .replace(/https?:\/\/\S+/gi, '')
    // Replace currency symbols with spoken words
    .replace(/₦\s*([\d,]+(?:\.\d+)?)/g, '$1 Naira')
    .replace(/\$\s*([\d,]+(?:\.\d+)?)/g, '$1 Dollars')
    .replace(/£\s*([\d,]+(?:\.\d+)?)/g, '$1 Pounds')
    .replace(/€\s*([\d,]+(?:\.\d+)?)/g, '$1 Euros')
    // Replace common symbols
    .replace(/&/g, ' and ')
    .replace(/%/g, ' percent ')
    .replace(/@/g, ' at ')
    .replace(/\+/g, ' plus ')
    // Remove markdown headers
    .replace(/#+\s+/g, '')
    // Remove bold/italics
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    // Convert list bullet points to conversational speech pauses
    .replace(/^[•\-\*]\s+/gm, '')
    .replace(/\n[•\-\*]\s+/g, '. ')
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    // Collapse multiple newlines/spaces
    .replace(/\s*\n+\s*/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!clean) return '';

  // Intelligently clip at full sentence or word boundary if over maxChars
  if (clean.length > maxChars) {
    const truncated = clean.slice(0, maxChars);
    const lastSentenceEnd = Math.max(truncated.lastIndexOf('. '), truncated.lastIndexOf('? '), truncated.lastIndexOf('! '));
    if (lastSentenceEnd > 100) {
      clean = truncated.slice(0, lastSentenceEnd + 1);
    } else {
      const lastSpace = truncated.lastIndexOf(' ');
      clean = (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...';
    }
  }

  return clean;
}
