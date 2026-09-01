import db from './db.js';
import { supabase } from './supabase.js';

/**
 * Notifies the business owner about a high-urgency event (e.g. human escalation).
 * Marks the conversation as 'Needs Owner Response' and triggers a real-time event.
 * @param {string} conversationId 
 * @param {string} urgency 
 */
export async function notifyBusiness(conversationId, urgency = 'high') {
  try {
    // 1. Update the conversation status in the database
    // Setting it to 'Needs Owner Response' ensures it shows up in dashboards/notifications.
    await db.query(
      "UPDATE conversations SET status = 'Needs Owner Response', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [conversationId]
    );

    // 2. We can trigger a real-time event using Supabase
    // This allows the business dashboard to update instantly if they are watching.
    const { data: conv } = await db.query(
      "SELECT c.id, b.owner_id FROM conversations c JOIN businesses b ON c.business_id = b.id WHERE c.id = $1",
      [conversationId]
    );

    if (conv && conv[0]) {
      // Broadcast a message to the owner's channel
      await supabase.channel(`owner_${conv[0].owner_id}`).send({
        type: 'broadcast',
        event: 'escalation',
        payload: { conversationId, urgency }
      });
    }

    console.log(`[NOTIFY] Escalated conversation ${conversationId} (Urgency: ${urgency})`);
    return true;
  } catch (err) {
    console.error('[NOTIFY] Error escalating conversation:', err);
    return false;
  }
}
