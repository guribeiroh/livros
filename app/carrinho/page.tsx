'use client';

import { useCarrinho } from '../context/CarrinhoContext';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function CarrinhoPage() {
  const { carrinho, removerItem, atualizarQuantidade, limparCarrinho } = useCarrinho();
  const [animatedItemId, setAnimatedItemId] = useState<string | null>(null);

  // Efeito para animação ao alterar quantidade
  useEffect(() => {
    if (animatedItemId) {
      const timer = setTimeout(() => {
        setAnimatedItemId(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [animatedItemId]);

  if (carrinho.itens.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Seu Carrinho</h1>
        <div className="bg-white rounded-xl shadow-lg p-10 max-w-2xl mx-auto">
          <div className="flex flex-col items-center justify-center">
            <svg 
              className="w-24 h-24 text-gray-300 mb-6"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
              />
            </svg>
            <p className="text-gray-500 mb-8 text-lg">Seu carrinho está vazio</p>
            <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-1">
              Continuar Comprando
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleQuantidadeUpdate = (livroId: string, novaQuantidade: number) => {
    setAnimatedItemId(livroId);
    atualizarQuantidade(livroId, novaQuantidade);
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Seu Carrinho</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de itens do carrinho */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Versão para telas maiores */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-4 px-6 text-left text-sm text-gray-600 font-medium">Produto</th>
                    <th className="py-4 px-6 text-center text-sm text-gray-600 font-medium">Quantidade</th>
                    <th className="py-4 px-6 text-right text-sm text-gray-600 font-medium">Preço</th>
                    <th className="py-4 px-6 text-right text-sm text-gray-600 font-medium">Subtotal</th>
                    <th className="py-4 px-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {carrinho.itens.map((item) => (
                    <tr 
                      key={item.livro.id} 
                      className={`${animatedItemId === item.livro.id ? 'bg-blue-50 transition-colors duration-500' : 'hover:bg-gray-50'}`}
                    >
                      <td className="py-6 px-6">
                        <div className="flex items-center">
                          <div className="relative h-24 w-16 mr-6 rounded-md overflow-hidden shadow-sm">
                            <Image
                              src={item.livro.imagemUrl}
                              alt={item.livro.titulo}
                              fill
                              style={{ objectFit: 'cover' }}
                              className="rounded"
                              sizes="64px"
                            />
                          </div>
                          <div>
                            <Link href={`/produto/${item.livro.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-lg">
                              {item.livro.titulo}
                            </Link>
                            <p className="text-sm text-gray-500 mt-1">{item.livro.autor}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-6">
                        <div className="flex items-center justify-center">
                          <button
                            onClick={() => handleQuantidadeUpdate(item.livro.id, item.quantidade - 1)}
                            className="border border-gray-300 rounded-l-md p-2 hover:bg-gray-100 transition-colors"
                            disabled={item.quantidade <= 1}
                            aria-label="Diminuir quantidade"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-12 text-center py-2 border-t border-b border-gray-300 font-medium">
                            {item.quantidade}
                          </span>
                          <button
                            onClick={() => handleQuantidadeUpdate(item.livro.id, item.quantidade + 1)}
                            className="border border-gray-300 rounded-r-md p-2 hover:bg-gray-100 transition-colors"
                            aria-label="Aumentar quantidade"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="py-6 px-6 text-right text-gray-700">
                        R${item.livro.preco.toFixed(2)}
                      </td>
                      <td className="py-6 px-6 text-right font-semibold text-gray-800">
                        R${(item.livro.preco * item.quantidade).toFixed(2)}
                      </td>
                      <td className="py-6 px-6 text-right">
                        <button
                          onClick={() => removerItem(item.livro.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                          aria-label="Remover item"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Versão para dispositivos móveis */}
            <div className="md:hidden">
              {carrinho.itens.map((item) => (
                <div 
                  key={item.livro.id}
                  className={`p-4 border-b border-gray-200 ${animatedItemId === item.livro.id ? 'bg-blue-50 transition-colors duration-500' : ''}`}
                >
                  <div className="flex mb-4">
                    <div className="relative h-20 w-16 mr-4 rounded-md overflow-hidden shadow-sm">
                      <Image
                        src={item.livro.imagemUrl}
                        alt={item.livro.titulo}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <Link href={`/produto/${item.livro.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          {item.livro.titulo}
                        </Link>
                        <button
                          onClick={() => removerItem(item.livro.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                          aria-label="Remover item"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-500">{item.livro.autor}</p>
                      <p className="text-gray-800 mt-1">R${item.livro.preco.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleQuantidadeUpdate(item.livro.id, item.quantidade - 1)}
                        className="border border-gray-300 rounded-l-md p-2 hover:bg-gray-100 transition-colors"
                        disabled={item.quantidade <= 1}
                        aria-label="Diminuir quantidade"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-10 text-center py-2 border-t border-b border-gray-300 font-medium">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => handleQuantidadeUpdate(item.livro.id, item.quantidade + 1)}
                        className="border border-gray-300 rounded-r-md p-2 hover:bg-gray-100 transition-colors"
                        aria-label="Aumentar quantidade"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-right font-semibold text-gray-800">
                      Subtotal: R${(item.livro.preco * item.quantidade).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex justify-between">
            <Link 
              href="/" 
              className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition duration-300 flex items-center gap-2 font-medium shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Continuar Comprando
            </Link>
            <button
              onClick={() => limparCarrinho()}
              className="bg-white border border-red-300 text-red-600 px-6 py-3 rounded-lg hover:bg-red-50 transition duration-300 flex items-center gap-2 font-medium shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpar Carrinho
            </button>
          </div>
        </div>
        
        {/* Resumo do pedido */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-gray-100 text-gray-800">Resumo do Pedido</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({carrinho.itens.reduce((acc, item) => acc + item.quantidade, 0)} itens)</span>
                <span className="font-medium">R${carrinho.total.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-gray-600">
                <span>Frete</span>
                <span className="text-green-600 font-medium">Grátis</span>
              </div>
              
              <div className="flex justify-between text-gray-600">
                <span>Impostos</span>
                <span>Incluídos</span>
              </div>
              
              <div className="pt-4 mt-4 border-t border-gray-200">
                <div className="flex justify-between font-bold text-xl text-gray-800">
                  <span>Total</span>
                  <span>R${carrinho.total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">ou em até 12x sem juros</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <Link
                href="/checkout"
                className="block w-full bg-blue-600 text-white text-center py-4 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1"
              >
                Finalizar Compra
              </Link>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex gap-2 text-green-800 items-start">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm">Entrega grátis para todo o Brasil em compras acima de R$50,00</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <span className="text-sm">Métodos de pagamento:</span>
                <div className="flex space-x-1">
                  <span className="w-10 h-6 bg-gray-200 rounded" title="Cartão de crédito"></span>
                  <span className="w-10 h-6 bg-gray-200 rounded" title="Boleto"></span>
                  <span className="w-10 h-6 bg-gray-200 rounded" title="Pix"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 