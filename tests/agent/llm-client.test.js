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
  console.log('🧪 Starting V2 Agent & Tool Execution Tests (S1 & S2)...\n');

  // Test 1: parseToolCall
  console.log('------------------------------------------------------------');
  console.log('Test 1: parseToolCall parsing model output JSON block');
  const jsonInput = '```json\n{ "tool": "product_lookup", "args": { "text": "shoes" } }\n```';
  console.log('  [Input Model Text]:\n   ', jsonInput.replace(/\n/g, '\n    '));
  const parsed = parseToolCall(jsonInput);
  console.log('  [Parsed Output]:', JSON.stringify(parsed, null, 2));
  assert.strictEqual(parsed?.name, 'product_lookup');
  assert.strictEqual(parsed?.args?.text, 'shoes');
  console.log('✅ Test 1 passed: Successfully parsed tool call\n');

  // Test 2: executeToolCall with payment_request tool execution
  console.log('------------------------------------------------------------');
  console.log('Test 2: executeToolCall with payment_request tool');
  const registry = createDefaultToolRegistry();
  const context = {
    businessId: 'biz_test',
    grantedPermissions: [ToolPermission.REQUEST_PAYMENT],
    confirmation: { confirmed: true }
  };
  const execResult = await executeToolCall(
    { name: 'payment_request', args: { orderId: 'ord_123', amount: 5000 } },
    registry,
    [ToolPermission.REQUEST_PAYMENT],
    context
  );
  console.log('  [Tool Invocation]: payment_request({ orderId: "ord_123", amount: 5000 })');
  console.log('  [Seam Result]:', JSON.stringify(execResult, null, 2));
  assert.strictEqual(execResult.ok, true);
  assert.strictEqual(execResult.toolName, 'payment_request');
  assert.ok(execResult.data?.authorizationUrl?.includes('paystack'));
  console.log('✅ Test 2 passed: Successfully initialized Paystack transaction link\n');

  // Test 3: executeToolCall with missing permission (PermissionDeniedError)
  console.log('------------------------------------------------------------');
  console.log('Test 3: executeToolCall blocking tool without granted permission');
  const deniedResult = await executeToolCall(
    { name: 'order_builder', args: { lines: [] } },
    registry,
    [ToolPermission.READ_CATALOGUE], // DRAFT_ORDER not granted
    context
  );
  console.log('  [Attempted Action]: order_builder with only READ_CATALOGUE permission');
  console.log('  [Permission Gate Result]:', JSON.stringify(deniedResult, null, 2));
  assert.strictEqual(deniedResult.ok, false);
  assert.ok(deniedResult.error.includes('PERMISSION_DENIED'));
  console.log('✅ Test 3 passed: Enforced strict tool permission boundaries\n');

  // Test 4: executeToolCall for payment without explicit confirmation (ConfirmationRequiredError)
  console.log('------------------------------------------------------------');
  console.log('Test 4: payment_request enforcing explicit confirmation gate (PRD §4.2)');
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
  console.log('  [Attempted Action]: payment_request with unconfirmed customer state');
  console.log('  [Confirmation Gate Result]:', JSON.stringify(unconfirmedPayment, null, 2));
  assert.strictEqual(unconfirmedPayment.ok, false);
  assert.ok(unconfirmedPayment.error.includes('CONFIRMATION_REQUIRED'));
  console.log('✅ Test 4 passed: Blocked financial action until explicit customer confirmation\n');

  // Test 5: buildSystemInstruction
  console.log('------------------------------------------------------------');
  console.log('Test 5: buildSystemInstruction persona, guardrails and grounding');
  const sysInst = buildSystemInstruction({
    businessName: 'Voxy Store',
    tone: 'friendly',
    language: 'English',
    businessSummary: 'We sell electronics in Ikeja. Working hours: Mon-Fri 9am-6pm.'
  });
  console.log('  [Generated System Instruction]:');
  console.log('  ' + sysInst.split('\n').slice(0, 15).join('\n  ') + '\n  [...truncated for display...]');
  assert.ok(sysInst.includes('You are Voxy'));
  assert.ok(sysInst.includes('Nigerian Naira'));
  assert.ok(sysInst.includes('We sell electronics'));
  console.log('✅ Test 5 passed: Persona and PRD guardrails properly structured\n');

  // Test 6: buildReasoningRequest windowing
  console.log('------------------------------------------------------------');
  console.log('Test 6: buildReasoningRequest history windowing and summary roll-up');
  const history = [
    { role: 'user', content: 'hi' },
    { role: 'model', content: 'hello' },
    { role: 'user', content: 'what is your price?' },
    { role: 'model', content: 'our prices are in Naira' },
    { role: 'user', content: 'do you have phones?' },
    { role: 'model', content: 'yes we do' }
  ];
  const reqWithoutSummary = buildReasoningRequest({ history, summary: '' });
  console.log('  [Window without summary]:', reqWithoutSummary.messages.length, 'turns preserved');
  assert.strictEqual(reqWithoutSummary.messages.length, 5); // 5 turn window without summary

  const reqWithSummary = buildReasoningRequest({ history, summary: 'Customer asked about products' });
  console.log('  [Window with summary]:', reqWithSummary.messages.length, 'turns + injected summary');
  console.log('  [System Instruction injected summary snippet]:', reqWithSummary.systemInstruction.match(/CONVERSATION SUMMARY:[\s\S]*?(?=\n\n|$)/)?.[0] || 'Injected');
  assert.strictEqual(reqWithSummary.messages.length, 2); // 2 turn window with summary
  assert.ok(reqWithSummary.systemInstruction.includes('Customer asked about products'));
  console.log('✅ Test 6 passed: Context window optimized with summary preservation\n');

  console.log('🎉 ALL S1 & S2 AGENT & TOOL TESTS PASSED!\n');
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
