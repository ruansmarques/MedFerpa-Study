import React from 'react';
import { SyncStatus } from '../services/syncService';

interface SyncIndicatorProps {
  status: SyncStatus;
  onManualSync: () => Promise<void>;
  variant?: 'compact' | 'bar' | 'card';
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({
  status,
  onManualSync,
  variant = 'compact'
}) => {
  const isSyncing = status.state === 'syncing';
  const isError = status.state === 'error';
  const isOffline = status.state === 'offline';

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Não sincronizado';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 10) return 'Agora mesmo';
    if (seconds < 60) return `Há ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Há ${minutes}m`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (variant === 'bar') {
    return (
      <div className="flex flex-col gap-2 p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              {isSyncing ? (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              ) : null}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isSyncing
                    ? 'bg-blue-500'
                    : isOffline
                    ? 'bg-amber-500'
                    : isError
                    ? 'bg-rose-500'
                    : 'bg-emerald-500'
                }`}
              ></span>
            </span>
            <span className="font-semibold text-slate-700 truncate">
              {isSyncing
                ? 'Salvando progresso...'
                : isOffline
                ? 'Modo offline'
                : isError
                ? 'Erro ao salvar'
                : 'Progresso salvo'}
            </span>
          </div>

          {status.lastSyncedAt && !isSyncing && (
            <span className="text-slate-400 text-[10px] shrink-0">
              {formatLastSync(status.lastSyncedAt)}
            </span>
          )}
        </div>

        <button
          onClick={onManualSync}
          disabled={isSyncing}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:text-blue-700 transition-all shadow-2xs disabled:opacity-50"
          title="Salvar progresso"
        >
          <svg
            className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{isSyncing ? 'Salvando progresso...' : 'Salvar progresso'}</span>
        </button>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Sincronização em Nuvem</h4>
              <p className="text-xs text-slate-500">
                Seu progresso (aulas, simulados e XP) é compartilhado em tempo real entre celular e computador.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSyncing
                  ? 'bg-blue-500 animate-pulse'
                  : isOffline
                  ? 'bg-amber-500'
                  : isError
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
              }`}
            ></span>
            <span className="font-semibold text-slate-700">
              {isSyncing
                ? 'Sincronizando com o banco...'
                : isOffline
                ? 'Sem conexão com a internet'
                : 'Conectado e atualizado'}
            </span>
            {status.lastSyncedAt && (
              <span className="text-slate-400">({formatLastSync(status.lastSyncedAt)})</span>
            )}
          </div>

          <button
            onClick={onManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{isSyncing ? 'Salvando progresso...' : 'Salvar progresso'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Compact badge (default, for navbar or buttons)
  return (
    <button
      onClick={onManualSync}
      disabled={isSyncing}
      className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all border ${
        isSyncing
          ? 'bg-blue-50 text-blue-600 border-blue-200'
          : isOffline
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : isError
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/80'
      }`}
      title="Clique para sincronizar o progresso com a nuvem"
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isSyncing
            ? 'bg-blue-500 animate-ping'
            : isOffline
            ? 'bg-amber-500'
            : isError
            ? 'bg-rose-500'
            : 'bg-emerald-500'
        }`}
      ></span>
      <span className="font-semibold text-[11px] sm:text-xs">
        {isSyncing ? 'Sincronizando' : 'Nuvem OK'}
      </span>
      <svg
        className={`w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform ${
          isSyncing ? 'animate-spin text-blue-600' : 'group-hover:rotate-180'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  );
};
