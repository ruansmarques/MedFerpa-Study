
import { User, Subject, Lesson, Exercise, Book } from './types';

// Mock Users
export const MOCK_USERS: User[] = [
  {
    ra: '24151433-0',
    name: 'Editar nome',
    completedLessons: ['subj-1', 'imuno-1', 'semio-1'],
    avatarColor: 'bg-emerald-500',
    totalXP: 1250 // Nível 13
  },
  {
    ra: '11223344-5',
    name: 'Carlos Souza',
    completedLessons: ['subj-1'],
    avatarColor: 'bg-blue-500',
    totalXP: 450 // Nível 5
  },
  {
    ra: '99887766-1',
    name: 'Beatriz Lima',
    completedLessons: ['subj-1', 'subj-2', 'imuno-1', 'anat-p-1', 'anat-p-2'],
    avatarColor: 'bg-purple-500',
    totalXP: 890 // Nível 9
  }
];

// Mapeamento padrão de horários para o 5º Período (Automação Admin)
export const DEFAULT_SUBJECT_SLOTS: Record<string, string[]> = {
  'pna': ['1'],
  'semio-sist': ['2', '3'],
  'anat-patol': ['1', '2'],
  'farma-med': ['3'],
  'mbe': ['1']
};

// Mock Books
export const LIBRARY_BOOKS: Book[] = [
  {
    id: 'book-alberts',
    title: 'Biologia Molecular da Célula',
    author: 'ALBERTS',
    edition: '6ª Ed.',
    category: 'Biologia Celular',
    fileName: 'ALBERTS - Biologia Molecular da Célula, 6ª Ed..pdf',
    color: 'bg-emerald-600'
  },
  {
    id: 'book-bear',
    title: 'Neurociências: Desvendando o Sistema Nervoso',
    author: 'BEAR',
    edition: '4ª Ed.',
    category: 'Neurociências',
    fileName: 'BEAR - Neurociências, desvendando o Sistema Nervoso, 4ª Ed..pdf',
    color: 'bg-purple-600'
  },
  {
    id: 'book-borges',
    title: 'Genética Humana',
    author: 'BORGES OSÓRIO',
    edition: '3ª Ed.',
    category: 'Genética',
    fileName: 'BORGES OSÓRIO - Genética Humana, 3ª Ed..pdf',
    color: 'bg-indigo-600'
  },
  {
    id: 'book-brasil',
    title: 'Caderno de Atenção Básica N°36',
    author: 'BRASIL',
    edition: 'N°36',
    category: 'Saúde Pública',
    fileName: 'BRASIL - Caderno de Atenção Básica, N°36.pdf',
    color: 'bg-yellow-600'
  },
  {
    id: 'book-gilman',
    title: 'As Bases Farmacológicas da Terapêutica',
    author: 'GILMAN',
    edition: '12ª Ed.',
    category: 'Farmacologia',
    fileName: 'GILMAN - As Bases Farmacológicas da Terapêutica, 12ª Ed..pdf',
    color: 'bg-red-600'
  },
  {
    id: 'book-guyton',
    title: 'Tratado de Fisiologia Médica',
    author: 'GUYTON',
    edition: '13ª Ed. (V.ampliada)',
    category: 'Fisiologia',
    fileName: 'GUYTON - Tratado de Fisiologia médica. 13ª Ed. (V.ampliada).pdf',
    color: 'bg-blue-600'
  },
  {
    id: 'book-hansen',
    title: 'Netter Anatomia para Colorir',
    author: 'HANSEN',
    edition: '4ª Ed.',
    category: 'Anatomia',
    fileName: 'HANSEN - Netter Anatomia para Colorir, 4ª Ed..pdf',
    color: 'bg-slate-600'
  },
  {
    id: 'book-larsen',
    title: 'Embriologia Humana',
    author: 'LARSEN',
    edition: '5ª Ed. (V.ampliada)',
    category: 'Embriologia',
    fileName: 'LARSEN - Embriologia Humana. 5ª Ed. (V.ampliada).pdf',
    color: 'bg-pink-600'
  },
  {
    id: 'book-lehninger',
    title: 'Princípios de Bioquímica',
    author: 'LEHNINGER',
    edition: '6ª Ed.',
    category: 'Bioquímica',
    fileName: 'LEHNINGER - Princípios de Bioquímica, 6ª Ed..pdf',
    color: 'bg-lime-600'
  },
  {
    id: 'book-machado-3',
    title: 'Neuroanatomia Funcional',
    author: 'MACHADO',
    edition: '3ª Ed. (V.scanner)',
    category: 'Neuroanatomia',
    fileName: 'MACHADO - Neuroanatomia funcional. 3ª Ed. (V.scanner).pdf',
    color: 'bg-zinc-600'
  },
  {
    id: 'book-machado-4',
    title: 'Neuroanatomia Funcional',
    author: 'MACHADO',
    edition: '4ª Ed. (V.scanner)',
    category: 'Neuroanatomia',
    fileName: 'MACHADO - Neuroanatomia funcional. 4ª Ed. (V.scanner).pdf',
    color: 'bg-zinc-700'
  },
  {
    id: 'book-moore-anat',
    title: 'Anatomia Orientada para Clínica',
    author: 'MOORE',
    edition: '8ª Ed. (V.ampliada)',
    category: 'Anatomia',
    fileName: 'MOORE - Anatomia orientada para Clínica. 8ªEd. (V.ampliada).pdf',
    color: 'bg-slate-700'
  },
  {
    id: 'book-moore-embrio-basica',
    title: 'Embriologia Básica',
    author: 'MOORE',
    edition: '9ª Ed. (V.ampliada)',
    category: 'Embriologia',
    fileName: 'MOORE - Embriologia Básica, 9ª Ed. (V.ampliada).pdf',
    color: 'bg-rose-500'
  },
  {
    id: 'book-moore-embrio-clinica-8',
    title: 'Embriologia Clínica',
    author: 'MOORE',
    edition: '8ª Ed.',
    category: 'Embriologia',
    fileName: 'MOORE - Embriologia Clinica 8ª Ed..pdf',
    color: 'bg-rose-600'
  },
  {
    id: 'book-moore-embrio-clinica-10',
    title: 'Embriologia Clínica',
    author: 'MOORE',
    edition: '10ª Ed. (V.ampliada)',
    category: 'Embriologia',
    fileName: 'MOORE - Embriologia Clínica, 10ª Ed. (V.ampliada).pdf',
    color: 'bg-rose-700'
  },
  {
    id: 'book-porto-exame',
    title: 'Exame Clínico',
    author: 'PORTO',
    edition: '8ª Ed.',
    category: 'Semiologia',
    fileName: 'PORTO - Exame Clínico, 8ª Ed..pdf',
    color: 'bg-cyan-600'
  },
  {
    id: 'book-porto-semio',
    title: 'Semiologia Médica',
    author: 'PORTO',
    edition: '8ª Ed.',
    category: 'Semiologia',
    fileName: 'PORTO - Semiologia Médica, 8ª Ed..pdf',
    color: 'bg-cyan-700'
  },
  {
    id: 'book-robbins',
    title: 'Patologia e Bases Patológicas das Doenças',
    author: 'ROBBINS',
    edition: '8ª Ed. (V.ampliada)',
    category: 'Patologia',
    fileName: 'ROBBINS - Patologia e Bases patológicas das doenças 8ª ed. (V.ampliada).pdf',
    color: 'bg-red-700'
  },
  {
    id: 'book-lent',
    title: 'Conceitos Fundamentais de Neurociências',
    author: 'ROBERTO LENT',
    edition: '2ª Ed. (V.scanner)',
    category: 'Neurociências',
    fileName: 'ROBERTO LENT - Conceitos fundamentais de neurociências, 2ª Ed. (V.scanner).pdf',
    color: 'bg-violet-600'
  },
  {
    id: 'book-silverthorn',
    title: 'Fisiologia Humana',
    author: 'SILVERTHORN',
    edition: '7ª Ed.',
    category: 'Fisiologia',
    fileName: 'SILVERTHORN - Fisiologia Humana, 7ª Ed..pdf',
    color: 'bg-sky-500'
  },
  {
    id: 'book-thompson',
    title: 'Atlas de Anatomia Ortopédica',
    author: 'THOMPSON',
    edition: '2ª Ed. (V.ampliada)',
    category: 'Anatomia',
    fileName: 'THOMPSON - Atlas de Anatomia Ortopedica, 2ª Ed. (V.ampliada).pdf',
    color: 'bg-gray-600'
  },
  {
    id: 'book-tortora',
    title: 'Princípios da Anatomia e Fisiologia',
    author: 'TORTORA',
    edition: '14ª Ed. (V.ampliada)',
    category: 'Fisiologia',
    fileName: 'TORTORA - Princípios da Anatomia e Fisiologia, 14ª Ed. (V.ampliada).pdf',
    color: 'bg-teal-600'
  }
];

