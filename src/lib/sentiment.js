/**
 * Lightweight sentiment analysis without an LLM.
 * Returns 'Positive', 'Negative', or 'Neutral'.
 */
export function detectSentiment(text) {
  if (!text || typeof text !== 'string') return 'Neutral';
  
  const lower = text.toLowerCase();
  
  // Weights can be added, but a simple count works for this scenario
  const positiveWords = [
    'thank', 'great', 'good', 'awesome', 'love', 'amazing', 
    'excellent', 'perfect', 'appreciate', 'happy', 'cool', 
    'nice', 'sweet', 'best', 'fantastic'
  ];
  
  const negativeWords = [
    'bad', 'terrible', 'hate', 'worst', 'angry', 'upset', 
    'complain', 'issue', 'problem', 'broken', 'wrong', 
    'delay', 'suck', 'awful', 'horrible', 'poor', 'slow'
  ];
  
  let pScore = 0;
  let nScore = 0;
  
  positiveWords.forEach(w => { if (lower.includes(w)) pScore++; });
  negativeWords.forEach(w => { if (lower.includes(w)) nScore++; });
  
  if (pScore > nScore) return 'Positive';
  if (nScore > pScore) return 'Negative';
  
  return 'Neutral';
}

/**
 * Heuristic-based language detection for English and major Nigerian languages.
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'English';
  
  const lower = text.toLowerCase();
  
  // Igbo markers (e.g., Nnoo, Kedu, Imela, ka chi fo)
  const igboMarkers = [
    'nnoo', 'kedu', 'imela', 'ebu', 'na', 'nye', 'aka', 'chi', 'fo', 
    'anyi', 'onye', 'ha', 'mu', 'gi', 'ụmụ', 'nke', 'ebe', 'maka',
    'mana', 'agumakwukwo', 'software', 'ile'
  ];
  
  // Yoruba markers (e.g., Bawo, E kaabo, Mo dupe)
  const yorubaMarkers = [
    'bawo', 'kaabo', 'dupe', 'pẹlu', 'gbogbo', 'nitori', 'nibẹ', 'ohun',
    'awọn', 'yẹn', 'ṣe', 'wọn', 'fun', 'ọmọ', 'aye', 'pada', 'ṣugbọn',
    'ẹni', 'ẹran'
  ];
  
  // Hausa markers (e.g., Sannu, Barka, Inna kwan kwana)
  const hausaMarkers = [
    'sannu', 'barka', 'ina', 'kwana', 'lafiya', 'nagode', 'yana', 'kowa',
    'shiga', 'lokaci', 'sosai', 'fitar', 'domin', 'yanzu', 'kuma', 'zuwa',
    'amma', 'wanda', 'guda'
  ];

  let scores = { 'Igbo': 0, 'Yoruba': 0, 'Hausa': 0 };

  igboMarkers.forEach(m => { if (lower.includes(m)) scores['Igbo']++; });
  yorubaMarkers.forEach(m => { if (lower.includes(m)) scores['Yoruba']++; });
  hausaMarkers.forEach(m => { if (lower.includes(m)) scores['Hausa']++; });

  const maxScore = Math.max(...Object.values(scores));
  if (maxScore > 0) {
    const detected = Object.keys(scores).find(key => scores[key] === maxScore);
    return detected;
  }

  return 'English';
}
