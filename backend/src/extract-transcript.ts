#!/usr/bin/env tsx

import { TranscriptService } from './services/transcript.js';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npm run extract-transcript <video-url>');
    console.log('Example: npm run extract-transcript "https://www.youtube.com/watch?v=dQw4w9WgXcQ"');
    process.exit(1);
  }

  const videoUrl = args[0];
  console.log(`Extracting transcript from: ${videoUrl}`);
  console.log('---');

  try {
    const result = await TranscriptService.extractTranscript(videoUrl);
    
    if (result.success) {
      console.log(`✓ SUCCESS - Method: ${result.method}`);
      console.log(`✓ Video Title: ${result.title || 'No title found'}`);
      console.log(`✓ Transcript length: ${result.transcript.length} characters`);
      console.log(`✓ Captions count: ${result.captions?.length || 0}`);
      console.log('---');
      console.log('TRANSCRIPT:');
      console.log(result.transcript);
      console.log('---');
      console.log('SUMMARY:');
      console.log(TranscriptService.generateSummary(result.transcript));
    } else {
      console.log(`✗ FAILED - ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main().catch(console.error);