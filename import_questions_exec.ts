import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as crypto from 'crypto';

const supabaseUrl = 'https://dqqjfjhwsrlgntgnojxj.supabase.co';
const supabaseAnonKey = 'sb_publishable_NHlxLpX4EtVNqN3spfpEBA_FONMLPFE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function getSubjectId(index: number): string {
  // Ciências Básicas (1-20)
  if (index >= 1 && index <= 20) {
    if ([4, 5, 6, 11, 12].includes(index)) return 'base-farma';
    if (index === 19) return 'anat-patol';
    return 'proc-patol';
  }
  // Clínica Médica (21-40)
  if (index >= 21 && index <= 40) {
    if ([21, 22, 23, 24, 36, 38, 39].includes(index)) return 'p6-cardiopulmonar';
    if ([25, 26, 33, 34, 35, 40].includes(index)) return 'p8-sistemicas-2';
    if (index === 27) return 'p6-pratica-adulto-1';
    if ([28, 31, 32, 37].includes(index)) return 'p7-sistemicas-1';
    if ([29, 30].includes(index)) return 'p6-neuroendo';
  }
  // Pediatria (41-60)
  if (index >= 41 && index <= 60) {
    if ([44, 45].includes(index)) return 'p7-materno';
    if ([52, 55, 60].includes(index)) return 'p8-pediatria-2';
    return 'p7-pediatria-1';
  }
  // Cirurgia Geral (61-80)
  if (index >= 61 && index <= 80) {
    if ([64, 65, 66, 74, 75, 79, 80].includes(index)) return 'p8-cirurgica-2';
    return 'p7-cirurgica-1';
  }
  // Ginecologia e Obstetrícia (81-100)
  if (index >= 81 && index <= 100) {
    if ([91, 92, 93, 95, 96, 98, 100].includes(index)) return 'p8-ginecologia-2';
    return 'p7-ginecologia-1';
  }
  // Medicina Preventiva (101-120)
  if (index >= 101 && index <= 120) {
    if (index === 101) return 'p8-paliativos';
    if (index === 108) return 'p1-evolucao';
    if (index === 109) return 'pna';
    if ([110, 111, 112, 113, 114, 119].includes(index)) return 'p3-vigilancia';
    return 'p2-aps';
  }
  return 'proc-patol'; // fallback
}

function getArea(index: number): string {
  if (index >= 1 && index <= 20) return 'Ciências Básicas';
  if (index >= 21 && index <= 40) return 'Clínica Médica';
  if (index >= 41 && index <= 60) return 'Pediatria';
  if (index >= 61 && index <= 80) return 'Cirurgia Geral';
  if (index >= 81 && index <= 100) return 'Ginecologia e Obstetrícia';
  return 'Medicina Preventiva';
}

async function run() {
  console.log('Loading question files...');
  const text = fs.readFileSync('new_questions_1.txt', 'utf8') + '\n' +
               fs.readFileSync('new_questions_2.txt', 'utf8') + '\n' +
               fs.readFileSync('new_questions_3.txt', 'utf8') + '\n' +
               fs.readFileSync('new_questions_4.txt', 'utf8');

  console.log('Splitting into blocks...');
  const fullText = '\n' + text;
  const blocks = fullText.split(/\n(?=\d+\.\s+)/).map(b => b.trim()).filter(b => b.length > 0);
  console.log(`Found ${blocks.length} raw question blocks.`);

  const questionsToInsert: any[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 3) continue;

    // Match index
    const matchHeader = lines[0].match(/^(\d+)\.\s*(.*)/);
    if (!matchHeader) {
      console.warn('Block does not start with index:', lines[0]);
      continue;
    }
    const qIndex = parseInt(matchHeader[1], 10);
    let questionBody = matchHeader[2];

    // Read lines until options
    let lineIdx = 1;
    while (lineIdx < lines.length && !lines[lineIdx].match(/^[A-E]\s*[)\.]/i)) {
      questionBody += '\n' + lines[lineIdx];
      lineIdx++;
    }

    // Read options
    const options: string[] = [];
    while (lineIdx < lines.length && lines[lineIdx].match(/^[A-E]\s*[)\.]/i)) {
      const optLine = lines[lineIdx];
      const optMatch = optLine.match(/^[A-E]\s*[)\.]\s*(.*)/i);
      if (optMatch) {
        options.push(optMatch[1]);
      } else {
        options.push(optLine);
      }
      lineIdx++;
    }

    // Read rest metadata and explanation
    let gabaritoLetter = '';
    let explanationText = '';
    
    for (; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      if (line.match(/^Gabarito:\s*(.*)/i)) {
        gabaritoLetter = line.replace(/^Gabarito:\s*/i, '').trim();
      } else if (line.match(/^Explicação:\s*(.*)/i)) {
        explanationText = line.replace(/^Explicação:\s*/i, '').trim();
        // Append all remaining lines to explanation
        for (let j = lineIdx + 1; j < lines.length; j++) {
          explanationText += '\n' + lines[j];
        }
        break;
      }
    }

    // Determine correctOptionIndex
    let correctOptionIndex = 0;
    if (gabaritoLetter.toUpperCase() === 'ANULADA') {
      correctOptionIndex = -1; // -1 represents annulled questions
    } else {
      const charCode = gabaritoLetter.toUpperCase().charCodeAt(0);
      correctOptionIndex = charCode - 65; // A=0, B=1, etc.
      if (correctOptionIndex < 0 || correctOptionIndex > 4) {
        correctOptionIndex = 0; // fallback
      }
    }

    const area = getArea(qIndex);
    const subjectId = getSubjectId(qIndex);

    // Format explanation column as JSON string with tags
    const explanationJSON = JSON.stringify({
      tags: {
        difficulty: 'Médio',
        area: area,
        banca: 'Teste de Progresso',
        ano: '2026'
      },
      explanation: explanationText
    });

    questionsToInsert.push({
      id: crypto.randomUUID(),
      subjectId: subjectId,
      lessonId: '',
      question: questionBody,
      options: options,
      correctOptionIndex: correctOptionIndex,
      explanation: explanationJSON
    });
  }

  console.log(`Successfully parsed ${questionsToInsert.length} questions.`);

  if (questionsToInsert.length === 0) {
    console.error('No questions parsed. Check file formats.');
    process.exit(1);
  }

  // Batch insert in chunks of 20
  const chunkSize = 20;
  for (let i = 0; i < questionsToInsert.length; i += chunkSize) {
    const chunk = questionsToInsert.slice(i, i + chunkSize);
    console.log(`Inserting chunk ${i / chunkSize + 1}/${Math.ceil(questionsToInsert.length / chunkSize)}...`);
    const { error } = await supabase.from('questions').insert(chunk);
    if (error) {
      console.error(`Error inserting chunk starting at index ${i}:`, error);
      process.exit(1);
    }
  }

  console.log('All 120 questions imported successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error('Unhandled execution error:', err);
  process.exit(1);
});
