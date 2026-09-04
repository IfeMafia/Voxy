// In-memory store for real-time conversation typing states
const globalStore = globalThis._voxyTypingStore || (globalThis._voxyTypingStore = new Map());

export function setTypingState(conversationId, sender, isTyping) {
  if (!conversationId) return;
  const current = globalStore.get(conversationId) || {};
  const isBusiness = sender === 'business' || sender === 'owner';
  const key = isBusiness ? 'isBusinessTyping' : 'isCustomerTyping';

  globalStore.set(conversationId, {
    ...current,
    [key]: Boolean(isTyping),
    updatedAt: Date.now(),
  });
}

export function getTypingState(conversationId) {
  if (!conversationId) return { isBusinessTyping: false, isCustomerTyping: false };
  const entry = globalStore.get(conversationId);
  if (!entry) return { isBusinessTyping: false, isCustomerTyping: false };

  const isFresh = Date.now() - (entry.updatedAt || 0) < 4000;
  return {
    isBusinessTyping: isFresh ? Boolean(entry.isBusinessTyping) : false,
    isCustomerTyping: isFresh ? Boolean(entry.isCustomerTyping) : false,
  };
}
