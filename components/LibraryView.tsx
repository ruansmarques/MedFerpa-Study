import React, { useState } from 'react';
import { LIBRARY_BOOKS } from '../constants';
import { IconBook } from './Icons';
import { storage } from '../firebase';
import { ref, getDownloadURL } from 'firebase/storage';

const LibraryView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null);

  // Sort books: Author (A-Z) -> Title (A-Z)
  const sortedBooks = [...LIBRARY_BOOKS].sort((a, b) => {
    const authorCompare = a.author.localeCompare(b.author);
    if (authorCompare !== 0) return authorCompare;
    return a.title.localeCompare(b.title);
  });

  // Extract unique categories
  const categories = ['Todos', ...Array.from(new Set(LIBRARY_BOOKS.map(book => book.category)))];

  const filteredBooks = sortedBooks.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || book.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleDownload = async (bookId: string, fileName: string) => {
    setLoadingBookId(bookId);
    
    // Structure: materials/books/FileName.pdf
    const storagePath = `materials/books/${fileName}`;

    try {
      const url = await getDownloadURL(ref(storage, storagePath));
      window.open(url, '_blank');
    } catch (error) {
      console.error("Erro ao buscar livro:", error);
      alert(`Livro não encontrado no servidor.\nCaminho procurado: ${storagePath}\n\nVerifique se o arquivo foi enviado para o Storage.`);
    } finally {
      setLoadingBookId(null);
    }
  };

  return (
    <div className="p-4 lg:p-10 max-w-6xl mx-auto pb-20">
      <div className="text-center lg:text-left mb-8 lg:mb-12">
        <h2 className="text-2xl lg:text-3xl font-black text-slate-800 mb-2">Biblioteca Digital</h2>
        <p className="text-gray-500">Acesse e baixe os principais livros didáticos do curso.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 mb-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="w-full">
           <input 
            type="text" 
            placeholder="Buscar por título ou autor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
           />
        </div>
        
        <div className="flex gap-2 overflow-x-auto w-full pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBooks.map(book => (
          <div key={book.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow flex flex-col h-full group">
            
            {/* Cover Placeholder */}
            <div className={`h-40 ${book.color} p-6 flex items-center justify-center relative overflow-hidden`}>
               {/* Pattern overlay */}
               <div className="absolute inset-0 bg-white opacity-10 rotate-12 scale-150 transform translate-y-10"></div>
               <div className="relative z-10 bg-white/20 backdrop-blur-sm p-4 rounded-xl shadow-inner border border-white/20">
                 <IconBook className="w-12 h-12 text-white" />
               </div>
            </div>

            <div className="p-6 flex flex-col flex-1">
              <div className="mb-4">
                 <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wide">
                   {book.category}
                 </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{book.title}</h3>
              <p className="text-sm text-gray-500 font-medium mb-1">{book.author}</p>
              <p className="text-xs text-gray-400 mb-6">{book.edition}</p>

              <div className="mt-auto">
                <button 
                  onClick={() => handleDownload(book.id, book.fileName)}
                  disabled={loadingBookId === book.id}
                  className={`w-full py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 
                    ${loadingBookId === book.id 
                      ? 'bg-gray-100 text-gray-400 cursor-wait' 
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-800 hover:text-white group-hover:bg-blue-600 group-hover:text-white'
                    }`}
                >
                  {loadingBookId === book.id ? (
                    <span className="flex items-center gap-2">
                       <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></span>
                       Carregando...
                    </span>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 12L12 16L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M20 20H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Baixar PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredBooks.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-400">
            Nenhum livro encontrado para sua busca.
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryView;