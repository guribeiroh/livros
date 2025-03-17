'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AiOutlineMinus, AiOutlinePlus, AiOutlineShoppingCart, AiFillStar, AiOutlineStar, AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { BiShareAlt, BiBookmark, BiChat } from 'react-icons/bi';
import { FaShippingFast } from 'react-icons/fa';
import BookCard from '@/app/components/BookCard';
import Button from '@/app/components/Button';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import useCart from '@/app/hooks/useCart';

// Definição do tipo do livro baseado no banco de dados Supabase
interface BookType {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  original_price: number | null;
  isbn: string;
  publication_year: number;
  pages: number;
  stock: number;
  cover_image: string;
  category_id: string;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new: boolean;
  is_active: boolean;
  slug: string;
  publisher: string;
  language: string;
  format: string;
  category_name?: string;
  category_slug?: string;
}

export default function ProdutoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { addItem } = useCart();
  const { id } = params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [book, setBook] = useState<BookType | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [tabAtiva, setTabAtiva] = useState('descricao');
  const [livrosRelacionados, setLivrosRelacionados] = useState<BookType[]>([]);
  const [isFavorito, setIsFavorito] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState([
    { id: 1, autor: 'Ana Silva', data: '10/03/2023', rating: 5, comentario: 'Excelente livro! A narrativa é envolvente e os personagens são muito bem desenvolvidos.' },
    { id: 2, autor: 'Carlos Mendes', data: '05/03/2023', rating: 4, comentario: 'Gostei muito da história. Recomendo para quem gosta desse gênero.' }
  ]);
  
  // Função para redirecionar para página 404 quando o livro não for encontrado
  const redirectToNotFound = useCallback(() => {
    toast.error('Livro não encontrado');
    router.push('/404');
  }, [router]);
  
  const fetchLivro = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/books/${id}`);
      
      if (!response.ok) {
        // Se a resposta for 404, redirecionar para página não encontrada
        if (response.status === 404) {
          redirectToNotFound();
          return;
        }
        throw new Error(`Erro ao buscar detalhes do livro: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dados originais do livro:', data);
      
      // Verificar se temos dados válidos (se o livro existe)
      if (!data || !data.id && !data.data?.id) {
        redirectToNotFound();
        return;
      }
      
      // Se a API retorna um objeto com propriedade 'data', use-o, caso contrário use o objeto diretamente
      const bookData = data.data || data;
      
      // Normalizar a imagem (pode estar em base64 ou url)
      const normalizeImageUrl = (imageData: string | null | undefined): string => {
        if (!imageData) return 'https://via.placeholder.com/300x400?text=Sem+Imagem';
        
        // Se for uma URL, retornar diretamente
        if (imageData.startsWith('http') || imageData.startsWith('https')) {
          return imageData;
        }
        
        // Se for base64 ou outra forma, retornar como está
        // O Next.js Image component vai lidar com isso
        return imageData;
      };
      
      // Verificar e normalizar os dados
      const normalizedBook: BookType = {
        id: bookData.id || id,
        title: bookData.title || 'Título não disponível',
        author: bookData.author || 'Autor desconhecido',
        description: bookData.description || 'Sem descrição disponível',
        price: typeof bookData.price === 'number' ? bookData.price : 0,
        original_price: typeof bookData.original_price === 'number' ? bookData.original_price : null,
        cover_image: normalizeImageUrl(bookData.cover_image),
        isbn: bookData.isbn || 'N/A',
        publication_year: bookData.publication_year || 0,
        pages: bookData.pages || 0,
        stock: typeof bookData.stock === 'number' ? bookData.stock : 0,
        is_featured: Boolean(bookData.is_featured),
        is_bestseller: Boolean(bookData.is_bestseller),
        is_new: Boolean(bookData.is_new),
        is_active: Boolean(bookData.is_active),
        slug: bookData.slug || '',
        publisher: bookData.publisher || 'N/A',
        language: bookData.language || 'Português',
        format: bookData.format || 'Capa Comum',
        category_id: bookData.category_id || (bookData.category?.id || ''),
        category_name: bookData.category_name || (bookData.category?.name || 'Geral'),
        category_slug: bookData.category_slug || (bookData.category?.slug || '')
      };
      
      setBook(normalizedBook);
      console.log('Dados do livro normalizados:', normalizedBook);
      
      // Buscar livros relacionados da mesma categoria
      if (normalizedBook.category_id) {
        try {
          const relatedResponse = await fetch(`/api/books?category=${normalizedBook.category_id}&limit=4`);
          if (relatedResponse.ok) {
            const relatedData = await relatedResponse.json();
            let relacionados = [];
            
            // Verificar o formato da resposta e adaptar conforme necessário
            if (Array.isArray(relatedData)) {
              relacionados = relatedData;
            } else if (relatedData.books && Array.isArray(relatedData.books)) {
              relacionados = relatedData.books;
            } else if (relatedData.data && Array.isArray(relatedData.data)) {
              relacionados = relatedData.data;
            } else {
              // Tentar outros campos possíveis
              Object.keys(relatedData).forEach(key => {
                if (Array.isArray(relatedData[key])) {
                  relacionados = relatedData[key];
                }
              });
            }
            
            // Normalizar os dados dos livros relacionados e remover o livro atual
            const filteredRelated = relacionados
              .filter((livro: any) => livro.id !== normalizedBook.id)
              .map((livro: any) => {
                // Normalizando a categoria dos livros relacionados
                const category_id = livro.category_id || (livro.category?.id || '');
                const category_name = livro.category_name || (livro.category?.name || 'Geral');
                const category_slug = livro.category_slug || (livro.category?.slug || '');
                  
                return {
                  id: livro.id,
                  title: livro.title || 'Sem título',
                  author: livro.author || 'Autor desconhecido',
                  price: typeof livro.price === 'number' ? livro.price : 0,
                  original_price: typeof livro.original_price === 'number' ? livro.original_price : null,
                  cover_image: normalizeImageUrl(livro.cover_image),
                  isbn: livro.isbn || 'N/A',
                  publication_year: livro.publication_year || 0,
                  pages: livro.pages || 0,
                  stock: typeof livro.stock === 'number' ? livro.stock : 0,
                  category_id: category_id,
                  category_name: category_name,
                  category_slug: category_slug,
                  is_featured: Boolean(livro.is_featured),
                  is_bestseller: Boolean(livro.is_bestseller),
                  is_new: Boolean(livro.is_new),
                  is_active: Boolean(livro.is_active),
                  slug: livro.slug || '',
                  publisher: livro.publisher || 'N/A',
                  language: livro.language || 'Português',
                  format: livro.format || 'Capa Comum'
               };
              });
            
            setLivrosRelacionados(filteredRelated.slice(0, 4));
          }
        } catch (relatedErr) {
          console.error('Erro ao buscar livros relacionados:', relatedErr);
          // Não queremos que um erro nos livros relacionados impeça a exibição do livro principal
          setLivrosRelacionados([]);
        }
      }
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar os detalhes do livro');
      console.error('Erro ao buscar detalhes do livro:', err);
    } finally {
      setLoading(false);
    }
  }, [id, redirectToNotFound]);
  
  useEffect(() => {
    fetchLivro();
  }, [fetchLivro]);
  
  const aumentarQuantidade = () => {
    const maxStock = book?.stock || 10;
    if (quantidade < maxStock) {
      setQuantidade(quantidade + 1);
    } else {
      toast.error(`Apenas ${maxStock} unidade(s) disponível(is)`);
    }
  };
  
  const diminuirQuantidade = () => {
    if (quantidade > 1) {
      setQuantidade(quantidade - 1);
    }
  };
  
  const adicionarAoCarrinho = () => {
    if (book) {
      addItem({
        id: book.id,
        titulo: book.title,
        autor: book.author,
        preco: book.price || 0,
        imagemUrl: book.cover_image || '/images/book-placeholder.jpg',
        quantidade
      });
    }
  };
  
  const compartilharProduto = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: book?.title || 'Livro',
          text: `Confira este livro: ${book?.title || 'Livro interessante'} por ${book?.author || 'Autor'}`,
          url: window.location.href
        });
      } catch (err) {
        toast.error('Erro ao compartilhar');
      }
    } else {
      // Fallback para navegadores que não suportam a Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiado para a área de transferência!');
    }
  };
  
  const toggleFavorito = () => {
    setIsFavorito(!isFavorito);
    if (!isFavorito) {
      toast.success('Adicionado aos favoritos!');
    } else {
      toast.success('Removido dos favoritos!');
    }
  };
  
  // Calcular avaliação média
  const mediaAvaliacoes = avaliacoes.reduce((acc, curr) => acc + curr.rating, 0) / avaliacoes.length;
  
  // Efeito de animação para itens entrando na tela
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };
  
  if (loading) {
    return (
      <main className="min-h-screen py-16 px-4 flex justify-center items-center bg-white">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <div className="w-48 h-6 bg-primary-200 rounded-md mx-auto mb-3"></div>
            <div className="w-64 h-4 bg-primary-100 rounded-md mx-auto"></div>
          </div>
          <p className="text-primary-500">Carregando detalhes do livro...</p>
        </div>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className="min-h-screen py-16 px-4 flex justify-center items-center bg-white">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Algo deu errado</h2>
          <p className="text-primary-700 mb-6">{error || 'Não foi possível carregar os detalhes do livro.'}</p>
          <Button onClick={() => router.push('/')} className="mx-auto">
            Voltar para a página inicial
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-primary-50 py-2 md:py-4">
        <div className="container mx-auto px-4">
          <nav className="text-xs md:text-sm text-primary-600 overflow-x-auto whitespace-nowrap py-1">
            <ol className="flex items-center space-x-2">
              <li>
          <Link href="/" className="hover:text-primary-800 transition-colors">
            Início
          </Link>
              </li>
              <li className="flex items-center space-x-2">
                <span>/</span>
                <Link 
                  href={`/categoria/${book.category_slug || book.category_id}`} 
                  className="hover:text-primary-800 transition-colors"
                >
                  {book.category_name || 'Categoria'}
          </Link>
              </li>
              <li className="flex items-center space-x-2">
                <span>/</span>
                <span className="text-primary-400 truncate max-w-[150px]">{book.title}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="container mx-auto px-3 md:px-4 py-4 md:py-8"
      >
        {/* Mobile: Primeiro a imagem, depois os detalhes */}
        <div className="block md:hidden mb-8">
          <motion.div 
            variants={itemVariants} 
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="relative w-full max-w-[280px] aspect-[5/8] overflow-hidden transition-all duration-300">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={book.cover_image || 'https://via.placeholder.com/625x998?text=Sem+Imagem'}
                  alt={`Capa do livro ${book.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain hover:scale-105 transition-transform duration-300"
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFLgJ2e1BRWAAAAABJRU5ErkJggg=="
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/625x998?text=Sem+Imagem';
                  }}
                />
              </div>
              {book.is_new && (
                <div className="absolute top-2 left-2 bg-primary-600 text-white px-2 py-0.5 rounded-full text-xs font-medium z-10">
                  Novo
                </div>
              )}
              {book.is_bestseller && (
                <div className="absolute top-10 left-2 bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-medium z-10">
                  Mais Vendido
                </div>
              )}
              <button 
                onClick={toggleFavorito}
                className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow-md hover:shadow-lg transition-all z-10"
                aria-label={isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                {isFavorito ? (
                  <AiFillHeart className="text-red-500 text-lg" />
                ) : (
                  <AiOutlineHeart className="text-primary-700 text-lg" />
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Layout principal responsivo */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-8 gap-0 md:gap-8 mb-10 md:mb-16">
          {/* Imagem do Livro - visível apenas em desktop */}
          <motion.div 
            variants={itemVariants} 
            className="hidden md:flex md:justify-end md:col-span-3 md:pr-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="relative w-full md:w-11/12 max-w-[340px] aspect-[5/8] overflow-hidden transform hover:-translate-y-1 transition-all duration-300">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={book.cover_image || 'https://via.placeholder.com/625x998?text=Sem+Imagem'}
                  alt={`Capa do livro ${book.title}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain hover:scale-105 transition-transform duration-300"
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFLgJ2e1BRWAAAAABJRU5ErkJggg=="
                  onError={(e) => {
                    // Fallback para imagem padrão se a carga falhar
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/625x998?text=Sem+Imagem';
                  }}
                />
              </div>
              {book.is_new && (
                <div className="absolute top-4 left-4 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
                  Novo
                </div>
              )}
              {book.is_bestseller && (
                <div className="absolute top-14 left-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
                  Mais Vendido
                </div>
              )}
              <button 
                onClick={toggleFavorito}
                className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-all z-10"
                aria-label={isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              >
                {isFavorito ? (
                  <AiFillHeart className="text-red-500 text-xl" />
                ) : (
                  <AiOutlineHeart className="text-primary-700 text-xl" />
                )}
              </button>
              </div>
          </motion.div>
          
          {/* Detalhes do Livro */}
          <motion.div variants={itemVariants} className="flex flex-col md:col-span-5 md:pl-0 md:pr-0">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${book.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {book.stock > 0 ? `Em estoque (${book.stock})` : 'Fora de estoque'}
              </span>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-yellow-100 text-yellow-800">
                {book.category_name || 'Geral'}
              </span>
              {book.is_new && (
                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-primary-100 text-primary-800">
                  Lançamento
                </span>
              )}
            </div>
            
            <h1 className="text-xl md:text-3xl font-display font-bold text-primary-900 mb-2">
              {book.title}
            </h1>
            
            <p className="text-sm md:text-lg text-primary-700 mb-4">
              por <span className="font-medium">{book.author}</span>
            </p>
            
            <div className="flex items-center mb-4 md:mb-6">
              <div className="flex mr-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star}>
                    {star <= Math.round(mediaAvaliacoes) ? (
                      <AiFillStar className="text-yellow-400 text-base md:text-lg" />
                    ) : (
                      <AiOutlineStar className="text-yellow-400 text-base md:text-lg" />
                    )}
                  </span>
                ))}
              </div>
              <span className="text-xs md:text-sm text-primary-600">
                ({avaliacoes.length} {avaliacoes.length === 1 ? 'avaliação' : 'avaliações'})
              </span>
            </div>
            
            <div className="mb-4 md:mb-6">
              <div className="flex items-center mb-2">
                <p className="text-2xl md:text-3xl font-bold text-primary-900">
                  R$ {book.price.toFixed(2).replace('.', ',')}
                </p>
                {book.original_price && book.original_price > book.price && (
                  <p className="ml-3 text-lg text-primary-500 line-through">
                    R$ {book.original_price.toFixed(2).replace('.', ',')}
                  </p>
                )}
              </div>

                  {book.original_price && book.original_price > book.price && (
                <p className="text-green-600 font-medium text-sm">
                  Economize R$ {(book.original_price - book.price).toFixed(2).replace('.', ',')} ({Math.round((1 - book.price / book.original_price) * 100)}%)
                </p>
                  )}
                </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center mb-6 bg-gradient-to-r from-primary-50 to-blue-50 py-3 px-4 md:px-4 rounded-lg border border-primary-100 shadow-sm"
            >
              <div className="bg-white p-2 rounded-full mr-3 shadow-sm">
                <FaShippingFast className="text-primary-600 text-lg" />
              </div>
              <div>
                <p className="font-semibold text-sm md:text-base text-primary-800">
                  Frete fixo <span className="text-primary-900">R$ 4,99</span> para todo o Brasil
                </p>
                <p className="text-xs text-primary-600">Receba direto em sua casa</p>
              </div>
            </motion.div>
            
            <div className="flex flex-col space-y-4 mb-6">
              <div className="flex items-center justify-center sm:justify-start">
                <button
                  onClick={diminuirQuantidade}
                  className="bg-primary-100 hover:bg-primary-200 text-primary-800 p-3 rounded-l-md transition-colors"
                  aria-label="Diminuir quantidade"
                  disabled={book.stock <= 0}
                >
                  <AiOutlineMinus />
                </button>
                <span className="bg-white border-y border-primary-200 px-8 py-3 text-center text-primary-800">
                  {quantidade}
                </span>
                <button 
                  onClick={aumentarQuantidade}
                  className="bg-primary-100 hover:bg-primary-200 text-primary-800 p-3 rounded-r-md transition-colors"
                  aria-label="Aumentar quantidade"
                  disabled={book.stock <= 0}
                >
                  <AiOutlinePlus />
                </button>
              </div>

              <Button 
                onClick={adicionarAoCarrinho} 
                variant="primary" 
                size="lg" 
                fullWidth 
                leftIcon={<AiOutlineShoppingCart className="text-xl mr-2" />}
                disabled={book.stock <= 0 || loading}
                className="py-3.5"
              >
                {loading ? 'Carregando...' : book.stock > 0 ? 'Adicionar ao carrinho' : 'Indisponível'}
              </Button>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={compartilharProduto} 
                  variant="outline" 
                  className="py-3"
                  leftIcon={<BiShareAlt className="text-lg" />}
                  aria-label="Compartilhar produto"
                >
                  Compartilhar
                </Button>
                
                  <Button
                  onClick={toggleFavorito} 
                  variant="outline" 
                  className="py-3"
                  leftIcon={isFavorito ? <AiFillHeart className="text-red-500 text-lg" /> : <AiOutlineHeart className="text-lg" />}
                  aria-label={isFavorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  {isFavorito ? 'Salvo' : 'Salvar'}
                  </Button>
                </div>
            </div>
            
            <div className="bg-primary-50 rounded-lg py-4 px-4 md:px-4 flex flex-col space-y-2 mb-6 md:mb-0">
              <p className="text-primary-800 text-sm">
                <span className="font-medium">ISBN:</span> {book.isbn}
              </p>
              <p className="text-primary-800 text-sm">
                <span className="font-medium">Editora:</span> {book.publisher}
              </p>
              <p className="text-primary-800 text-sm">
                <span className="font-medium">Ano de publicação:</span> {book.publication_year}
              </p>
          </div>
          </motion.div>
        </div>

        {/* Tabs com descrição e detalhes */}
        <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-md overflow-hidden mb-16">
          <div className="border-b border-primary-100">
            <div className="container flex overflow-x-auto">
              <button
                onClick={() => setTabAtiva('descricao')}
                className={`py-4 px-6 font-medium text-sm focus:outline-none whitespace-nowrap transition-colors ${
                  tabAtiva === 'descricao' 
                    ? 'text-primary-800 border-b-2 border-primary-600' 
                    : 'text-primary-500 hover:text-primary-700'
                }`}
              >
                Descrição
              </button>
              <button
                onClick={() => setTabAtiva('detalhes')}
                className={`py-4 px-6 font-medium text-sm focus:outline-none whitespace-nowrap transition-colors ${
                  tabAtiva === 'detalhes' 
                    ? 'text-primary-800 border-b-2 border-primary-600' 
                    : 'text-primary-500 hover:text-primary-700'
                }`}
              >
                Detalhes do livro
              </button>
              <button
                onClick={() => setTabAtiva('avaliacoes')}
                className={`py-4 px-6 font-medium text-sm focus:outline-none whitespace-nowrap transition-colors ${
                  tabAtiva === 'avaliacoes' 
                    ? 'text-primary-800 border-b-2 border-primary-600' 
                    : 'text-primary-500 hover:text-primary-700'
                }`}
              >
                Avaliações ({avaliacoes.length})
              </button>
            </div>
          </div>
          <div className="p-8">
            {tabAtiva === 'descricao' && (
              <div className="prose prose-primary max-w-none">
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-primary-700 whitespace-pre-line"
                >
                  {book.description}
                </motion.p>
              </div>
            )}
            {tabAtiva === 'detalhes' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div>
                  <h3 className="font-semibold text-lg text-primary-800 mb-3">Informações do Livro</h3>
                  <table className="w-full text-sm text-primary-700">
                    <tbody>
                      <tr className="border-b border-primary-100">
                        <td className="py-2 font-medium">Título</td>
                        <td className="py-2">{book.title}</td>
                      </tr>
                      <tr className="border-b border-primary-100">
                        <td className="py-2 font-medium">Autor</td>
                        <td className="py-2">{book.author}</td>
                      </tr>
                      <tr className="border-b border-primary-100">
                        <td className="py-2 font-medium">Categoria</td>
                        <td className="py-2">{book.category_name}</td>
                      </tr>
                      <tr className="border-b border-primary-100">
                        <td className="py-2 font-medium">Ano de Publicação</td>
                        <td className="py-2">{book.publication_year}</td>
                      </tr>
                      <tr className="border-b border-primary-100">
                        <td className="py-2 font-medium">Páginas</td>
                        <td className="py-2">{book.pages}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">ISBN</td>
                        <td className="py-2">{book.isbn}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-primary-800 mb-3">Especificações</h3>
                  <table className="w-full text-sm text-primary-700">
                    <tbody>
                      <tr className="border-b border-primary-100">
                        <td className="py-2 font-medium">Idioma</td>
                        <td className="py-2">{book.language}</td>
                      </tr>
                      <tr className="border-b border-primary-100">
                        <td className="py-2 font-medium">Formato</td>
                        <td className="py-2">{book.format}</td>
                      </tr>
                      <tr className="border-b border-primary-100">
                        <td className="py-2 font-medium">Editora</td>
                        <td className="py-2">{book.publisher}</td>
                      </tr>
                      <tr className="border-b border-primary-100">
                        <td className="py-2 font-medium">Disponibilidade</td>
                        <td className="py-2">{book.stock > 0 ? `${book.stock} em estoque` : 'Fora de estoque'}</td>
                      </tr>
                      <tr className="border-b border-primary-100">
                        <td className="py-2 font-medium">Destaque</td>
                        <td className="py-2">{book.is_featured ? 'Sim' : 'Não'}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">Best-seller</td>
                        <td className="py-2">{book.is_bestseller ? 'Sim' : 'Não'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
            {tabAtiva === 'avaliacoes' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-lg text-primary-800">Avaliações dos Clientes</h3>
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-primary-900 mr-2">{mediaAvaliacoes.toFixed(1)}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>
                          {star <= Math.round(mediaAvaliacoes) ? (
                            <AiFillStar className="text-yellow-400" />
                          ) : (
                            <AiOutlineStar className="text-yellow-400" />
                          )}
                        </span>
                      ))}
                    </div>
          </div>
        </div>
                
                {avaliacoes.map((avaliacao) => (
                  <div key={avaliacao.id} className="mb-6 pb-6 border-b border-primary-100 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-primary-800">{avaliacao.autor}</h4>
                        <p className="text-sm text-primary-500">{avaliacao.data}</p>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star}>
                            {star <= avaliacao.rating ? (
                              <AiFillStar className="text-yellow-400" />
                            ) : (
                              <AiOutlineStar className="text-yellow-400" />
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-primary-700">{avaliacao.comentario}</p>
                  </div>
                ))}
                
                <div className="mt-8 text-center">
                  <Button 
                    variant="outline"
                    leftIcon={<BiChat className="text-lg mr-2" />}
                  >
                    Escrever uma avaliação
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Livros relacionados */}
        {livrosRelacionados.length > 0 && (
          <motion.section 
            variants={itemVariants} 
            className="container mx-auto px-4 pt-8 pb-16"
          >
          <h2 className="text-2xl font-display font-bold text-primary-800 mb-6">Livros relacionados</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-6">
            {livrosRelacionados.map((livroRelacionado, index) => (
                <motion.div 
                  key={livroRelacionado.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {typeof BookCard === 'function' ? (
                    <BookCard book={livroRelacionado} index={index} />
                  ) : (
                    <Link href={`/produto/${livroRelacionado.id}`}>
                      <div className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="relative aspect-[5/8]">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Image
                              src={livroRelacionado.cover_image || 'https://via.placeholder.com/625x998?text=Sem+Imagem'}
                              alt={livroRelacionado.title || 'Livro relacionado'}
                              fill
                              sizes="(max-width: 768px) 100vw, 25vw"
                              className="object-contain group-hover:scale-105 transition-transform duration-300"
                              placeholder="blur"
                              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFLgJ2e1BRWAAAAABJRU5ErkJggg=="
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://via.placeholder.com/625x998?text=Sem+Imagem';
                              }}
                            />
                          </div>
                          {livroRelacionado.is_new && (
                            <div className="absolute top-2 left-2 bg-primary-600 text-white px-2 py-0.5 rounded-full text-[10px] font-medium z-10">
                              Novo
                            </div>
                          )}
                          {livroRelacionado.is_bestseller && (
                            <div className="absolute top-8 left-2 bg-amber-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium z-10">
                              Mais Vendido
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="text-sm font-medium text-primary-800 line-clamp-2 group-hover:text-primary-600 transition-colors">
                            {livroRelacionado.title}
                          </h3>
                          <p className="text-xs text-primary-600 mt-1">
                            {livroRelacionado.author}
                          </p>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-primary-800 font-bold">
                              R$ {livroRelacionado.price ? livroRelacionado.price.toFixed(2).replace('.', ',') : '0,00'}
                            </span>
                            {livroRelacionado.original_price && livroRelacionado.original_price > livroRelacionado.price && (
                              <span className="text-xs text-primary-400 line-through">
                                R$ {livroRelacionado.original_price.toFixed(2).replace('.', ',')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )}
                </motion.div>
            ))}
          </div>
          </motion.section>
        )}
      </motion.div>
    </main>
  );
} 