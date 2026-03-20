import React, { useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { GoogleGenAI, Type } from '@google/genai';
import { SUBJECTS } from '../constants';

export const AdminQuestions: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [period, setPeriod] = useState<number>(5);
  const [processingStatus, setProcessingStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const processPDF = async () => {
    if (!pdfFile) {
      alert('Por favor, selecione um arquivo PDF primeiro.');
      return;
    }
    if (!subjectId) {
      alert('Por favor, selecione uma disciplina.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus('Lendo arquivo PDF...');

    try {
      const base64Data = await fileToBase64(pdfFile);
      
      setProcessingStatus('Enviando para a IA para extração de questões...');
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Você é um assistente especializado em extrair questões de múltipla escolha de provas e materiais de estudo de medicina.
      Analise o documento PDF fornecido e extraia TODAS as questões de múltipla escolha que encontrar.
      
      Para cada questão, você deve extrair:
      1. O enunciado completo da questão (question)
      2. As opções de resposta (options) - certifique-se de que sejam exatamente 4 ou 5 opções. Se houver mais ou menos, adapte para o padrão de múltipla escolha.
      3. O índice da opção correta (correctOptionIndex) - um número inteiro começando de 0. Se não houver gabarito no documento, infira a resposta correta com base no seu conhecimento médico.
      4. Uma explicação detalhada (explanation) - explique por que a alternativa correta está certa e por que as outras estão erradas. Se o documento não fornecer explicação, gere uma explicação médica precisa.
      
      Retorne os dados ESTRITAMENTE como um array JSON de objetos.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: 'application/pdf',
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctOptionIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctOptionIndex", "explanation"]
            }
          }
        }
      });

      setProcessingStatus('Processando resposta da IA...');
      
      const text = response.text;
      if (!text) {
        throw new Error('A IA não retornou nenhum texto.');
      }

      const extractedQuestions = JSON.parse(text);
      
      if (!Array.isArray(extractedQuestions) || extractedQuestions.length === 0) {
        throw new Error('Nenhuma questão foi extraída ou o formato é inválido.');
      }

      setProcessingStatus(`Salvando ${extractedQuestions.length} questões no banco de dados...`);
      
      const subject = SUBJECTS.find(s => s.id === subjectId);
      const subjectTitle = subject ? subject.title : 'Desconhecida';

      let savedCount = 0;
      for (const q of extractedQuestions) {
        await addDoc(collection(db, 'questions'), {
          ...q,
          subjectId,
          subjectTitle,
          period,
          source: pdfFile.name,
          createdAt: new Date().toISOString()
        });
        savedCount++;
      }

      alert(`${savedCount} questões extraídas e salvas com sucesso!`);
      setPdfFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      alert(`Erro ao processar PDF: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  return (
    <main className="p-8 max-w-[1000px] mx-auto w-full">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 border-b pb-4">Importar Questões via IA</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-600 uppercase">Período</label>
            <select 
              value={period} 
              onChange={e => setPeriod(Number(e.target.value))} 
              className="p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(p => <option key={p} value={p}>{p}º Período</option>)}
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-600 uppercase">Disciplina</label>
            <select 
              value={subjectId} 
              onChange={e => setSubjectId(e.target.value)} 
              className="p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 ring-blue-500"
            >
              <option value="">Selecione a Disciplina</option>
              {SUBJECTS.filter(s => s.period === period).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-6">
          <label className="text-sm font-bold text-gray-600 uppercase">Arquivo PDF com Questões</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors">
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden" 
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center justify-center">
              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-blue-600 font-semibold hover:underline">
                {pdfFile ? pdfFile.name : 'Clique para selecionar um arquivo PDF'}
              </span>
              <span className="text-sm text-gray-500 mt-2">
                A IA irá ler o PDF, extrair as questões, identificar as respostas corretas e gerar explicações.
              </span>
            </label>
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={processPDF}
            disabled={isProcessing || !pdfFile || !subjectId}
            className={`w-full py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              isProcessing || !pdfFile || !subjectId 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
            }`}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {processingStatus}
              </>
            ) : (
              'Extrair e Salvar Questões'
            )}
          </button>
        </div>
      </div>
    </main>
  );
};
