'use client';

import { useContext } from 'react';
import { useCarrinho } from '../context/CarrinhoContext';

/**
 * Hook personalizado para acessar o contexto do carrinho moderno
 * Este hook serve como uma abstração para o hook useCarrinho existente
 * e permite uma migração gradual para o novo sistema de carrinho
 */
export default function useCart() {
  // Por enquanto, vamos usar o contexto de carrinho existente
  const carrinhoContext = useCarrinho();
  
  // Adaptar a interface do carrinho antigo para o novo formato
  return {
    cart: {
      items: carrinhoContext.carrinho.itens.map(item => ({
        id: item.livro.id,
        titulo: item.livro.titulo,
        autor: item.livro.autor,
        preco: item.livro.preco,
        imagemUrl: item.livro.imagemUrl,
        quantidade: item.quantidade
      })),
      total: carrinhoContext.carrinho.total
    },
    addItem: (item: any) => {
      // Adaptar o item para o formato esperado pelo useCarrinho
      const livro = {
        id: item.id,
        titulo: item.titulo,
        autor: item.autor,
        preco: item.preco,
        imagemUrl: item.imagemUrl,
        // Outros campos obrigatórios do tipo Livro
        descricao: '',
        disponivel: true,
        anoPublicacao: new Date().getFullYear(),
        paginas: 0,
        categoria: '',
        isbn: ''
      };
      
      // Adicionar o item n vezes conforme a quantidade
      const quantidade = item.quantidade || 1;
      for (let i = 0; i < quantidade; i++) {
        carrinhoContext.adicionarItem(livro);
      }
    },
    removeItem: (itemId: string) => {
      carrinhoContext.removerItem(itemId);
    },
    updateQuantity: (itemId: string, quantity: number) => {
      carrinhoContext.atualizarQuantidade(itemId, quantity);
    },
    clearCart: () => {
      carrinhoContext.limparCarrinho();
    },
    itemCount: carrinhoContext.carrinho.itens.reduce(
      (total, item) => total + item.quantidade, 0
    )
  };
} 