import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories } from '@/app/lib/database';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const categories = await getAllCategories();
    
    return NextResponse.json({ 
      success: true, 
      data: categories
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar categorias' },
      { status: 500 }
    );
  }
} 