// Mock Subjects
export const SUBJECTS: Subject[] = [
  // --- 1º PERÍODO ---
  { id: 'p1-evolucao', period: 1, title: 'Evolução da Medicina e Introdução ao Sistema Único de Saúde', icon: '🏛️', description: 'História da medicina e princípios do SUS.', folderName: 'evolucao-medicina' },
  { id: 'p1-morfo-celular', period: 1, title: 'Morfofisiologia: Celular', icon: '🧬', description: 'Estrutura e função celular.', folderName: 'morfofisiologia-celular' },
  { id: 'p1-morfo-locomotor', period: 1, title: 'Morfofisiologia: Sistema Locomotor e Tegumentar', icon: '🦴', description: 'Anatomia e fisiologia do movimento e pele.', folderName: 'locomotor' },
  { id: 'p1-morfo-tecidual', period: 1, title: 'Morfofisiologia: Tecidual e do Desenvolvimento', icon: '🔬', description: 'Histologia e embriologia básica.', folderName: 'tecidual' },
  { id: 'p1-praticas-int', period: 1, title: 'Práticas Integradas em Saúde: Inclusão e Comunidade', icon: '🤝', description: 'Inserção na comunidade e atenção básica.', folderName: 'praticas-integradas' },
  { id: 'p1-psico', period: 1, title: 'Psicologia Médica', icon: '🧠', description: 'Aspectos psicológicos na prática médica.', folderName: 'psicologia' },

  // --- 2º PERÍODO ---
  { id: 'p2-aps', period: 2, title: 'Atenção Primária à Saúde', icon: '🏥', description: 'Fundamentos da APS e medicina de família.', folderName: 'aps' },
  { id: 'p2-genetica', period: 2, title: 'Genética e Metabolismo', icon: '🧬', description: 'Genética médica e erros inatos do metabolismo.', folderName: 'genetica' },
  { id: 'p2-morfo-neuro', period: 2, title: 'Morfofisiologia: Neuroendócrino e Reprodutor', icon: '🧠', description: 'Sistemas nervoso, endócrino e reprodutor.', folderName: 'neuroendocrino' },
  { id: 'p2-praticas-basicas', period: 2, title: 'Práticas Médicas: Procedimentos Básicos', icon: '🩺', description: 'Primeiros procedimentos clínicos.', folderName: 'procedimentos-basicos' },
  { id: 'p2-promocao', period: 2, title: 'Promoção da Saúde, Bem Estar e Profissionalismo Médico', icon: '🍎', description: 'Ética e promoção de saúde.', folderName: 'promocao-saude' },

  // --- 3º PERÍODO ---
  { id: 'p3-ingles', period: 3, title: 'Inglês Instrumental', icon: '🇬🇧', description: 'Leitura de artigos científicos em inglês.', folderName: 'ingles' },
  { id: 'p3-metodologia', period: 3, title: 'Metodologia da Pesquisa', icon: '📝', description: 'Métodos científicos e produção acadêmica.', folderName: 'metodologia' },
  { id: 'p3-abdomen', period: 3, title: 'Morfofisiologia: Abdômen', icon: '🤢', description: 'Anatomia e fisiologia abdominal.', folderName: 'abdomen' },
  { id: 'p3-torax', period: 3, title: 'Morfofisiologia: Tórax', icon: '🫁', description: 'Anatomia e fisiologia torácica.', folderName: 'torax' },
  { id: 'p3-praticas-clinicas', period: 3, title: 'Práticas Médicas: Procedimentos Clínicos', icon: '👩‍⚕️', description: 'Habilidades clínicas intermediárias.', folderName: 'procedimentos-clinicos' },
  { id: 'p3-vigilancia', period: 3, title: 'Vigilância em Saúde', icon: '🛡️', description: 'Epidemiologia e vigilância sanitária.', folderName: 'vigilancia' },

  // --- 4º PERÍODO ---
  { id: 'aph', period: 4, title: 'Atendimento Pré-Hospitalar', icon: '🚑', description: 'Protocolos de urgência e emergência.', folderName: 'aph' },
  { id: 'base-farma', period: 4, title: 'Bases da Farmacologia', icon: '💊', description: 'Princípios da farmacocinética e dinânica.', folderName: 'farmacologia' },
  { id: 'subj-saude', period: 4, title: 'Práticas Integrativas e Subjetividade em Saúde', icon: '🧠', description: 'Aspectos humanos e psicológicos do cuidado.', folderName: 'subjetividade' },
  { id: 'semio-basica', period: 4, title: 'Práticas Médicas: Semiologia Básica', icon: '🩺', description: 'Introdução à anamnese e exame físico.', folderName: 'semiologia' },
  { id: 'proc-patol', period: 4, title: 'Processos Patológicos', icon: '🦠', description: 'Mecanismos gerais de agressão e defesa.', folderName: 'processos-patologicos' },

  // --- 5º PERÍODO ---
  { id: 'anat-patol', period: 5, title: 'Anatomia Patológica', icon: '🔬', description: 'Diagnóstico macro e microscópico das doenças.', folderName: 'anatomia-patologica' },
  { id: 'farma-med', period: 5, title: 'Farmacologia Médica', icon: '💊', description: 'Terapêutica clínica aplicada aos sistemas.', folderName: 'farmacologia-medica' },
  { id: 'mbe', period: 5, title: 'Medicina Baseada em Evidências e Práticas Exitosas', icon: '📚', description: 'Análise crítica de artigos científicos.', folderName: 'mbe' },
  { id: 'pna', period: 5, title: 'Políticas Nacionais de Atenção Integral à Saúde', icon: '🏥', description: 'Políticas de saúde pública e atenção primária.', folderName: 'pna' },
  { id: 'semio-sist', period: 5, title: 'Práticas Médicas: Semiologia dos Sistemas', icon: '🩻', description: 'Exame físico avançado por sistemas.', folderName: 'semiologia-sistemas' },

  // --- 6º PERÍODO ---
  { id: 'p6-bioetica', period: 6, title: 'Bioética e Medicina legal', icon: '⚖️', description: 'Ética médica e legislação.', folderName: 'bioetica' },
  { id: 'p6-cardiopulmonar', period: 6, title: 'Clínica Cardiopulmonar', icon: '🫀', description: 'Cardiologia e Pneumologia clínica.', folderName: 'cardiopulmonar' },
  { id: 'p6-neuroendo', period: 6, title: 'Clínica Neuroendócrina e Imagem', icon: '🧠', description: 'Neuro, Endócrino e Imagem.', folderName: 'neuro-endo' },
  { id: 'p6-linhas-cuidado', period: 6, title: 'Linhas de Cuidado do SUS', icon: '🏥', description: 'Fluxos de atendimento no SUS.', folderName: 'linhas-cuidado' },
  { id: 'p6-pratica-adulto-1', period: 6, title: 'Clínica do Adulto I', icon: '👨', description: 'Atendimento clínico ao adulto.', folderName: 'saude-adulto-1' },
  { id: 'p6-psiquiatria-1', period: 6, title: 'Psiquiatria I', icon: '🧩', description: 'Introdução à psiquiatria clínica.', folderName: 'psiquiatria-1' },
  { id: 'p6-tecnica-cirurgica', period: 6, title: 'Técnica Cirúrgica', icon: '✂️', description: 'Fundamentos e paramentação cirúrgica.', folderName: 'tecnica-cirurgica' },
  { id: 'p6-gestao-saude', period: 6, title: 'Gestão em Saúde', icon: '📊', description: 'Fundamentos e práticas de gestão em saúde.', folderName: 'gestao-saude' },

  // --- 7º PERÍODO ---
  { id: 'p7-cirurgica-1', period: 7, title: 'Clínica Cirúrgica I', icon: '🔪', description: 'Cirurgia geral e especialidades.', folderName: 'clinica-cirurgica-1' },
  { id: 'p7-sistemicas-1', period: 7, title: 'Clínica Médica: Afecções Sistêmicas I', icon: '🌡️', description: 'Doenças sistêmicas e reumatologia.', folderName: 'afeccoes-sistemicas-1' },
  { id: 'p7-educacao', period: 7, title: 'Educação, Promoção e Tecnologias em Saúde', icon: '🎓', description: 'Educação em saúde.', folderName: 'educacao-saude' },
  { id: 'p7-ginecologia-1', period: 7, title: 'Ginecologia e Obstetrícia I', icon: '🤰', description: 'Saúde da mulher e gestação.', folderName: 'ginecologia-1' },
  { id: 'p7-pediatria-1', period: 7, title: 'Pediatria I', icon: '👶', description: 'Puericultura e pediatria geral.', folderName: 'pediatria-1' },
  { id: 'p7-materno', period: 7, title: 'Prática Clínica: Saúde Materno-Infantil', icon: '🤱', description: 'Prática em GO e Pediatria.', folderName: 'materno-infantil' },
  { id: 'p7-psiquiatria-2', period: 7, title: 'Psiquiatria II', icon: '🧩', description: 'Psicopatologia avançada.', folderName: 'psiquiatria-2' },

  // --- 8º PERÍODO ---
  { id: 'p8-cirurgica-2', period: 8, title: 'Clínica Cirúrgica II', icon: '🔪', description: 'Cirurgia avançada e trauma.', folderName: 'clinica-cirurgica-2' },
  { id: 'p8-sistemicas-2', period: 8, title: 'Clínica Médica: Afecções Sistêmicas II', icon: '🌡️', description: 'Nefrologia, Hemato e outras.', folderName: 'afeccoes-sistemicas-2' },
  { id: 'p8-familia', period: 8, title: 'Cuidado Integral da Família', icon: '👨‍👩‍👧', description: 'Abordagem familiar e comunitária.', folderName: 'familia' },
  { id: 'p8-paliativos', period: 8, title: 'Cuidados Paliativos', icon: '🕯️', description: 'Manejo de fim de vida e dor.', folderName: 'paliativos' },
  { id: 'p8-ginecologia-2', period: 8, title: 'Ginecologia e Obstetrícia II', icon: '🤰', description: 'Patologias obstétricas e ginecológicas.', folderName: 'ginecologia-2' },
  { id: 'p8-gestao', period: 8, title: 'Medicina Empreendedora: Gestão e Inovação em Saúde', icon: '💼', description: 'Gestão de carreira e serviços.', folderName: 'gestao' },
  { id: 'p8-pediatria-2', period: 8, title: 'Pediatria II', icon: '👶', description: 'Pediatria clínica e emergências.', folderName: 'pediatria-2' },
  { id: 'p8-pratica-adulto-2', period: 8, title: 'Prática Clínica: Saúde do Adulto II', icon: '👨', description: 'Internato e prática ambulatorial.', folderName: 'saude-adulto-2' },
];

