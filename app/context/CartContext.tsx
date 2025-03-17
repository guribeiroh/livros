'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Tipos
interface CartItem {
  id: string;
  titulo: string;
  autor: string;
  preco: number;
  imagemUrl: string;
  quantidade: number;
}

interface Cart {
  items: CartItem[];
  total: number;
}

interface CartContextType {
  cart: Cart;
  addItem: (item: Omit<CartItem, 'quantidade'> & { quantidade?: number }) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
}

// Criar o contexto
const CartContext = createContext<CartContextType | undefined>(undefined);

// Hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

// Provider
const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<Cart>({
    items: [],
    total: 0
  });

  // Carregar carrinho do localStorage quando o componente montar
  useEffect(() => {
    // Verificar primeiro se existe um carrinho no formato antigo
    const carrinhoAntigo = localStorage.getItem('carrinho');
    const carrinhoModerno = localStorage.getItem('modern-cart');
    
    if (carrinhoAntigo) {
      try {
        // Converter do formato antigo para o novo formato
        const carrinhoAntigoObj = JSON.parse(carrinhoAntigo);
        
        if (carrinhoAntigoObj && carrinhoAntigoObj.itens && carrinhoAntigoObj.itens.length > 0) {
          // Transformar o formato antigo para o novo
          const novosItens = carrinhoAntigoObj.itens.map((item: any) => ({
            id: item.livro.id,
            titulo: item.livro.titulo,
            autor: item.livro.autor,
            preco: item.livro.preco,
            imagemUrl: item.livro.imagemUrl,
            quantidade: item.quantidade
          }));
          
          const novoTotal = novosItens.reduce(
            (sum: number, item: CartItem) => sum + item.preco * item.quantidade, 
            0
          );
          
          const novoCarrinho = {
            items: novosItens,
            total: novoTotal
          };
          
          setCart(novoCarrinho);
          localStorage.setItem('modern-cart', JSON.stringify(novoCarrinho));
          return;
        }
      } catch (error) {
        console.error('Erro ao converter o carrinho antigo:', error);
      }
    }
    
    // Se não tiver carrinho antigo ou falhar na conversão, tenta usar o moderno
    if (carrinhoModerno) {
      try {
        const parsedCart = JSON.parse(carrinhoModerno);
        setCart(parsedCart);
      } catch (error) {
        console.error('Erro ao carregar o carrinho:', error);
        localStorage.removeItem('modern-cart');
      }
    }
  }, []);

  // Salvar carrinho no localStorage sempre que mudar e sincronizar com o formato antigo
  useEffect(() => {
    localStorage.setItem('modern-cart', JSON.stringify(cart));
    
    // Sincronizar com o formato antigo do carrinho para compatibilidade
    const carrinhoAntigo = {
      itens: cart.items.map(item => ({
        livro: {
          id: item.id,
          titulo: item.titulo,
          autor: item.autor,
          preco: item.preco,
          imagemUrl: item.imagemUrl
        },
        quantidade: item.quantidade
      })),
      total: cart.total
    };
    
    localStorage.setItem('carrinho', JSON.stringify(carrinhoAntigo));
  }, [cart]);

  // Calcular o número total de itens no carrinho
  const itemCount = cart.items.reduce((total, item) => total + item.quantidade, 0);

  // Adicionar item ao carrinho
  const addItem = (item: Omit<CartItem, 'quantidade'> & { quantidade?: number }) => {
    const quantidade = item.quantidade || 1;
    
    setCart(prevCart => {
      // Verificar se o item já existe no carrinho
      const existingItemIndex = prevCart.items.findIndex(cartItem => cartItem.id === item.id);
      
      let updatedItems;
      
      if (existingItemIndex >= 0) {
        // Atualizar a quantidade do item existente
        updatedItems = [...prevCart.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantidade: updatedItems[existingItemIndex].quantidade + quantidade
        };
      } else {
        // Adicionar novo item
        updatedItems = [...prevCart.items, { ...item, quantidade }];
      }
      
      // Calcular o novo total
      const newTotal = updatedItems.reduce(
        (sum, cartItem) => sum + cartItem.preco * cartItem.quantidade, 
        0
      );
      
      return {
        items: updatedItems,
        total: newTotal
      };
    });
  };

  // Remover item do carrinho
  const removeItem = (itemId: string) => {
    setCart(prevCart => {
      const updatedItems = prevCart.items.filter(item => item.id !== itemId);
      const newTotal = updatedItems.reduce(
        (sum, item) => sum + item.preco * item.quantidade, 
        0
      );
      
      return {
        items: updatedItems,
        total: newTotal
      };
    });
  };

  // Atualizar quantidade de um item
  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setCart(prevCart => {
      const updatedItems = prevCart.items.map(item => 
        item.id === itemId ? { ...item, quantidade: quantity } : item
      );
      
      const newTotal = updatedItems.reduce(
        (sum, item) => sum + item.preco * item.quantidade, 
        0
      );
      
      return {
        items: updatedItems,
        total: newTotal
      };
    });
  };

  // Limpar carrinho
  const clearCart = () => {
    setCart({
      items: [],
      total: 0
    });
  };

  return (
    <CartContext.Provider 
      value={{ 
        cart, 
        addItem, 
        removeItem, 
        updateQuantity, 
        clearCart,
        itemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider; 