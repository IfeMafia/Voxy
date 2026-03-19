import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from the root directory
import { pathToFileURL } from 'url';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log("🔑 Environment loaded. GROQ_API_KEY:", process.env.GROQ_API_KEY ? "EXISTS" : "MISSING");

// Dynamically import the test script
const testFile = process.argv[2] || './test-multilingual.js';
console.log(`🏃 Running test: ${testFile}`);

// Resolve relative to CWD or use absolute path
const absoluteTestPath = path.isAbsolute(testFile) ? testFile : path.resolve(process.cwd(), testFile);
const testUrl = pathToFileURL(absoluteTestPath).href;
import(testUrl).catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
