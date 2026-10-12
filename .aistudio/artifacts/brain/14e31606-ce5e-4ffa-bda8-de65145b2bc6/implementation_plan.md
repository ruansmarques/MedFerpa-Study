# Plano de Implementação: Otimização do Sistema de Upload de Arquivos de Aulas

Este plano detalha a modernização da experiência de upload de materiais didáticos (slides e resumos) no painel administrativo (`AdminDashboard`), com foco na resolução de incertezas durante uploads realizados via dispositivos móveis.

---

## 1. Contexto e Diagnóstico Atual

### 1.1 Problemas Identificados
1. **Falta de Feedback Granular:** Atualmente, o botão exibe apenas `'...'` durante todo o envio (`components/AdminDashboard.tsx`, linhas 1020 e 1034). O usuário móvel não sabe se o arquivo está em 5%, 80%, ou se a conexão travou.
2. **Uso de API sem Eventos de Progresso:** O método padrão `supabase.storage.from(...).upload(...)` (`AdminDashboard.tsx`, linhas 578-580) utiliza a Fetch API nativa do browser, que não emite eventos de progresso de upload (`onUploadProgress`).
3. **Falta de Validação Prévia de Tamanho:** Arquivos muito grandes (como apresentações PPTX de centenas de megabytes) são enviados diretamente, consumindo dados móveis e falhando silenciosamente ou após longo tempo de espera.
4. **Sem Opção de Retentativa Fácil:** Em caso de oscilação na rede móvel (`4G/5G/Wi-Fi instável`), o upload falha com um `alert()` genérico (`AdminDashboard.tsx`, linha 594), obrigando o usuário a reabrir o seletor de arquivos do celular.
5. **Risco de Submissão Prematura:** O usuário pode clicar em "Publicar Registro" ou "Atualizar Registro" (`AdminDashboard.tsx`, linha 1050) enquanto o arquivo ainda está subindo, salvando o formulário com o link antigo ou vazio.

### 1.2 Preferências Definidas pelo Usuário
- **Feedback Visual:** Indicador inline compacto com anel circular de progresso (SVG circular animado com porcentagem numérica central).
- **Tratamento de Arquivos e Conexão:** Validação de tamanho prévio (com aviso para arquivos acima do limite recomendado) e botão explícito de "Tentar Novamente" com o arquivo retido na memória.
- **Comportamento do Formulário:** Bloquear o botão de salvar a aula enquanto qualquer upload estiver em andamento.

---

## 2. Arquitetura da Solução

```
[ Usuário seleciona arquivo (Mobile/Desktop) ]
                      │
                      ▼
       [ Validação de Tamanho & Tipo ]
             ├── > 50 MB ──► Exibe aviso de limite / confirmação
             └── Válido
                      │
                      ▼
[ Upload via XHR com Supabase Storage Endpoint ]
   ├── Progresso contínuo (0-100%) ──► Anel Circular SVG Inline
   ├── Bloqueia botão "Publicar/Atualizar"
   ├── Sucesso ──► Ícone de confirmação (verde) + preenchimento automático da URL
   └── Erro / Conexão caída ──► Badge de alerta + Botão "Tentar Novamente"
```

---

## 3. Fases de Implementação

### Fase 1: Utilitário de Upload com Progresso (`services/storageUpload.ts`)
Criar uma função utilitária dedicada para upload no Supabase Storage utilizando `XMLHttpRequest`, permitindo rastreio preciso de bytes enviados.
- **Endpoint:** `${supabaseUrl}/storage/v1/object/materials/uploads/${type}s/${fileName}`
- **Headers:** `apikey`, `Authorization: Bearer <anonKey>`, `x-upsert: true`
- **Callbacks:** `onProgress(percent: number, loadedBytes: number, totalBytes: number)`
- **Controle:** Suporte a cancelamento voluntário (`abortController` ou `xhr.abort()`).
- **Retorno:** URL pública automática após sucesso.

### Fase 2: Componente de UI `InlineUploadProgress` (`components/InlineUploadProgress.tsx`)
Criar um componente modular para o slot de upload com anel circular:
- **Estado Ocioso:** Botão compacto "Upload" com ícone de anexo/clipe e suporte a touch mobile amigável.
- **Estado de Carregamento:**
  - Anel circular SVG com raio dinâmico `stroke-dashoffset` refletindo 0% a 100%.
  - Porcentagem exibida de forma legível dentro ou ao lado do anel.
  - Nome do arquivo truncado e peso formatado (ex.: `aula03.pdf · 4.2 MB`).
- **Estado de Concluído:**
  - Checkmark verde de confirmação com animação sutil.
  - Exibição de link preenchido com botão rápido para substituir ou remover.
- **Estado de Erro:**
  - Alerta vermelho discreto com mensagem compreensível (ex.: "Falha na conexão").
  - Botão de ação rápida "Tentar Novamente" (reexecuta o upload do mesmo arquivo em memória sem precisar escolher de novo no celular).

### Fase 3: Integração no `AdminDashboard.tsx`
Modificar o formulário do painel administrativo (`components/AdminDashboard.tsx`):
- **Linhas 32-34:** Atualizar o gerenciamento de estado:
  - `slideUploadState`: `{ status: 'idle' | 'uploading' | 'success' | 'error', progress: number, file?: File, errorMsg?: string }`
  - `summaryUploadState`: `{ status: 'idle' | 'uploading' | 'success' | 'error', progress: number, file?: File, errorMsg?: string }`
- **Linhas 567-599 (`handleFileUpload`):** Substituir pela chamada com monitoramento contínuo de progresso e validação de tamanho (limite seguro de 50MB, com alerta amigável caso ultrapasse).
- **Linhas 1014-1042:** Substituir os botões rudimentares de upload pelos novos componentes inline com anel circular de progresso.
- **Linha 1050:** Desabilitar o botão de submissão do formulário (`disabled={loading || slideUploadState.status === 'uploading' || summaryUploadState.status === 'uploading'}`) com mensagem contextual (ex.: "Aguarde o envio dos materiais...").

---

## 4. Plano de Testes e Validação

1. **Teste em Resoluções Móveis:**
   - Testar o fluxo em viewport de smartphone (360px a 430px de largura).
   - Verificar área de toque, legibilidade do anel circular e do percentual.
2. **Teste de Progresso Real e Throttling:**
   - Simular conexões `Fast 3G` e `Slow 3G` no DevTools para acompanhar a evolução suave do anel circular de 0% a 100%.
3. **Teste de Falha de Conexão e Retentativa:**
   - Desconectar a rede propositalmente durante o envio para acionar o estado de erro.
   - Pressionar o botão "Tentar Novamente" e validar a recuperação sem reabertura do explorador de arquivos.
4. **Teste de Bloqueio do Formulário:**
   - Garantir que o botão "Publicar/Atualizar Registro" permaneça bloqueado e com indicação visual enquanto houver upload ativo.
5. **Verificação de Build e Integridade:**
   - Executar `compile_applet` para certificar ausência de erros de tipagem TypeScript e quebra de dependências.
