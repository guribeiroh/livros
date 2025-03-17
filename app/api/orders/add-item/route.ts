import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Adicionando item ao pedido...');
    const itemData = await request.json();
    console.log('[API] Dados do item recebidos:', {
      order_id: itemData.order_id,
      book_id: itemData.book_id,
      quantity: itemData.quantity,
      price: itemData.price_at_purchase
    });
    
    // Validar dados mínimos necessários
    if (!itemData.order_id || !itemData.book_id || itemData.quantity === undefined || itemData.price_at_purchase === undefined) {
      console.error('[API] Dados do item incompletos:', itemData);
      return NextResponse.json(
        { success: false, error: 'Dados do item de pedido incompletos' },
        { status: 400 }
      );
    }
    
    // Verificar conexão com Supabase
    console.log('[API] Verificando conexão Supabase...');
    
    try {
      // Teste simples de conexão
      const { data: testData, error: testError } = await supabase
        .from('order_items')
        .select('count')
        .limit(1);
        
      if (testError) {
        console.error('[API] Erro ao testar conexão com Supabase:', testError);
        return NextResponse.json(
          { success: false, error: `Erro de conexão com Supabase: ${testError.message}` },
          { status: 500 }
        );
      }
      
      console.log('[API] Conexão com Supabase OK');
    } catch (connError) {
      console.error('[API] Erro crítico ao conectar com Supabase:', connError);
      return NextResponse.json(
        { success: false, error: 'Erro crítico de conexão com Supabase' },
        { status: 500 }
      );
    }
    
    // Inserir o item do pedido no Supabase
    console.log('[API] Inserindo item do pedido...');
    
    const itemId = uuidv4();
    console.log('[API] ID gerado para o item:', itemId);
    
    const insertData = {
      id: itemId,
      order_id: itemData.order_id,
      book_id: itemData.book_id,
      quantity: itemData.quantity,
      price_at_purchase: itemData.price_at_purchase,
      created_at: new Date().toISOString()
    };
    
    console.log('[API] Dados para inserção do item:', insertData);
    
    const { data, error } = await supabase
      .from('order_items')
      .insert([insertData])
      .select()
      .single();
      
    if (error) {
      console.error('[API] Erro ao adicionar item ao pedido:', error);
      return NextResponse.json(
        { success: false, error: `Erro ao adicionar item ao pedido: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('[API] Item adicionado com sucesso:', data.id);
    
    // Atualizar estoque do livro (opcional, dependendo da regra de negócio)
    try {
      console.log('[API] Atualizando estoque do livro:', itemData.book_id);
      // Primeiro, obter o estoque atual
      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('stock')
        .eq('id', itemData.book_id)
        .single();
        
      if (bookError) {
        console.error('[API] Erro ao obter estoque do livro:', bookError);
        // Não interromper o fluxo, apenas registrar o erro
      } else if (bookData && bookData.stock !== null) {
        // Calcular novo estoque
        const newStock = Math.max(0, bookData.stock - itemData.quantity);
        console.log('[API] Atualizando estoque:', { antigo: bookData.stock, novo: newStock });
        
        // Atualizar estoque
        const { error: updateError } = await supabase
          .from('books')
          .update({ stock: newStock })
          .eq('id', itemData.book_id);
          
        if (updateError) {
          console.error('[API] Erro ao atualizar estoque:', updateError);
        } else {
          console.log('[API] Estoque atualizado com sucesso');
        }
      } else {
        console.log('[API] Livro não tem estoque definido, pulando atualização');
      }
    } catch (stockError) {
      console.error('[API] Erro ao processar atualização de estoque:', stockError);
      // Não interromper o fluxo por falha na atualização de estoque
    }
    
    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Item adicionado ao pedido com sucesso' 
    });
  } catch (error) {
    console.error('[API] Erro ao processar solicitação de item:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 