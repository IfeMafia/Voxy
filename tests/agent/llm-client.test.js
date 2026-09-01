import assert from 'node:assert';
import {
  parseToolCall,
  executeToolCall,
  runReasoning
} from '../../src/lib/ai/agent/reasoning.js';
import { createDefaultToolRegistry } from '../../src/lib/ai/agent/tools/index.js';
import { ToolPermission } from '../../src/lib/ai/agent/types.js';
import { buildSystemInstruction } from '../../src/lib/ai/agent/systemInstruction.js';
import { buildReasoningRequest } from '../../src/lib/ai/agent/conversationContext.js';

async function runTests() {
  console.log('🧪 Starting V2 Agent & Tool Execution Tests...\n');

  // Test 1: parseToolCall
  console.log('Test 1: parseToolCall parsing JSON block...');
  const jsonInput = '```json\n{ "tool": "product_lookup", "args": { "text": "shoes" } }\n```';
  const parsed = parseToolCall(jsonInput);
  assert.strictEqual(parsed?.name, 'product_lookup');
  assert.strictEqual(parsed?.args?.text, 'shoes');
  console.log('✅ Test 1 passed!');

  // Test 2: executeToolCall with unbuilt seam (NotImplementedError)
  console.log('Test 2: executeToolCall handles unbuilt backend seam gracefully...');
  const registry = createDefaultToolRegistry();
  const context = { businessId: 'biz_test', grantedPermissions: [ToolPermission.READ_CATALOGUE] };
  const execResult = await executeToolCall(
    { name: 'product_lookup', args: { text: 'phone' } },
    registry,
    [ToolPermission.READ_CATALOGUE],
    context
  );
  assert.strictEqual(execResult.ok, false);
  assert.strictEqual(execResult.toolName, 'product_lookup');
  assert.ok(execResult.error.includes('NOT_IMPLEMENTED'));
  console.log('✅ Test 2 passed!');

  // Test 3: executeToolCall with missing permission (PermissionDeniedError)
  console.log('Test 3: executeToolCall blocks tool when permission is not granted...');
  const deniedResult = await executeToolCall(
    { name: 'order_builder', args: { lines: [] } },
    registry,
    [ToolPermission.READ_CATALOGUE], // DRAFT_ORDER not granted
    context
  );
  assert.strictEqual(deniedResult.ok, false);
  assert.ok(deniedResult.error.includes('PERMISSION_DENIED'));
  console.log('✅ Test 3 passed!');

  // Test 4: executeToolCall for payment without explicit confirmation (ConfirmationRequiredError)
  console.log('Test 4: payment_request enforces explicit confirmation gate...');
  const unconfirmedContext = {
    businessId: 'biz_test',
    grantedPermissions: [ToolPermission.REQUEST_PAYMENT],
    confirmation: { confirmed: false }
  };
  const unconfirmedPayment = await executeToolCall(
    { name: 'payment_request', args: { orderId: 'ord_123', amount: 5000 } },
    registry,
    [ToolPermission.REQUEST_PAYMENT],
    unconfirmedContext
  );
  assert.strictEqual(unconfirmedPayment.ok, false);
  assert.ok(unconfirmedPayment.error.includes('CONFIRMATION_REQUIRED'));
  console.log('✅ Test 4 passed!');

  // Test 5: buildSystemInstruction
  console.log('Test 5: buildSystemInstruction generates persona + guardrails...');
  const sysInst = buildSystemInstruction({
    businessName: 'Voxy Store',
    tone: 'friendly',
    language: 'English',
    businessSummary: 'We sell electronics.'
  });
  assert.ok(sysInst.includes('You are Voxy'));
  assert.ok(sysInst.includes('Nigerian Naira'));
  assert.ok(sysInst.includes('We sell electronics.'));
  console.log('✅ Test 5 passed!');

  // Test 6: buildReasoningRequest windowing
  console.log('Test 6: buildReasoningRequest windows history correctly...');
  const history = [
    { role: 'user', content: 'hi' },
    { role: 'model', content: 'hello' },
    { role: 'user', content: 'what is your price?' },
    { role: 'model', content: 'our prices are in Naira' },
    { role: 'user', content: 'do you have phones?' },
    { role: 'model', content: 'yes we do' }
  ];
  const reqWithoutSummary = buildReasoningRequest({ history, summary: '' });
  assert.strictEqual(reqWithoutSummary.messages.length, 5); // 5 turn window without summary

  const reqWithSummary = buildReasoningRequest({ history, summary: 'Customer asked about products' });
  assert.strictEqual(reqWithSummary.messages.length, 2); // 2 turn window with summary
  assert.ok(reqWithSummary.systemInstruction.includes('Customer asked about products'));
  console.log('✅ Test 6 passed!');

  console.log('\n🎉 ALL AGENT & TOOL EXECUTION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
