'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useBookSearch, useBooks } from '../hooks/useBooks';
import { Book } from '../lib/supabase';
import BookCard from '../components/BookCard';
import Button from '../components/Button';
import { Skeleton } from '../components/ui/Skeleton';

export default function BuscaPage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get('q');
  const categoriaParam = searchParams.get('categoria');
  const filterParam = searchParams.get('filter');
  
  const [searchQuery, setSearchQuery] = useState(queryParam || '');
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(categoriaParam);
  const [filtroAutor, setFiltroAutor] = useState<string | null>(null);
  const [filtroPrecoMin, setFiltroPrecoMin] = useState<number | null>(null);
  const [filtroPrecoMax, setFiltroPrecoMax] = useState<number | null>(null);
  const [busca, setBusca] = useState(queryParam || '');
  const [ordenacao, setOrdenacao] = useState<'recentes' | 'populares' | 'precoAsc' | 'precoDesc'>('recentes');
  const [categorias, setCategorias] = useState<{ name: string; slug: string }[]>([]);
  const [autores, setAutores] = useState<string[]>([]);
  
  // Usar hook de busca para livros
  const { books: resultadosBusca, isLoading: isLoadingBusca } = 
    useBookSearch(searchQuery);
  
  // Buscar categorias para filtros
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategorias(data.data);
        }
      })
      .catch(err => console.error('Erro ao buscar categorias:', err));
      
    // Buscar autores únicos
    fetch('/api/authors')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAutores(data.data);
        }
      })
      .catch(err => console.error('Erro ao buscar autores:', err));
    
    // Configurar os filtros com base nos parâmetros da URL
    if (filterParam === 'lancamentos') {
      setOrdenacao('recentes');
    } else if (filterParam === 'promocoes') {
      setOrdenacao('precoAsc');
    }
  }, [filterParam]);
  
  // Filtrar e ordenar livros com base nos critérios
  const livrosFiltrados = resultadosBusca
    .filter(livro => {
      // Filtrar por categoria se definida
      if (filtroCategoria && livro.category?.slug !== filtroCategoria) {
        return false;
      }
      
      // Filtrar por autor se definido
      if (filtroAutor && livro.author !== filtroAutor) {
        return false;
      }
      
      // Filtrar por preço mínimo
      if (filtroPrecoMin !== null && livro.price < filtroPrecoMin) {
        return false;
      }
      
      // Filtrar por preço máximo
      if (filtroPrecoMax !== null && livro.price > filtroPrecoMax) {
        return false;
      }
      
      // Filtro de lançamentos (últimos 30 dias)
      if (filterParam === 'lancamentos') {
        const trinta_dias_atras = new Date();
        trinta_dias_atras.setDate(trinta_dias_atras.getDate() - 30);
        
        const created_date = livro.created_at ? new Date(livro.created_at) : null;
        if (!created_date || created_date < trinta_dias_atras) {
          return false;
        }
      }
      
      // Filtro de promoções (livros com desconto)
      if (filterParam === 'promocoes') {
        if (!livro.original_price || livro.original_price <= livro.price) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      // Ordenar com base na seleção
      switch (ordenacao) {
        case 'recentes':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'populares':
          return (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0);
        case 'precoAsc':
          return a.price - b.price;
        case 'precoDesc':
          return b.price - a.price;
        default:
          return 0;
      }
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(busca);
  };
  
  const limparFiltros = () => {
    setFiltroCategoria(null);
    setFiltroAutor(null);
    setFiltroPrecoMin(null);
    setFiltroPrecoMax(null);
    setOrdenacao('recentes');
  };
  
  // Função para obter o título da página com base no filtro atual
  const getTituloPagina = () => {
    if (filterParam === 'lancamentos') {
      return 'Lançamentos';
    } else if (filterParam === 'promocoes') {
      return 'Promoções';
    } else if (searchQuery) {
      return `Resultados para "${searchQuery}"`;
    } else {
      return 'Todos os Livros';
    }
  };
  
  return (
    <main className="bg-primary-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-primary-800 mb-8">{getTituloPagina()}</h1>
        
        {/* Filtros - Seção superior */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-primary-100 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-primary-800 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
            </h2>
            <Button 
              variant="text" 
              onClick={limparFiltros} 
              className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Limpar filtros
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Busca */}
            <div className="md:col-span-4">
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por título, autor, ISBN..."
                    className="w-full pl-10 pr-12 md:pr-24 py-3 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-primary-800 bg-primary-50/30"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white md:px-5 md:py-2 p-1.5 rounded-lg transition-all duration-200 flex items-center md:space-x-2 shadow-sm hover:shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="hidden md:inline font-medium">Buscar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            {/* Categorias */}
            <div>
              <label htmlFor="categoria-select" className="font-medium text-primary-700 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Categorias
              </label>
              <div className="relative">
                <select
                  id="categoria-select"
                  value={filtroCategoria || ''}
                  onChange={(e) => setFiltroCategoria(e.target.value || null)}
                  className="w-full px-3 py-2.5 appearance-none border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-primary-800 pr-10"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.slug} value={categoria.slug}>
                      {categoria.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-500 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Autores */}
            <div>
              <label htmlFor="autor-select" className="font-medium text-primary-700 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Autores
              </label>
              <div className="relative">
                <select
                  id="autor-select"
                  value={filtroAutor || ''}
                  onChange={(e) => setFiltroAutor(e.target.value || null)}
                  className="w-full px-3 py-2.5 appearance-none border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-primary-800 pr-10"
                >
                  <option value="">Todos os autores</option>
                  {autores.map((autor) => (
                    <option key={autor} value={autor}>
                      {autor}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-500 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Ordenação */}
            <div>
              <label htmlFor="ordenacao-select" className="font-medium text-primary-700 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Ordenar por
              </label>
              <div className="relative">
                <select
                  id="ordenacao-select"
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value as any)}
                  className="w-full px-3 py-2.5 appearance-none border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-primary-800 pr-10"
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="populares">Mais populares</option>
                  <option value="precoAsc">Menor preço</option>
                  <option value="precoDesc">Maior preço</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-500 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Faixa de Preço */}
            <div>
              <label className="font-medium text-primary-700 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Faixa de Preço
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    id="preco-min"
                    min="0"
                    step="0.01"
                    placeholder="Mínimo"
                    value={filtroPrecoMin || ''}
                    onChange={(e) => setFiltroPrecoMin(e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2.5 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-primary-800 pl-8"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500">
                    <span className="text-sm font-medium">R$</span>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    id="preco-max"
                    min="0"
                    step="0.01"
                    placeholder="Máximo"
                    value={filtroPrecoMax || ''}
                    onChange={(e) => setFiltroPrecoMax(e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-3 py-2.5 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-primary-800 pl-8"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500">
                    <span className="text-sm font-medium">R$</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
          
        {/* Resultados */}
        <div>
          <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-primary-800">
                {isLoadingBusca 
                  ? 'Buscando livros...' 
                  : `${livrosFiltrados.length} ${livrosFiltrados.length === 1 ? 'resultado' : 'resultados'} encontrados`
                }
              </h2>
            </div>
          </div>
          
          {isLoadingBusca ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm">
                  <Skeleton className="w-full h-64" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : livrosFiltrados.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {livrosFiltrados.map((livro, index) => (
                <BookCard 
                  key={livro.id} 
                  book={livro}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-xl shadow-sm text-center">
              <div className="flex justify-center mb-4">
                <Image 
                  src="/images/empty-results.svg" 
                  alt="Nenhum resultado" 
                  width={150} 
                  height={150} 
                />
              </div>
              <h3 className="text-xl font-bold text-primary-800 mb-2">Nenhum livro encontrado</h3>
              <p className="text-primary-600 mb-6">
                Não encontramos livros que correspondam aos seus critérios de busca.
              </p>
              <Button onClick={limparFiltros}>Limpar filtros</Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 