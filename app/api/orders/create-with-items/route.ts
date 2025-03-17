import { NextRequest, NextResponse } from 'next/server';
import { createOrderWithItems } from '@/app/lib/services/orderService';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Criando pedido com itens...');
    const body = await request.json();
    const { orderData, items } = body;
    
    console.log('[API] Dados recebidos:', { 
      order: { ...orderData, total: orderData.total },
      itemsCount: items?.length || 0
    });
    
    if (!orderData || !items || !Array.isArray(items) || items.length === 0) {
      console.error('[API] Dados inválidos:', body);
      return NextResponse.json(
        { success: false, error: 'Dados de pedido inválidos' },
        { status: 400 }
      );
    }
    
    const result = await createOrderWithItems(orderData, items);
    
    if (!result.success) {
      console.error('[API] Erro ao criar pedido com itens:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
    
    console.log('[API] Pedido criado com sucesso:', result.orderId);
    return NextResponse.json({
      success: true,
      data: {
        orderId: result.orderId,
        order: result.order
      },
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