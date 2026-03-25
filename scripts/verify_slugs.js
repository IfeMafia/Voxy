// Verify Slug Generation Logic
import { generateSlug } from '../src/lib/utils.js';

function test(name, expected) {
  const result = generateSlug(name);
  if (result === expected) {
    console.log(`✅ PASS: "${name}" -> "${result}"`);
  } else {
    console.log(`❌ FAIL: "${name}" -> "${result}" (Expected: "${expected}")`);
  }
}

console.log("Testing Slug Generation...");
test("Mama Put Kitchen", "mama-put-kitchen");
test("  Hello World  ", "hello-world");
test("Special & Characters!", "special--characters"); 
test("Already-Hyphenated", "already-hyphenated");
test("Multiple   Spaces", "multiple-spaces");
