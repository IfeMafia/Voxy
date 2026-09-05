import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testChatApi() {
  const url = 'http://localhost:3000/api/assistant/chat';
  
  // Turn 1: Order request
  console.log("\n--- Turn 1: 'id like to order Agbado' ---");
  const res1 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: 'beanshaven',
      message: 'id like to order Agbado'
    })
  });
  const data1 = await res1.json();
  console.log("Turn 1 Response:", data1);

  const convId = data1.conversationId;

  // Turn 2: Quantity '1'
  console.log(`\n--- Turn 2: '1' for Conversation ${convId} ---`);
  const res2 = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessId: 'beanshaven',
      conversationId: convId,
      message: '1'
    })
  });
  const data2 = await res2.json();
  console.log("Turn 2 Response:", data2);
}

testChatApi();
