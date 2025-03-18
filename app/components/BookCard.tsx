'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Book } from '../lib/supabase';
import { useCarrinho } from '../context/CarrinhoContext';
import Badge from './Badge';
import Button from './Button';

interface BookCardProps {
  book: any; // Alterando para any para aceitar diferentes formatos de livros
  index?: number;
}

export default function BookCard({ book, index = 0 }: BookCardProps) {
  const { adicionarItem } = useCarrinho();
  const [isHovered, setIsHovered] = useState(false);
  const [botaoAnimado, setBotaoAnimado] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  // Atraso de animação baseado no índice
  const animationDelay = `${index * 100}ms`;
  
  // Adaptar o livro para o formato esperado pelo carrinho
  const handleAdicionarAoCarrinho = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    
    // Converter Book para o formato que o carrinho espera
    const livroAdaptado = {
      id: book.id,
      titulo: book.title,
      autor: book.author || book.autor,
      descricao: book.description || '',
      preco: typeof book.price === 'number' ? book.price : 0,
      precoOriginal: book.original_price || undefined,
      imagemUrl: book.cover_image || book.cover_url || book.imageUrl || '',
      disponivel: book.in_stock || (book.stock !== undefined && book.stock !== null && book.stock > 0) ? true : false,
      categoria: book.category?.name || '',
      paginas: book.pages || 0,
      isbn: book.isbn || '',
      anoPublicacao: book.publication_year || book.year || new Date().getFullYear(),
      slug: book.slug || book.id
    };
    
    adicionarItem(livroAdaptado);
    
    // Ativar animação do botão
    setBotaoAnimado(true);
    setTimeout(() => {
      setBotaoAnimado(false);
    }, 600);
  };
  
  // Normalizar links e propriedades
  const bookSlug = book.slug || book.id;
  const bookCover = book.cover_image || book.cover_url || book.imageUrl || 'https://via.placeholder.com/300x400?text=Sem+Imagem';
  const bookTitle = book.title || "Livro";
  const bookAuthor = book.author || book.autor || "Autor desconhecido";
  const bookCategory = book.category?.name || 'Sem categoria';
  const bookPages = book.pages || 0;
  
  // Verificar se o livro está disponível
  const isAvailable = book.in_stock || (book.stock !== undefined && book.stock !== null && book.stock > 0);
  
  // Verificar se tem preço original maior
  const hasDiscount = book.original_price && 
                     typeof book.original_price === 'number' && 
                     typeof book.price === 'number' && 
                     book.original_price > book.price;
  
  const discountPercentage = hasDiscount 
    ? Math.round((1 - book.price / book.original_price) * 100) 
    : 0;
  
  return (
    <div 
      className="book-card-hover group animate-fade-in bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
      style={{ animationDelay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Ribbon de desconto */}
        {hasDiscount && discountPercentage > 0 && (
          <div className="absolute top-0 right-0 z-10 bg-gradient-to-r from-accent-500 to-primary-500 text-white text-xs font-bold py-1.5 px-3 rounded-bl-lg shadow-md">
            {discountPercentage}% OFF
          </div>
        )}
        
        <Link href={`/produto/${bookSlug}`} className="block">
          <div className="relative aspect-[5/8] w-full bg-primary-50 overflow-hidden">
            {!imgError ? (
              <Image 
                src={bookCover}
                alt={bookTitle}
                fill
                style={{ objectFit: 'contain' }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={`transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
                onError={() => setImgError(true)}
              />
            ) : (
              <Image 
                src="https://via.placeholder.com/300x400?text=Sem+Imagem"
                alt={bookTitle}
                fill
                style={{ objectFit: 'contain' }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="p-4"
              />
            )}
            
            {/* Overlay de hover */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white text-primary-800 font-medium py-2 px-6 rounded-full transform transition-all duration-300 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 shadow-md">
                  Ver detalhes
                </span>
              </div>
            </div>
          </div>
        </Link>
        
        {/* Indicador de disponibilidade */}
        <div className="absolute top-3 left-3">
          {isAvailable ? (
            <Badge variant="success" size="sm" rounded className="shadow-sm">Em estoque</Badge>
          ) : (
            <Badge variant="error" size="sm" rounded className="shadow-sm">Indisponível</Badge>
          )}
        </div>
        
        {/* Bestseller tag */}
        {book.is_bestseller && (
          <div className="absolute top-3 right-3">
            <span className="bg-yellow-500 text-white text-xs font-bold py-1 px-2 rounded-md shadow-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Bestseller
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="mb-2">
          <p className="text-xs text-primary-500 font-medium uppercase tracking-wider">{bookCategory}</p>
        </div>
        
        <Link href={`/produto/${bookSlug}`} className="block group">
          <h3 className="font-semibold text-lg text-primary-800 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {bookTitle}
          </h3>
        </Link>
        
        <p className="text-sm text-primary-600 mb-4 italic">{bookAuthor}</p>
        
        <div className="flex flex-wrap items-center justify-between mt-auto pt-3 border-t border-primary-100">
          <div>
            <div className="flex items-baseline">
              {hasDiscount && (
                <span className="bg-accent-50 text-accent-800 text-xs font-semibold px-1.5 py-0.5 rounded mr-2">
                  -{discountPercentage}%
                </span>
              )}
              <span className="text-xl font-bold text-primary-800">
                R${typeof book.price === 'number' ? book.price.toFixed(2).replace('.', ',') : '0,00'}
              </span>
              {hasDiscount && (
                <span className="text-sm text-primary-400 line-through ml-2">
                  R${book.original_price.toFixed(2).replace('.', ',')}
                </span>
              )}
            </div>
            <div className="text-xs text-primary-400 mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {bookPages} páginas
            </div>
          </div>
          
          <Button
            variant="primary" 
            size="sm"
            onClick={handleAdicionarAoCarrinho}
            disabled={!isAvailable}
            className={`rounded-full shadow-md hover:shadow-lg ${botaoAnimado ? 'animate-cart-pulse' : ''}`}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            }
          >
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
} 