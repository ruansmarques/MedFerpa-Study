import React, { useState, useRef, useEffect } from 'react';
import { uploadFileWithProgress, formatFileSize, MAX_RECOMMENDED_FILE_SIZE, UploadProgress } from '../services/storageUpload';
import { IconPresentation, IconBook } from './Icons';

export interface InlineUploadProgressProps {
  label: string;
  type: 'slide' | 'summary';
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  accept?: string;
  currentLessonUrl?: string;
  onUploadingStatusChange?: (isUploading: boolean) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export const InlineUploadProgress: React.FC<InlineUploadProgressProps> = ({
  label,
  type,
  value,
  onChange,
  placeholder = 'URL ou anexe um arquivo',
  accept = '.pdf,.ppt,.pptx,.doc,.docx',
  currentLessonUrl,
  onUploadingStatusChange,
}) => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [loadedBytes, setLoadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [sizeWarning, setSizeWarning] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<{ abort?: () => void }>({});

  useEffect(() => {
    onUploadingStatusChange?.(status === 'uploading');
  }, [status, onUploadingStatusChange]);

  const startUpload = async (file: File) => {
    // Preliminary size check
    if (file.size > MAX_RECOMMENDED_FILE_SIZE) {
      setSizeWarning(`Arquivo com ${formatFileSize(file.size)}. O limite recomendado para conexões móveis é 50 MB.`);
    } else {
      setSizeWarning('');
    }

    setCurrentFile(file);
    setStatus('uploading');
    setProgress(0);
    setLoadedBytes(0);
    setTotalBytes(file.size);
    setErrorMessage('');

    try {
      const result = await uploadFileWithProgress({
        bucket: 'materials',
        folder: `uploads/${type}s`,
        file,
        onProgress: (p: UploadProgress) => {
          setProgress(p.percent);
          setLoadedBytes(p.loaded);
          setTotalBytes(p.total);
        },
        abortRef: abortRef.current,
      });

      onChange(result.publicUrl);
      setStatus('success');
      setProgress(100);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setStatus('idle');
        setProgress(0);
        return;
      }
      setStatus('error');
      setErrorMessage(err.message || 'Falha ao realizar upload.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    startUpload(file);
    // Reset file input value so user can re-pick same file if desired
    e.target.value = '';
  };

  const handleRetry = () => {
    if (currentFile) {
      startUpload(currentFile);
    }
  };

  const handleCancel = () => {
    if (abortRef.current.abort) {
      abortRef.current.abort();
    }
    setStatus('idle');
    setProgress(0);
    setCurrentFile(null);
  };

  // SVG circular ring geometry
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
          {type === 'slide' ? <IconPresentation className="w-3.5 h-3.5 text-blue-600" /> : <IconBook className="w-3.5 h-3.5 text-emerald-600" />}
          {label}
        </label>
        {status === 'uploading' && (
          <span className="text-[11px] font-bold text-blue-600 animate-pulse">
            Enviando... {progress}%
          </span>
        )}
      </div>

      {/* Main input & file trigger */}
      <div className={`flex bg-white border rounded-xl overflow-hidden transition ${
        status === 'uploading'
          ? 'border-blue-400 ring-2 ring-blue-100'
          : status === 'error'
          ? 'border-red-400 ring-2 ring-red-100'
          : status === 'success'
          ? 'border-emerald-400'
          : 'border-gray-200 focus-within:ring-2 focus-within:ring-blue-500'
      }`}>
        <input
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (status !== 'uploading') setStatus('idle');
          }}
          placeholder={placeholder}
          disabled={status === 'uploading'}
          className="w-full p-2.5 sm:p-3 text-xs sm:text-sm text-gray-800 outline-none bg-transparent"
        />

        {/* Upload Trigger / Action button */}
        <div className="flex items-center border-l border-gray-100 bg-gray-50">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
            disabled={status === 'uploading'}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={status === 'uploading'}
            className={`px-3 sm:px-4 py-2 flex items-center gap-1.5 font-bold text-xs transition cursor-pointer select-none ${
              status === 'uploading'
                ? 'opacity-40 cursor-not-allowed text-gray-400'
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100 active:scale-95'
            }`}
            title="Escolher arquivo do dispositivo"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="hidden sm:inline">Anexar</span>
          </button>
        </div>
      </div>

      {/* Uploading state banner with circular progress ring */}
      {status === 'uploading' && currentFile && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-center gap-3 min-w-0">
            {/* Circular Progress Ring */}
            <div className="relative flex items-center justify-center shrink-0 w-10 h-10">
              <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r={radius}
                  className="stroke-blue-200"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  cx="18"
                  cy="18"
                  r={radius}
                  className="stroke-blue-600 transition-all duration-200 ease-out"
                  strokeWidth="3.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-[10px] font-black text-blue-700 select-none">
                {progress}%
              </span>
            </div>

            {/* File Details */}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-gray-800 truncate" title={currentFile.name}>
                {currentFile.name}
              </span>
              <span className="text-[10px] text-blue-700 font-medium">
                {formatFileSize(loadedBytes)} de {formatFileSize(totalBytes)}
              </span>
            </div>
          </div>

          {/* Cancel button */}
          <button
            type="button"
            onClick={handleCancel}
            className="shrink-0 px-2 py-1 text-[11px] font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Cancelar envio"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Error State Banner with Retry */}
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs animate-fadeIn">
          <div className="flex items-start sm:items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-red-800">Falha no envio</span>
              <span className="text-[10px] text-red-600 truncate">{errorMessage}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            {currentFile && (
              <button
                type="button"
                onClick={handleRetry}
                className="px-2.5 py-1 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition shadow-xs flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Tentar Novamente
              </button>
            )}
            <button
              type="button"
              onClick={() => { setStatus('idle'); setErrorMessage(''); }}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 rounded-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {status === 'success' && currentFile && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs text-emerald-800 animate-fadeIn">
          <div className="flex items-center gap-1.5 truncate">
            <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold truncate">{currentFile.name}</span>
            <span className="text-[10px] text-emerald-600 shrink-0">({formatFileSize(currentFile.size)})</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">Pronto</span>
        </div>
      )}

      {/* File Size warning for mobile networks */}
      {sizeWarning && (
        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{sizeWarning}</span>
        </div>
      )}

      {/* Previously saved URL reminder when editing */}
      {currentLessonUrl && !value && (
        <span className="text-[11px] text-blue-500 truncate" title={currentLessonUrl}>
          Atual gravado: {currentLessonUrl}
        </span>
      )}
    </div>
  );
};
