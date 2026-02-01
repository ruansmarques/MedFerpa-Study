import { User, Subject, Lesson, Exercise, Book } from './types';

// Mock Users
export const MOCK_USERS: User[] = [
  {
    ra: '24151433-0',
    name: 'Editar nome',
    completedLessons: ['subj-1', 'imuno-1', 'semio-1'],
    avatarColor: 'bg-emerald-500'
  },
  {
    ra: '11223344-5',
    name: 'Carlos Souza',
    completedLessons: ['subj-1'],
    avatarColor: 'bg-blue-500'
  },
  {
    ra: '99887766-1',
    name: 'Beatriz Lima',
    completedLessons: ['subj-1', 'subj-2', 'imuno-1', 'anat-p-1', 'anat-p-2'],
    avatarColor: 'bg-purple-500'
  }
];

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
  { id: 'p6-bioetica', period: 6, title: 'Bioética e Medicina Legal', icon: '⚖️', description: 'Ética médica e legislação.', folderName: 'bioetica' },
  { id: 'p6-cardiopulmonar', period: 6, title: 'Clínica Médica: Cardiopulmonar', icon: '🫀', description: 'Cardiologia e Pneumologia clínica.', folderName: 'cardiopulmonar' },
  { id: 'p6-neuroendo', period: 6, title: 'Clínica Médica: Neuroendocrinologia, Metabologia e Imaginologia', icon: '🧠', description: 'Neuro, Endócrino e Imagem.', folderName: 'neuro-endo' },
  { id: 'p6-linhas-cuidado', period: 6, title: 'Linhas de Cuidado do Sistema Único de Saúde', icon: '🏥', description: 'Fluxos de atendimento no SUS.', folderName: 'linhas-cuidado' },
  { id: 'p6-pratica-adulto-1', period: 6, title: 'Prática Clínica: Saúde do Adulto I', icon: '👨', description: 'Atendimento clínico ao adulto.', folderName: 'saude-adulto-1' },
  { id: 'p6-psiquiatria-1', period: 6, title: 'Psiquiatria I', icon: '🧩', description: 'Introdução à psiquiatria clínica.', folderName: 'psiquiatria-1' },
  { id: 'p6-tecnica-cirurgica', period: 6, title: 'Técnica Cirúrgica', icon: '✂️', description: 'Fundamentos e paramentação cirúrgica.', folderName: 'tecnica-cirurgica' },

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
  // --- 4º PERÍODO ---

  // Subjetividade em Saúde
  { id: 'subj-1', subjectId: 'subj-saude', title: 'AULA 01 - A Subjetividade e o Processo Saúde Doença', youtubeId: 'g_80a3_N3bM', duration: '45 min' },
  { id: 'subj-2', subjectId: 'subj-saude', title: 'AULA 02 - Modo Hegemônico de Produção de Cuidado', youtubeId: 'L-G7L6qE3b8', duration: '50 min' },
  { id: 'subj-3', subjectId: 'subj-saude', title: 'AULA 03 - Introdução a Práticas Integrativas e Complementares - PICs', youtubeId: 'abc123xyz', duration: '55 min' },
  { id: 'subj-4', subjectId: 'subj-saude', title: 'AULA 04 - Direitos e Deveres do usuário da Saúde', youtubeId: 'def456uvw', duration: '40 min' },
  { id: 'subj-5', subjectId: 'subj-saude', title: 'AULA 05 - Tecnologias dura dura leve e leve', youtubeId: 'ghi789rst', duration: '60 min' },
  { id: 'subj-6', subjectId: 'subj-saude', title: 'AULA 06 - Etnografia', youtubeId: 'jkl012nop', duration: '50 min' },
  { id: 'subj-7', subjectId: 'subj-saude', title: 'AULA 07 - Política Nacional de Humanização - PNH', youtubeId: 'mno345qrs', duration: '55 min' },

  // --- PROCESSOS PATOLÓGICOS (Categorized) ---
  
  // Imunologia
  { id: 'imuno-1', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 01 - Introdução a imunologia', youtubeId: 'imuno_v1', duration: '40 min' },
  { id: 'imuno-2', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 02 - Imunidade Inata', youtubeId: 'imuno_v2', duration: '55 min' },
  { id: 'imuno-3', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 03 - Inflamação', youtubeId: 'imuno_v3', duration: '50 min' },
  { id: 'imuno-4', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 04 - Apresentação de antígeno e MHC', youtubeId: 'imuno_v4', duration: '60 min' },
  { id: 'imuno-5', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 05 - Desenvolvimento e Ativação de linfócitos', youtubeId: 'imuno_v5', duration: '55 min' },
  { id: 'imuno-6', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 06 - Diferenciação e Funções das Células T Efetoras', youtubeId: 'imuno_v6', duration: '50 min' },
  { id: 'imuno-7', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 07 - Ativação dos Linfócitos B e Produção de Anticorpos', youtubeId: 'imuno_v7', duration: '45 min' },
  { id: 'imuno-8', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 08 - Mecanismos Efetores da Imunidade Humoral', youtubeId: 'imuno_v8', duration: '50 min' },
  { id: 'imuno-9', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 09 - Imunidade Especializada e Tecidos Imunologicamente Privilegiados', youtubeId: 'imuno_v9', duration: '60 min' },
  { id: 'imuno-10', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 10 - Tolerância Imunológica e Autoimunidade', youtubeId: 'imuno_v10', duration: '55 min' },
  { id: 'imuno-11', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 11 - Resposta Imune Contra Micro-organismos e Vacinas', youtubeId: 'imuno_v11', duration: '65 min' },
  { id: 'imuno-12', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 12 - Reações de Hipersensibilidade e Alergia', youtubeId: 'imuno_v12', duration: '50 min' },
  { id: 'imuno-13', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 13 - Imunologia do Transplante', youtubeId: 'imuno_v13', duration: '45 min' },

  // Microbiologia
  { id: 'micro-1', subjectId: 'proc-patol', category: 'Microbiologia', title: 'AULA 01 - Introdução a microbiologia', youtubeId: 'micro_v1', duration: '40 min' },
  { id: 'micro-2', subjectId: 'proc-patol', category: 'Microbiologia', title: 'AULA 02 - Bacteriologia', youtubeId: 'micro_v2', duration: '55 min' },
  { id: 'micro-3', subjectId: 'proc-patol', category: 'Microbiologia', title: 'AULA 03 - Controle do Crescimento Microbiano 1', youtubeId: 'micro_v3', duration: '50 min' },
  { id: 'micro-4', subjectId: 'proc-patol', category: 'Microbiologia', title: 'AULA 04 - Controle do Crescimento Microbiano 2', youtubeId: 'micro_v4', duration: '45 min' },
  { id: 'micro-5', subjectId: 'proc-patol', category: 'Microbiologia', title: 'AULA 05 - Genética bacteriana', youtubeId: 'micro_v5', duration: '60 min' },
  { id: 'micro-6', subjectId: 'proc-patol', category: 'Microbiologia', title: 'AULA 06 - Microbiota Normal, Patogenicidade e Virulência Bacteriana', youtubeId: 'micro_v6', duration: '65 min' },
  { id: 'micro-7', subjectId: 'proc-patol', category: 'Microbiologia', title: 'AULA 07 - Micologia', youtubeId: 'micro_v7', duration: '50 min' },
  { id: 'micro-8', subjectId: 'proc-patol', category: 'Microbiologia', title: 'AULA 08 - Virologia', youtubeId: 'micro_v8', duration: '55 min' },

  // Parasitologia
  { id: 'parasito-1', subjectId: 'proc-patol', category: 'Parasitologia', title: 'AULA 01 - Introdução à Parasitologia', youtubeId: 'parasito_v1', duration: '40 min' },
  { id: 'parasito-2', subjectId: 'proc-patol', category: 'Parasitologia', title: 'AULA 02 - Malária', youtubeId: 'parasito_v2', duration: '55 min' },
  { id: 'parasito-3', subjectId: 'proc-patol', category: 'Parasitologia', title: 'AULA 03 - Doença de Chagas', youtubeId: 'parasito_v3', duration: '50 min' },
  { id: 'parasito-4', subjectId: 'proc-patol', category: 'Parasitologia', title: 'AULA 04 - Toxoplasmose', youtubeId: 'parasito_v4', duration: '45 min' },
  { id: 'parasito-5', subjectId: 'proc-patol', category: 'Parasitologia', title: 'AULA 05 - Giardíase', youtubeId: 'parasito_v5', duration: '40 min' },
  { id: 'parasito-6', subjectId: 'proc-patol', category: 'Parasitologia', title: 'AULA 06 - Entamoeba', youtubeId: 'parasito_v6', duration: '35 min' },
  { id: 'parasito-7', subjectId: 'proc-patol', category: 'Parasitologia', title: 'AULA 07 - Trichomonas', youtubeId: 'parasito_v7', duration: '30 min' },
  { id: 'parasito-8', subjectId: 'proc-patol', category: 'Parasitologia', title: 'AULA 08 - Teníase', youtubeId: 'parasito_v8', duration: '50 min' },
  { id: 'parasito-9', subjectId: 'proc-patol', category: 'Parasitologia', title: 'AULA 09 - Esquistossomose', youtubeId: 'parasito_v9', duration: '55 min' },

  // Patologia Geral
  { id: 'patol-1', subjectId: 'proc-patol', category: 'Patologia Geral', title: 'AULA 01 - Bases das doenças e Processos patológicos', youtubeId: 'patol_v1', duration: '45 min' },
  { id: 'patol-2', subjectId: 'proc-patol', category: 'Patologia Geral', title: 'AULA 02 - Adaptação do crescimento e Diferenciação celular', youtubeId: 'patol_v2', duration: '55 min' },
  { id: 'patol-3', subjectId: 'proc-patol', category: 'Patologia Geral', title: 'AULA 03 - Lesões Reversíveis e Irreversíveis', youtubeId: 'patol_v3', duration: '60 min' },
  { id: 'patol-4', subjectId: 'proc-patol', category: 'Patologia Geral', title: 'AULA 04 - Acúmulos intracelulares e Calcificação', youtubeId: 'patol_v4', duration: '50 min' },
  { id: 'patol-5', subjectId: 'proc-patol', category: 'Patologia Geral', title: 'AULA 05 - Inflamação', youtubeId: 'patol_v5', duration: '55 min' },
  { id: 'patol-6', subjectId: 'proc-patol', category: 'Patologia Geral', title: 'AULA 06 - Inflamação Crônica e Granulomatosa', youtubeId: 'patol_v6', duration: '50 min' },
  { id: 'patol-7', subjectId: 'proc-patol', category: 'Patologia Geral', title: 'AULA 07 - Reparação tecidual', youtubeId: 'patol_v7', duration: '45 min' },
  { id: 'patol-8', subjectId: 'proc-patol', category: 'Patologia Geral', title: 'AULA 08 - Distúrbios hemodinâmicos 1', youtubeId: 'patol_v8', duration: '60 min' },
  { id: 'patol-9', subjectId: 'proc-patol', category: 'Patologia Geral', title: 'AULA 09 - Distúrbios hemodinâmicos 2', youtubeId: 'patol_v9', duration: '55 min' },
  { id: 'patol-10', subjectId: 'proc-patol', category: 'Patologia Geral', title: 'AULA 10 - Neoplasias 1', youtubeId: 'patol_v10', duration: '65 min' },
  { id: 'patol-11', subjectId: 'proc-patol', category: 'Patologia Geral', title: 'AULA 11 - Neoplasias 2', youtubeId: 'patol_v11', duration: '60 min' },
  { id: 'patol-12', subjectId: 'proc-patol', category: 'Patologia Geral', title: 'AULA 12 - Doenças Nutricionais', youtubeId: 'patol_v12', duration: '50 min' },


  // Semiologia Básica
  { id: 'semio-1', subjectId: 'semio-basica', title: 'AULA 01 - Relação Médico-paciente', youtubeId: 'semio_v1', duration: '45 min' },
  { id: 'semio-2', subjectId: 'semio-basica', title: 'AULA 02 - Anamnese', youtubeId: 'semio_v2', duration: '50 min' },
  { id: 'semio-3', subjectId: 'semio-basica', title: 'AULA 03 - Exame Físico Geral', youtubeId: 'semio_v3', duration: '55 min' },
  { id: 'semio-4p', subjectId: 'semio-basica', title: 'AULA 04 - Métodos propedêuticos - Prático', youtubeId: 'semio_v4p', duration: '60 min' },
  { id: 'semio-4t', subjectId: 'semio-basica', title: 'AULA 04 - Métodos propedêuticos - Teórico', youtubeId: 'semio_v4t', duration: '50 min' },
  { id: 'semio-5', subjectId: 'semio-basica', title: 'AULA 05 - Anamnese Psiquiátrica', youtubeId: 'semio_v5', duration: '40 min' },
  { id: 'semio-6', subjectId: 'semio-basica', title: 'AULA 06 - Sistema Cardiovascular', youtubeId: 'semio_v6', duration: '65 min' },
  { id: 'semio-7', subjectId: 'semio-basica', title: 'AULA 07 - Exame Físico do Abdome', youtubeId: 'semio_v7', duration: '55 min' },
  { id: 'semio-8a', subjectId: 'semio-basica', title: 'AULA 08 - Sistema Respiratório 1', youtubeId: 'semio_v8a', duration: '50 min' },
  { id: 'semio-8b', subjectId: 'semio-basica', title: 'AULA 08 - Sistema Respiratório 2', youtubeId: 'semio_v8b', duration: '45 min' },
  { id: 'semio-9', subjectId: 'semio-basica', title: 'AULA 09 - Sistema Nervoso', youtubeId: 'semio_v9', duration: '70 min' },
  { id: 'semio-10', subjectId: 'semio-basica', title: 'AULA 10 - Ginecologia e Obstetrícia', youtubeId: 'semio_v10', duration: '60 min' },

  // Bases da Farmacologia
  { id: 'bf-1', subjectId: 'base-farma', title: 'AULA 01 - História da Farmacologia', youtubeId: 'bf_v1', duration: '40 min' },
  { id: 'bf-2', subjectId: 'base-farma', title: 'AULA 02 - Fundamentos em Bases Farmacológicas', youtubeId: 'bf_v2', duration: '55 min' },
  { id: 'bf-3', subjectId: 'base-farma', title: 'AULA 03 - Antagonistas Muscarínicos', youtubeId: 'bf_v3', duration: '50 min' },
  { id: 'bf-4', subjectId: 'base-farma', title: 'AULA 04 - Antagonistas Muscarínicos', youtubeId: 'bf_v4', duration: '45 min' },
  { id: 'bf-5', subjectId: 'base-farma', title: 'AULA 05 - Agentes Anticolinesterásicos', youtubeId: 'bf_v5', duration: '50 min' },
  { id: 'bf-6', subjectId: 'base-farma', title: 'AULA 06 - Receptores Gabaérgicos', youtubeId: 'bf_v6', duration: '60 min' },
  { id: 'bf-7', subjectId: 'base-farma', title: 'AULA 07 - Fármacos antipsicóticos', youtubeId: 'bf_v7', duration: '55 min' },
  { id: 'bf-8', subjectId: 'base-farma', title: 'AULA 08 - Anti-inflamatório Não Esteroidais (AINES)', youtubeId: 'bf_v8', duration: '65 min' },

  // Atendimento Pré-Hospitalar
  { id: 'aph-1', subjectId: 'aph', title: 'AULA 01 - Atendimento pré-hospitalar e hospitalar', youtubeId: 'aph_v1', duration: '45 min' },
  { id: 'aph-2', subjectId: 'aph', title: 'AULA 02 - Suporte Básico de Vida ao Adulto', youtubeId: 'aph_v2', duration: '50 min' },
  { id: 'aph-3', subjectId: 'aph', title: 'AULA 03 - OVACE adulto (Obstrução de Via Aérea por Corpo Estranho)', youtubeId: 'aph_v3', duration: '40 min' },
  { id: 'aph-4', subjectId: 'aph', title: 'AULA 04 - Suporte Básico de Vida à Criança + OVACE pediátrico', youtubeId: 'aph_v4', duration: '55 min' },
  { id: 'aph-5', subjectId: 'aph', title: 'AULA 05 - Atendimento Inicial ao Trauma', youtubeId: 'aph_v5', duration: '60 min' },
  { id: 'aph-6', subjectId: 'aph', title: 'AULA 06 - Síncope e Convulsão no atendimento pré-hospitalar', youtubeId: 'aph_v6', duration: '50 min' },

  // --- 5º PERÍODO ---

  // Anatomia Patológica
  { id: 'anat-p-1', subjectId: 'anat-patol', title: 'AULA 01 - Neoplasias', youtubeId: 'jkl012nop', duration: '50 min' },
  { id: 'anat-p-2', subjectId: 'anat-patol', title: 'AULA 02 - Distúrbios Hemodinâmicos', youtubeId: 'mno345qrs', duration: '55 min' },
  
  // Farmacologia Médica
  { id: 'farma-med-1', subjectId: 'farma-med', title: 'AULA 01 - Anti-hipertensivos', youtubeId: 'N9q2d1_qZ3s', duration: '60 min' },
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