// Mock Lessons
export const LESSONS: Lesson[] = [
  // ... (Manter o conteúdo existente do LESSONS sem alterações)
];

// Mock Exercises
export const EXERCISES: Exercise[] = [
  {
    id: 'ex-1',
    subjectId: 'proc-patol',
    lessonId: 'patol-5',
    question: 'Qual a principal característica da necrose de coagulação?',
    options: [
      'Preservação do contorno celular por alguns dias.',
      'Liquefação imediata do tecido.',
      'Formação de granulomas.',
      'Ausência de inflamação.'
    ],
    correctOptionIndex: 0
  },
  {
    id: 'ex-2',
    subjectId: 'base-farma',
    lessonId: 'bf-2',
    question: 'O que define a biodisponibilidade de um fármaco?',
    options: [
      'A velocidade de eliminação renal.',
      'A fração da dose administrada que atinge a circulação sistêmica inalterada.',
      'A ligação com proteínas plasmáticas.',
      'A taxa de metabolização hepática.'
    ],
    correctOptionIndex: 1
  },
  {
    id: 'ex-3',
    subjectId: 'anat-patol',
    lessonId: 'anat-p-1',
    question: 'Qual gene é conhecido como "guardião do genoma"?',
    options: [
      'RAS',
      'MYC',
      'TP53',
      'BCL2'
    ],
    correctOptionIndex: 2
  }
];
