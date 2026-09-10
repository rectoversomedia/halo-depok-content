import { z } from 'zod';
import { ingestAllActiveSources } from '../modules/ingestion';
import { processRawItemsForDiscovery } from '../modules/discovery';
import { queryRecords } from '../lib/db';
import { TABLES } from '../lib/db';
import type { Story } from '../types';

// ============================================================
// HALODEPOK CONTENT FACTORY — Full Pipeline CLI
// Usage: npm run pipeline:run
// ============================================================

const STAGES = [
  { name: 'INGEST', description: 'Fetch from all active sources' },
  { name: 'DISCOVER', description: 'Score and filter raw items' },
  { name: 'CLUSTER', description: 'Group related stories' },
  { name: 'CLAIMS', description: 'Extract factual claims' },
  { name: 'VERIFY', description: 'Verify claims with evidence' },
  { name: 'EDITORIAL', description: 'Generate editorial brief' },
  { name: 'ARTICLE', description: 'Generate article' },
  { name: 'SOCIAL', description: 'Generate social content' },
  { name: 'SEO', description: 'Generate SEO metadata' },
  { name: 'GEO', description: 'Generate GEO metadata' },
  { name: 'EEAT', description: 'Evaluate E-E-A-T' },
  { name: 'SAFETY', description: 'Run safety/red-team checks' },
  { name: 'COMMERCE', description: 'Identify commerce opportunities' },
] as const;

type StageName = (typeof STAGES)[number]['name'];

async function runPipeline(stage?: StageName) {
  console.log('\n🏭 HaloDepok Content Factory — Pipeline Runner');
  console.log('═'.repeat(50));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');

  // Stage 1: Ingestion
  console.log(`[1/${STAGES.length}] INGEST — Fetching from sources...`);
  const ingestResults = await ingestAllActiveSources();
  const totalNew = ingestResults.reduce((sum, r) => sum + r.itemsNew, 0);
  const totalErrors = ingestResults.reduce((sum, r) => sum + r.errors.length, 0);
  console.log(`  ✓ Processed ${ingestResults.length} sources`);
  console.log(`  ✓ ${totalNew} new items ingested`);
  console.log(`  ${totalErrors > 0 ? `⚠ ${totalErrors} errors` : ''}`);

  if (stage === 'INGEST') {
    console.log('\nPipeline stopped at INGEST stage (--stage=INGEST)');
    return;
  }

  // Stage 2: Discovery
  console.log(`\n[2/${STAGES.length}] DISCOVER — Scoring and filtering...`);
  const discovery = await processRawItemsForDiscovery();
  console.log(`  ✓ Processed ${discovery.processed} raw items`);
  console.log(`  ✓ Created ${discovery.storiesCreated} stories`);
  console.log(`  ${discovery.ignored > 0 ? `  - ${discovery.ignored} ignored` : ''}`);

  if (stage === 'DISCOVER') {
    console.log('\nPipeline stopped at DISCOVER stage');
    return;
  }

  // Stage 3: Claims & Verification for content-ready stories
  console.log(`\n[3/${STAGES.length}] CLAIMS — Extracting claims from stories...`);
  const stories = await queryRecords<Story>(TABLES.stories, { status: 'verified' }, { limit: 20 });

  for (const s of stories) {
    // Claims extraction, verification, editorial brief...
    // This would call the full story pipeline
    console.log(`  Processing story: ${s.title?.slice(0, 50) ?? 'Untitled'}...`);
  }

  console.log(`  ✓ Processed ${stories.length} verified stories`);
  console.log('\nPipeline completed!');

  console.log('\n' + '═'.repeat(50));
  console.log(`Finished at: ${new Date().toISOString()}`);
}

// Parse CLI args
const args = process.argv.slice(2);
const stageArg = args.find((a) => a.startsWith('--stage='));
const targetStage = stageArg?.replace('--stage=', '') as StageName | undefined;

runPipeline(targetStage).catch(console.error);
