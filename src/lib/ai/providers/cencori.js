import { cencoriClient } from '../../cencori.js';

/**
 * Cencori AI Provider
 * Integrates Cencori's unified AI API into Voxy's provider chain.
 */
export const generateCencoriResponse = async (messages, systemInstruction) => {
  try {
    // Normalize messages to Cencori's expected format
    const cencoriMessages = [
      { role: 'system', content: systemInstruction },
      ...messages.map(m => ({
        role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content || (m.parts && m.parts[0] ? m.parts[0].text : '')
      }))
    ];

    // Using the official SDK's chat method
    const response = await cencoriClient.ai.chat({
      messages: cencoriMessages,
      model: 'gpt-4o-mini', // High performance, low cost default
    });

    return {
      text: response.content,
      provider: "cencori",
      tokensUsed: response.usage?.totalTokens || 0
    };
  } catch (error) {
    console.error('Cencori Provider Error:', error);
    throw error;
  }
};
