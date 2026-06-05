-- Script para criar o Storage do Supabase (Execute no SQL Editor do Supabase)

-- Cria o bucket "materials" como público
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

-- Configura as políticas de acesso para permitir leitura pública
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'materials' );

-- Configura as políticas para permitir upload via painel admin (anon)
CREATE POLICY "Anon Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'materials' );

-- Configura as políticas para permitir atualização (anon)
CREATE POLICY "Anon Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'materials' );

-- Configura as políticas para permitir exclusão (anon)
CREATE POLICY "Anon Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'materials' );
