import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

export interface OrderData {
  user_id?: string | null;
  total: number;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zipcode?: string;
  payment_method?: string;
  status?: string;
}

export interface OrderItemData {
  book_id: string;
  quantity: number;
  price_at_purchase: number;
}

// Função para criar um pedido e seus itens em uma única transação
export async function createOrderWithItems(
  orderData: OrderData,
  items: OrderItemData[]
) {
  try {
    // Gerar ID do pedido
    const orderId = uuidv4();

    // Dados do pedido
    const order = {
      id: orderId,
      user_id: orderData.user_id || null,
      status: orderData.status || 'pending',
      total: orderData.total,
      shipping_address: orderData.shipping_address || '',
      shipping_city: orderData.shipping_city || '',
      shipping_state: orderData.shipping_state || '',
      shipping_zipcode: orderData.shipping_zipcode || '',
      payment_method: orderData.payment_method || 'na entrega',
      tracking_number: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Criar o pedido
    const { data: orderResult, error: orderError } = await supabase
      .from('orders')
      .insert([order])
      .select()
      .single();

    if (orderError) {
      console.error('Erro ao criar pedido:', orderError);
      return { success: false, error: orderError.message };
    }

    // Preparar itens do pedido
    const orderItems = items.map(item => ({
      id: uuidv4(),
      order_id: orderId,
      book_id: item.book_id,
      quantity: item.quantity,
      price_at_purchase: item.price_at_purchase,
      created_at: new Date().toISOString()
    }));

    // Inserir itens
    const { data: itemsResult, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Erro ao adicionar itens:', itemsError);
      // Tentar remover o pedido criado para evitar órfãos
      await supabase.from('orders').delete().eq('id', orderId);
      return { success: false, error: itemsError.message };
    }

    // Atualizar estoque para cada item
    for (const item of items) {
      try {
        // Obter estoque atual
        const { data: bookData } = await supabase
          .from('books')
          .select('stock')
          .eq('id', item.book_id)
          .single();

        if (bookData && typeof bookData.stock === 'number') {
          // Atualizar estoque
          const newStock = Math.max(0, bookData.stock - item.quantity);
          
          await supabase
            .from('books')
            .update({ stock: newStock })
            .eq('id', item.book_id);
        }
      } catch (stockError) {
        console.warn('Erro ao atualizar estoque para item:', item.book_id, stockError);
        // Continuar mesmo com erro de estoque
      }
    }

    return {
      success: true,
      order: orderResult,
      orderId
    };
  } catch (error) {
    console.error('Erro ao criar pedido com itens:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

// Função para criar um perfil temporário
export async function createOrFindProfile(email: string, name: string) {
  try {
    // Verificar se já existe um perfil com este email
    const { data: existingProfile, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (searchError) {
      console.error('Erro ao procurar perfil:', searchError);
      return { success: false, error: searchError.message };
    }

    // Se já existe, retornar o ID
    if (existingProfile) {
      return { success: true, id: existingProfile.id, isExisting: true };
    }

    // Criar novo perfil
    const userId = uuidv4();
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: userId,
          email,
          name,
          role: 'customer'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar perfil:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id, isExisting: false };
  } catch (error) {
    console.error('Erro ao criar/encontrar perfil:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
} 