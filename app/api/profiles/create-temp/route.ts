import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    console.log('[API] Criando perfil temporário...');
    const body = await request.json();
    const { email, name } = body;
    
    console.log('[API] Dados recebidos:', { email, name });
    
    if (!email || !name) {
      console.error('[API] Dados incompletos:', { email, name });
      return NextResponse.json(
        { success: false, error: 'Email e nome são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar configuração do Supabase
    console.log('[API] Verificando conexão Supabase...');
    
    try {
      // Teste simples de conexão
      const { data: testData, error: testError } = await supabase
        .from('profiles')
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
    
    // Verificar se já existe um perfil com este email
    console.log('[API] Verificando perfil existente para:', email);
    const { data: existingProfiles, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (searchError) {
      console.error('[API] Erro ao verificar perfil existente:', searchError);
      return NextResponse.json(
        { success: false, error: `Erro ao verificar perfil existente: ${searchError.message}` },
        { status: 500 }
      );
    }
    
    // Se já existe um perfil, retorna o ID existente
    if (existingProfiles) {
      console.log('[API] Perfil existente encontrado:', existingProfiles.id);
      return NextResponse.json({ 
        success: true, 
        id: existingProfiles.id,
        message: 'Perfil existente encontrado'
      });
    }
    
    // Criar novo perfil
    console.log('[API] Criando novo perfil para:', email);
    const userId = uuidv4();
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        { 
          id: userId,
          email: email,
          name: name,
          role: 'customer'
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('[API] Erro ao criar perfil temporário:', error);
      return NextResponse.json(
        { success: false, error: `Erro ao criar perfil temporário: ${error.message}` },
        { status: 500 }
      );
    }
    
    console.log('[API] Perfil criado com sucesso:', data.id);
    return NextResponse.json({ 
      success: true, 
      id: data.id,
      message: 'Perfil temporário criado com sucesso' 
    });
  } catch (error) {
    console.error('[API] Erro ao processar solicitação:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor: ' + (error instanceof Error ? error.message : 'Erro desconhecido') },
      { status: 500 }
    );
  }
} 