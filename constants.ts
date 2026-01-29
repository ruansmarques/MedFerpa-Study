import { User, Subject, Lesson, Exercise } from './types';

// Mock Users
export const MOCK_USERS: User[] = [
  {
    ra: '24151433-0',
    name: 'Ana Silva',
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

// Mock Subjects
export const SUBJECTS: Subject[] = [
  // 4º Período
  { id: 'subj-saude', period: 4, title: 'Subjetividade em Saúde', icon: '🧠', description: 'Aspectos humanos e psicológicos do cuidado.', folderName: 'subjetividade' },
  { id: 'proc-patol', period: 4, title: 'Processos Patológicos', icon: '🦠', description: 'Mecanismos gerais de agressão e defesa.', folderName: 'processos-patologicos' },
  { id: 'semio-basica', period: 4, title: 'Semiologia Básica', icon: '🩺', description: 'Introdução à anamnese e exame físico.', folderName: 'semiologia' },
  { id: 'base-farma', period: 4, title: 'Bases da Farmacologia', icon: '💊', description: 'Princípios da farmacocinética e dinânica.', folderName: 'farmacologia' },
  { id: 'aph', period: 4, title: 'Atendimento Pré-Hospitalar', icon: '🚑', description: 'Protocolos de urgência e emergência.', folderName: 'aph' },

  // 5º Período
  { id: 'anat-patol', period: 5, title: 'Anatomia Patológica', icon: '🔬', description: 'Diagnóstico macro e microscópico das doenças.', folderName: 'anatomia-patologica' },
  { id: 'farma-med', period: 5, title: 'Farmacologia Médica', icon: '💊', description: 'Terapêutica clínica aplicada aos sistemas.', folderName: 'farmacologia-medica' },
  { id: 'mbe', period: 5, title: 'Medicina Baseada em Evidências', icon: '📚', description: 'Análise crítica de artigos científicos.', folderName: 'mbe' },
  { id: 'pna', period: 5, title: 'PNA Integral à Saúde', icon: '🏥', description: 'Políticas de saúde pública e atenção primária.', folderName: 'pna' },
  { id: 'semio-sist', period: 5, title: 'Semiologia dos Sistemas', icon: '🩻', description: 'Exame físico avançado por sistemas.', folderName: 'semiologia-sistemas' },
];

// Mock Lessons
export const LESSONS: Lesson[] = [
  // --- 4º PERÍODO ---

  // Subjetividade em Saúde
  { id: 'subj-1', subjectId: 'subj-saude', title: 'AULA 01 - A Subjetividade e o Processo Saúde Doença', youtubeId: 'g_80a3_N3bM', duration: '45 min' },
  { id: 'subj-2', subjectId: 'subj-saude', title: 'AULA 02 - Modo Hegemônico de Produção de Cuidado', youtubeId: 'L-G7L6qE3b8', duration: '50 min' },
  { id: 'subj-3', subjectId: 'subj-saude', title: 'AULA 03 - Introdução a Práticas Integrativas e Complementares - PICs', youtubeId: 'abc123xyz', duration: '55 min' },
  { id: 'subj-4', subjectId: 'subj-saude', title: 'AULA 04 - Direitos e deveres do usuário', youtubeId: 'def456uvw', duration: '40 min' },
  { id: 'subj-5', subjectId: 'subj-saude', title: 'AULA 05 - Tecnologias dura dura leve e leve', youtubeId: 'ghi789rst', duration: '60 min' },
  { id: 'subj-6', subjectId: 'subj-saude', title: 'AULA 06 - Etnografia', youtubeId: 'jkl012nop', duration: '50 min' },
  { id: 'subj-7', subjectId: 'subj-saude', title: 'AULA 07 - Politica Nacional de Humanização - PNH', youtubeId: 'mno345qrs', duration: '55 min' },

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
  { id: 'imuno-11', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 11 - Resposta Imune Cotra Micro-organismos e Vacinas', youtubeId: 'imuno_v11', duration: '65 min' },
  { id: 'imuno-12', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 12 - Reações de Hipersensibilidade e Alergia', youtubeId: 'imuno_v12', duration: '50 min' },
  { id: 'imuno-13', subjectId: 'proc-patol', category: 'Imunologia', title: 'AULA 13 - Imunologia do Transplante', youtubeId: 'imuno_v13', duration: '45 min' },

  // Microbiologia
  { id: 'micro-1', subjectId: 'proc-patol', category: 'Microbiologia', title: 'AULA 01 - Introdução a microbiologia', youtubeId: 'micro_v1', duration: '40 min' },
  { id: 'micro-2', subjectId: 'proc-patol', category: 'Microbiologia', title: 'AULA 02 - bacteriologia', youtubeId: 'micro_v2', duration: '55 min' },
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
  { id: 'bf-1', subjectId: 'base-farma', title: 'AULA 01 - Historia da Farmacologia', youtubeId: 'bf_v1', duration: '40 min' },
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
  { id: 'aph-3', subjectId: 'aph', title: 'AULA 03 - OVACE adulto (Obstrução de Via Aérea)', youtubeId: 'aph_v3', duration: '40 min' },
  { id: 'aph-4', subjectId: 'aph', title: 'AULA 04 - SBV à Criança + OVACE pediátrico', youtubeId: 'aph_v4', duration: '55 min' },
  { id: 'aph-5', subjectId: 'aph', title: 'AULA 05 - Atendimento Inicial ao Trauma', youtubeId: 'aph_v5', duration: '60 min' },
  { id: 'aph-6', subjectId: 'aph', title: 'AULA 06 - Síncope e Convulsão no pré-hospitalar', youtubeId: 'aph_v6', duration: '50 min' },

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