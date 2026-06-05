import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://dqqjfjhwsrlgntgnojxj.supabase.co';
// Needs service role key to bypass RLS, or anon key if RLS allows all.
const supabaseAnonKey = 'sb_publishable_NHlxLpX4EtVNqN3spfpEBA_FONMLPFE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrate() {
  console.log('Reading database_backup.json...');
  const backupData = JSON.parse(fs.readFileSync('database_backup.json', 'utf8'));

  for (const collectionName of Object.keys(backupData)) {
    console.log(`Migrating ${collectionName}...`);
    const items = backupData[collectionName];
    
    if (!items || items.length === 0) {
       console.log(`  Skipping empty collection: ${collectionName}`);
       continue;
    }

    // Map boolean values if needed, but supabase js handles it well.
    // Chunk items into pieces of 50
    const chunkSize = 50;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      
      const { data, error } = await supabase
        .from(collectionName)
        .upsert(chunk);
        
      if (error) {
         console.error(`Error migrating chunk in ${collectionName}:`, error);
      } else {
         console.log(`  Migrated chunk ${i + chunk.length}/${items.length} records in ${collectionName}`);
      }
    }
    console.log(`  Finished migrating ${items.length} records in ${collectionName}.`);
  }

  console.log(`Database migration completed!`);
  process.exit(0);
}

migrate().catch(console.error);
