import { supabase, supabaseUrl, supabaseAnonKey } from '../supabase';

export interface UploadProgress {
  percent: number;
  loaded: number;
  total: number;
}

export interface UploadResult {
  publicUrl: string;
  filePath: string;
  fileName: string;
  fileSize: number;
}

export interface UploadOptions {
  bucket?: string;
  folder?: string;
  file: File;
  onProgress?: (progress: UploadProgress) => void;
  abortRef?: { abort?: () => void };
}

export const MAX_RECOMMENDED_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Uploads a file to Supabase Storage with XMLHttpRequest to monitor progress real-time.
 */
export function uploadFileWithProgress({
  bucket = 'materials',
  folder = 'uploads',
  file,
  onProgress,
  abortRef,
}: UploadOptions): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    // Generate clean unique filename
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const extension = cleanName.split('.').pop() || 'bin';
    const baseName = cleanName.substring(0, cleanName.lastIndexOf('.')) || 'file';
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${baseName}.${extension}`;
    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    const filePath = cleanFolder ? `${cleanFolder}/${uniqueFileName}` : uniqueFileName;

    const xhr = new XMLHttpRequest();

    if (abortRef) {
      abortRef.abort = () => {
        xhr.abort();
        const err = new Error('Upload cancelado pelo usuário');
        err.name = 'AbortError';
        reject(err);
      };
    }

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.min(100, Math.round((e.loaded / e.total) * 100));
        onProgress({
          percent,
          loaded: e.loaded,
          total: e.total,
        });
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        resolve({
          publicUrl: data.publicUrl,
          filePath,
          fileName: file.name,
          fileSize: file.size,
        });
      } else {
        let errorMsg = `Falha no upload (Status ${xhr.status})`;
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.message || res.error) {
            errorMsg = res.message || res.error;
          }
        } catch {
          if (xhr.statusText) errorMsg = xhr.statusText;
        }
        reject(new Error(errorMsg));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Erro de conexão ao enviar o arquivo. Verifique sua rede e tente novamente.'));
    });

    xhr.addEventListener('abort', () => {
      const err = new Error('Upload cancelado');
      err.name = 'AbortError';
      reject(err);
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('Tempo limite de conexão esgotado. Conexão lenta ou instável.'));
    });

    // 10 minutes timeout for larger files on mobile networks
    xhr.timeout = 10 * 60 * 1000;

    const endpoint = `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${filePath
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`;

    xhr.open('POST', endpoint, true);
    xhr.setRequestHeader('apikey', supabaseAnonKey);
    xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
    xhr.setRequestHeader('x-upsert', 'true');
    if (file.type) {
      xhr.setRequestHeader('Content-Type', file.type);
    } else {
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    }

    xhr.send(file);
  });
}
