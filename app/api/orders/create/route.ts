import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Criando novo pedido...');
    const orderData = await request.json();
    console.log('[API] Dados do pedido recebidos:', {
      id: orderData.id,
      user_id: orderData.user_id,
      total: orderData.total
    });
    
    // Validar dados mínimos necessários
    if (!orderData.id || orderData.total === undefined) {
      console.error('[API] Dados do pedido incompletos', orderData);
      return NextResponse.json(
        { success: false, error: 'Dados do pedido incompletos' },
        { status: 400 }
      );
    }
    
    // Verificar conexão com Supabase
    console.log('[API] Verificando conexão Supabase...');
    
    try {
      // Teste simples de conexão
      const { data: testData, error: testError } = await supabase
        .from('orders')
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
    
    // Inserir o pedido no Supabase
    console.log('[API] Inserindo pedido no Supabase...');
    const insertData = {
      id: orderData.id,
      user_id: orderData.user_id || null,
      status: orderData.status || 'pendente',
      total: orderData.total,
      shipping_address: orderData.shipping_address || '',
      shipping_city: orderData.shipping_city || '',
      shipping_state: orderData.shipping_state || '',
      shipping_zipcode: orderData.shipping_zipcode || '',
      payment_method: orderData.payment_method || 'na entrega',
      tracking_number: orderData.tracking_number || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('[API] Dados para inserção:', insertData);
    
    const { data, error } = await supabase
      .from('orders')
      .insert([insertData])
      .select()
      .single();
      
    if (error) {
      console.error('[API] Erro ao criar pedido:', error);
      return NextResponse.json(
        { success: false, error: `Erro ao criar pedido: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('[API] Pedido criado com sucesso:', data.id);
    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Pedido criado com sucesso' 
    });
  } catch (error) {
    console.error('[API] Erro ao processar solicitação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 