#!/usr/bin/env node
/**
 * NCSSM Rotary Presentation — Audio Generation Script
 * Generates MP3 files for all narration scripts via ElevenLabs API
 *
 * Usage:
 *   node generate-audio.js              # Generate all audio
 *   node generate-audio.js --slide 5    # Regenerate just slide 5
 *
 * Environment Variables (required):
 *   ELEVENLABS_API_KEY - Your ElevenLabs API key
 *   ELEVENLABS_VOICE_ID - Voice ID (default: HlMBBeKyCO8iSONO6L5i "Andy G")
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0 && !key.trim().startsWith('#')) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// Configuration
const CONFIG = {
  apiKey: process.env.ELEVENLABS_API_KEY,
  voiceId: process.env.ELEVENLABS_VOICE_ID || 'HlMBBeKyCO8iSONO6L5i', // Andy G
  modelId: 'eleven_turbo_v2_5'
};

// Load scripts from scripts.js
function loadScripts() {
  const scriptsPath = path.join(__dirname, 'scripts.js');
  if (!fs.existsSync(scriptsPath)) {
    throw new Error(`Scripts file not found: ${scriptsPath}`);
  }

  const content = fs.readFileSync(scriptsPath, 'utf-8');

  // Execute in a sandbox to get the globals
  const sandbox = { window: {} };
  const script = new Function('window', content + '\nreturn { NARRATION_SCRIPTS: window.NARRATION_SCRIPTS };');
  return script(sandbox.window);
}

// Generate audio for a single script
async function generateAudio(text, outputPath) {
  console.log(`  Generating: ${path.basename(outputPath)}`);

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${CONFIG.voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': CONFIG.apiKey
    },
    body: JSON.stringify({
      text: text,
      model_id: CONFIG.modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${error}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  console.log(`  ✓ Saved: ${path.basename(outputPath)}`);
}

// Generate audio for slides
async function generateSlides(scripts, outputDir, specificSlide = null) {
  console.log('\nGenerating slide audio...\n');

  const slideNums = Object.keys(scripts).map(n => parseInt(n)).sort((a, b) => a - b);

  for (const slideNum of slideNums) {
    if (specificSlide !== null && slideNum !== specificSlide) continue;

    const script = scripts[slideNum];
    const outputPath = path.join(outputDir, `slide-${slideNum}.mp3`);

    try {
      await generateAudio(script, outputPath);
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ✗ Error on slide ${slideNum}: ${err.message}`);
    }
  }
}

// Print usage
function printUsage() {
  console.log(`
NCSSM Rotary Presentation — Audio Generation Script

Usage:
  node generate-audio.js [--slide <N>]

Options:
  --slide <N>   Only regenerate a specific slide number
  --help        Show this help message

Examples:
  node generate-audio.js              # Generate all slides
  node generate-audio.js --slide 5    # Regenerate only slide 5

Environment Variables:
  ELEVENLABS_API_KEY   Your ElevenLabs API key (required)
  ELEVENLABS_VOICE_ID  Voice ID (default: HlMBBeKyCO8iSONO6L5i "Andy G")
`);
}

// Main
async function main() {
  // Parse args
  const args = process.argv.slice(2);
  let specificSlide = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slide' && args[i+1]) {
      specificSlide = parseInt(args[i+1]);
    } else if (args[i] === '--help' || args[i] === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  // Check API key
  if (!CONFIG.apiKey) {
    console.error('Error: ELEVENLABS_API_KEY environment variable is required');
    console.error('Create a .env file with: ELEVENLABS_API_KEY=your_key');
    process.exit(1);
  }

  const outputDir = path.join(__dirname, 'audio');

  console.log(`\n🎙️  NCSSM Rotary Audio Generator`);
  console.log(`   Voice: ${CONFIG.voiceId} (Andy G)`);
  console.log(`   Output: ${outputDir}`);

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`   Created directory: ${outputDir}`);
  }

  // Load scripts
  console.log('\nLoading scripts...');
  const { NARRATION_SCRIPTS } = loadScripts();

  if (!NARRATION_SCRIPTS) {
    console.error('Error: Could not load NARRATION_SCRIPTS from scripts.js');
    process.exit(1);
  }

  const slideCount = Object.keys(NARRATION_SCRIPTS).length;
  console.log(`Found ${slideCount} slides`);

  // Generate audio
  if (specificSlide !== null) {
    if (!NARRATION_SCRIPTS[specificSlide]) {
      console.error(`Error: Slide ${specificSlide} not found in scripts.js`);
      process.exit(1);
    }
    console.log(`\nRegenerating slide ${specificSlide} only...`);
  }

  await generateSlides(NARRATION_SCRIPTS, outputDir, specificSlide);

  console.log('\n✅ Audio generation complete!\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
