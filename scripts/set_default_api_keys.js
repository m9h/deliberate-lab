#!/usr/bin/env node

/**
 * Set default API keys for all experimenters.
 *
 * These keys are used as a fallback when an experimenter hasn't configured
 * their own keys. Stored in Firestore at settings/defaultApiKeys.
 *
 * Usage:
 *   # Set Groq as the default (via OpenAI-compatible endpoint):
 *   node scripts/set_default_api_keys.js --provider groq --api-key gsk_YOUR_KEY
 *
 *   # Set OpenAI directly:
 *   node scripts/set_default_api_keys.js --provider openai --api-key sk-YOUR_KEY
 *
 *   # Set a custom OpenAI-compatible endpoint:
 *   node scripts/set_default_api_keys.js --provider openai --api-key YOUR_KEY --base-url https://api.example.com/v1
 *
 *   # Clear default keys:
 *   node scripts/set_default_api_keys.js --clear
 *
 *   # Show current default keys (redacted):
 *   node scripts/set_default_api_keys.js --show
 *
 * Environment:
 *   Uses the Firebase project configured in .firebaserc.
 *   For the emulator, set FIRESTORE_EMULATOR_HOST=localhost:8080
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
const DOC_PATH = 'settings/defaultApiKeys';

// Known OpenAI-compatible providers with pre-configured base URLs
const PROVIDERS = {
  groq: {baseUrl: 'https://api.groq.com/openai/v1'},
  openrouter: {baseUrl: 'https://openrouter.ai/api/v1'},
  together: {baseUrl: 'https://api.together.xyz/v1'},
  huggingface: {baseUrl: 'https://router.huggingface.co/v1'},
  openai: {baseUrl: ''},
};

function redactKey(key) {
  if (!key || key.length < 8) return key ? '***' : '(not set)';
  return key.slice(0, 4) + '...' + key.slice(-4);
}

async function showKeys() {
  const doc = await db.doc(DOC_PATH).get();
  if (!doc.exists) {
    console.log('No default API keys configured.');
    return;
  }
  const data = doc.data();
  console.log('Current default API keys:');
  console.log(`  Gemini:    ${redactKey(data.geminiApiKey)}`);
  console.log(
    `  OpenAI:    ${redactKey(data.openAIApiKey?.apiKey)} @ ${data.openAIApiKey?.baseUrl || '(default OpenAI)'}`,
  );
  console.log(
    `  Claude:    ${redactKey(data.claudeApiKey?.apiKey)} @ ${data.claudeApiKey?.baseUrl || '(default Anthropic)'}`,
  );
  console.log(
    `  Ollama:    ${data.ollamaApiKey?.url || '(not set)'}`,
  );
  if (data.vertexAIConfig) {
    console.log(
      `  Vertex AI: ${redactKey(data.vertexAIConfig.apiKey)} project=${data.vertexAIConfig.project || '(not set)'}`,
    );
  }
}

async function clearKeys() {
  await db.doc(DOC_PATH).delete();
  console.log('Default API keys cleared.');
}

async function setKeys(provider, apiKey, baseUrl) {
  // Start with empty config
  const config = {
    geminiApiKey: '',
    openAIApiKey: {apiKey: '', baseUrl: ''},
    claudeApiKey: {apiKey: '', baseUrl: ''},
    ollamaApiKey: {url: ''},
  };

  // Try to preserve existing config
  const existing = await db.doc(DOC_PATH).get();
  if (existing.exists) {
    Object.assign(config, existing.data());
  }

  // Map provider to the correct config field
  if (provider === 'gemini') {
    config.geminiApiKey = apiKey;
  } else if (
    provider === 'openai' ||
    provider === 'groq' ||
    provider === 'openrouter' ||
    provider === 'together' ||
    provider === 'huggingface'
  ) {
    const providerBaseUrl = baseUrl || PROVIDERS[provider]?.baseUrl || '';
    config.openAIApiKey = {apiKey, baseUrl: providerBaseUrl};
  } else if (provider === 'claude') {
    config.claudeApiKey = {apiKey, baseUrl: baseUrl || ''};
  } else if (provider === 'ollama') {
    config.ollamaApiKey = {url: apiKey}; // For Ollama, "key" is the URL
  } else {
    console.error(`Unknown provider: ${provider}`);
    console.error(`Valid providers: ${Object.keys(PROVIDERS).join(', ')}, gemini, claude, ollama`);
    process.exit(1);
  }

  await db.doc(DOC_PATH).set(config);
  console.log(`Default API keys updated for provider: ${provider}`);
  if (PROVIDERS[provider]?.baseUrl) {
    console.log(`  Base URL: ${PROVIDERS[provider].baseUrl}`);
  }
  console.log(`  API Key: ${redactKey(apiKey)}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--show')) {
    await showKeys();
  } else if (args.includes('--clear')) {
    await clearKeys();
  } else if (args.includes('--provider')) {
    const providerIdx = args.indexOf('--provider');
    const keyIdx = args.indexOf('--api-key');
    const urlIdx = args.indexOf('--base-url');

    const provider = args[providerIdx + 1];
    const apiKey = keyIdx >= 0 ? args[keyIdx + 1] : undefined;
    const baseUrl = urlIdx >= 0 ? args[urlIdx + 1] : undefined;

    if (!provider || !apiKey) {
      console.error('Usage: --provider <name> --api-key <key> [--base-url <url>]');
      process.exit(1);
    }

    await setKeys(provider, apiKey, baseUrl);
  } else {
    console.log('Usage:');
    console.log('  --show                              Show current default keys');
    console.log('  --clear                             Remove default keys');
    console.log('  --provider <name> --api-key <key>   Set default keys');
    console.log('');
    console.log('Providers: groq, openrouter, together, huggingface, openai, gemini, claude, ollama');
    console.log('');
    console.log('Example (Groq):');
    console.log('  node scripts/set_default_api_keys.js --provider groq --api-key gsk_YOUR_KEY');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
