import { supabase } from './src/supabase';

async function main() {
  console.log("Fetching all lessons...");
  const { data: lessons, error } = await supabase.from('lessons').select('*');
  if (error) {
    console.error("Error fetching lessons", error);
    return;
  }

  console.log(`Found ${lessons.length} lessons. Checking for firebase links...`);
  
  let updatedCount = 0;
  for (const lesson of lessons) {
    let changed = false;
    let payload: any = {};

    if (lesson.slideUrl && lesson.slideUrl.includes('firebasestorage')) {
      payload.slideUrl = null;
      changed = true;
    }
    
    if (lesson.summaryUrl && lesson.summaryUrl.includes('firebasestorage')) {
      payload.summaryUrl = null;
      changed = true;
    }

    if (changed) {
      console.log(`Updating lesson ${lesson.id} - ${lesson.title}`);
      const { error: updateError } = await supabase.from('lessons').update(payload).eq('id', lesson.id);
      if (updateError) {
        console.error(`Error updating lesson ${lesson.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Done! Updated ${updatedCount} lessons.`);
}

main();
