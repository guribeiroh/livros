'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCarrinho } from '../../context/CarrinhoContext';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';

export default function ConfirmacaoPage() {
  const router = useRouter();
  const { carrinho, limparCarrinho } = useCarrinho();
  const [dadosCliente, setDadosCliente] = useState<any>(null);
  const [itensNoCarrinho, setItensNoCarrinho] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [numeroPedido, setNumeroPedido] = useState('');
  const [webhookEnviado, setWebhookEnviado] = useState(false);
  const [pedidoSalvo, setPedidoSalvo] = useState(false);
  const [salvandoPedido, setSalvandoPedido] = useState(false);
  const [erroSalvamento, setErroSalvamento] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'resumo' | 'rastreamento'>('resumo');
  const [dataEntregaEstimada, setDataEntregaEstimada] = useState<string>('');
  const [copiado, setCopiado] = useState(false);

  // Função para enviar dados para o webhook
  const enviarParaWebhook = async (dados: any) => {
    try {
      const response = await fetch('https://hook.us1.make.com/44zjf7llwh01t95vgi3ebd9twhxvxeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados)
      });
      
      if (response.ok) {
        console.log('Dados enviados com sucesso para o webhook');
        setWebhookEnviado(true);
      } else {
        console.error('Erro ao enviar dados para o webhook:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao enviar dados para o webhook:', error);
    }
  };

  // Função para salvar o pedido no Supabase
  const salvarPedidoSupabase = async (dadosPedido: any) => {
    if (salvandoPedido || pedidoSalvo) {
      console.log('Operação de salvamento já em andamento ou concluída');
      return false;
    }

    setSalvandoPedido(true);
    setErroSalvamento(null);
    
    try {
      console.log('Iniciando processo de salvamento no Supabase...');
      // Criar um perfil temporário se o usuário não estiver logado
      let userId = null;
      
      // Tentativa de criar um perfil temporário para o cliente
      console.log('Criando perfil temporário para:', dadosPedido.cliente.email);
      const perfilResponse = await fetch('/api/profiles/create-temp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: dadosPedido.cliente.email,
          name: dadosPedido.cliente.nome
        })
      });
      
      const perfilData = await perfilResponse.json();
      console.log('Resposta da criação de perfil:', perfilData);
      
      if (perfilResponse.ok && perfilData.id) {
        userId = perfilData.id;
        console.log('Perfil criado/encontrado com ID:', userId);
      } else {
        console.error('Erro na resposta do perfil:', perfilData.error || 'Erro desconhecido');
        setErroSalvamento('Erro ao criar perfil: ' + (perfilData.error || 'Erro desconhecido'));
        throw new Error('Erro ao criar perfil');
      }
      
      // Preparar dados para a API unificada
      const orderData = {
        user_id: userId,
        total: dadosPedido.pedido.total,
        shipping_address: dadosPedido.cliente.rua,
        shipping_city: dadosPedido.cliente.cidade,
        shipping_state: dadosPedido.cliente.estado,
        shipping_zipcode: dadosPedido.cliente.cep,
        payment_method: 'na entrega',
        status: 'pendente'
      };
      
      // Preparar itens
      const items = dadosPedido.pedido.itens.map((item: any) => ({
        book_id: item.id,
        quantity: item.quantidade,
        price_at_purchase: item.preco
      }));
      
      console.log('Enviando dados para API unificada:', { orderData, itemsCount: items.length });
      
      // Chamar API unificada
      const response = await fetch('/api/orders/create-with-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderData,
          items
        })
      });
      
      const result = await response.json();
      console.log('Resposta da API unificada:', result);
      
      if (!response.ok || !result.success) {
        console.error('Erro ao criar pedido:', result.error || 'Erro desconhecido');
        setErroSalvamento('Erro ao criar pedido: ' + (result.error || 'Erro desconhecido'));
        throw new Error('Erro ao criar pedido');
      }
      
      console.log('Pedido completo salvo com sucesso no Supabase');
      setPedidoSalvo(true);
      setSalvandoPedido(false);
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar pedido no Supabase:', error);
      if (!erroSalvamento) {
        setErroSalvamento('Erro ao salvar pedido: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      }
      setSalvandoPedido(false);
      return false;
    }
  };

  // Função para estimar data de entrega (10 dias úteis)
  const calcularDataEntrega = () => {
    const hoje = new Date();
    let diasUteis = 0;
    let dataAtual = new Date(hoje);
    
    while (diasUteis < 10) {
      dataAtual.setDate(dataAtual.getDate() + 1);
      const diaDaSemana = dataAtual.getDay();
      if (diaDaSemana !== 0 && diaDaSemana !== 6) {
        // Não é fim de semana
        diasUteis++;
      }
    }
    
    return dataAtual.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Função para copiar número do pedido
  const copiarNumeroPedido = () => {
    navigator.clipboard.writeText(numeroPedido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Função para compartilhar pedido
  const compartilharPedido = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Meu pedido na Livraria Online',
        text: `Acabei de fazer um pedido (${numeroPedido}) na Livraria Online!`,
        url: window.location.href
      });
    }
  };

  useEffect(() => {
    // Gerar número de pedido aleatório
    const numPedido = `#${Math.floor(Math.random() * 100000)}`;
    setNumeroPedido(numPedido);

    // Carregar dados do cliente
    const dadosClienteStr = localStorage.getItem('dadosCliente');
    let clienteData = null;
    if (dadosClienteStr) {
      try {
        clienteData = JSON.parse(dadosClienteStr);
        setDadosCliente(clienteData);
      } catch (error) {
        console.error('Erro ao carregar dados do cliente:', error);
      }
    }

    // Verificar e salvar itens do carrinho
    if (carrinho.itens && carrinho.itens.length > 0) {
      // Salvar cópia dos itens e total para exibição
      const itensSalvos = [...carrinho.itens];
      setItensNoCarrinho(itensSalvos);
      setTotal(carrinho.total);
      
      // Preparar dados do pedido para o webhook e Supabase
      if (clienteData && numPedido && !webhookEnviado && !pedidoSalvo && !salvandoPedido) {
        const dadosPedido = {
          pedido: {
            numero: numPedido,
            itens: itensSalvos.map(item => ({
              id: item.livro.id,
              titulo: item.livro.titulo,
              autor: item.livro.autor,
              preco: item.livro.preco,
              quantidade: item.quantidade,
              subtotal: item.livro.preco * item.quantidade
            })),
            total: carrinho.total,
            data: new Date().toISOString()
          },
          cliente: clienteData
        };
        
        // Enviar para webhook
        enviarParaWebhook(dadosPedido);
        
        // Salvar no Supabase
        console.log('Iniciando salvamento no Supabase...');
        salvarPedidoSupabase(dadosPedido).then(success => {
          console.log('Resultado do salvamento:', success ? 'Sucesso' : 'Falha');
        });
      }
    }
    
    // Calcular data estimada de entrega
    setDataEntregaEstimada(calcularDataEntrega());
    
    // Função de limpeza que será executada quando o componente for desmontado
    return () => {
      limparCarrinho();
      localStorage.removeItem('dadosCliente');
      console.log('Carrinho limpo ao sair da página de confirmação');
    };
  }, []); // Executar apenas na montagem do componente

  // Função para lidar com o clique no botão de voltar à loja
  const voltarParaLoja = () => {
    limparCarrinho();
    localStorage.removeItem('dadosCliente');
    router.push('/');
  };

  // Variáveis para animação
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <motion.div 
        className="container mx-auto px-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto">
          {/* Cabeçalho */}
          <motion.div 
            className="bg-white rounded-xl shadow-md p-8 mb-6 text-center"
            variants={itemVariants}
          >
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 bg-success-100 text-success-600 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
                <motion.div 
                  className="absolute -top-2 -right-2 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                >
                  3
                </motion.div>
              </div>
            </div>
            
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Pedido Confirmado!</h1>
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-gray-600 font-medium">
                Seu pedido {numeroPedido} foi recebido
              </p>
              <button 
                className="text-primary-600 hover:text-primary-800 transition-colors"
                onClick={copiarNumeroPedido}
                title="Copiar número do pedido"
              >
                {copiado ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                )}
              </button>
        </div>

            <div className="flex justify-center space-x-4 mt-4">
              <button
                onClick={() => setActiveTab('resumo')}
                className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'resumo' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Resumo do Pedido
              </button>
              <button
                onClick={() => setActiveTab('rastreamento')}
                className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'rastreamento' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Rastreamento
              </button>
            </div>
          </motion.div>

          {activeTab === 'resumo' ? (
            <>
              {/* Resumo do Pedido */}
              <motion.div 
                className="bg-white rounded-xl shadow-md p-6 mb-6"
                variants={itemVariants}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Itens do Pedido</h2>
                  <span className="text-sm text-gray-500">{itensNoCarrinho.length} {itensNoCarrinho.length === 1 ? 'item' : 'itens'}</span>
                </div>
          
          <div className="divide-y divide-gray-200">
                  {itensNoCarrinho.map((item, index) => (
                    <motion.div 
                      key={item.livro.id}
                      className="py-4 flex items-start"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + (index * 0.1) }}
                    >
                      <div className="w-16 h-24 relative flex-shrink-0 mr-4 bg-gray-50 rounded-md overflow-hidden">
                  <Image
                    src={item.livro.imagemUrl}
                    alt={item.livro.titulo}
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex-grow">
                        <h3 className="font-medium text-gray-800">{item.livro.titulo}</h3>
                  <p className="text-sm text-gray-600">{item.livro.autor}</p>
                        <div className="flex justify-between mt-2">
                          <div className="flex items-center">
                            <span className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              Qtd: {item.quantidade}
                            </span>
                  </div>
                          <span className="font-medium text-gray-900">R$ {(item.livro.preco * item.quantidade).toFixed(2)}</span>
                </div>
              </div>
                    </motion.div>
            ))}
          </div>
          
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Subtotal:</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Frete:</span>
                    <span>Grátis</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-gray-900 mt-2">
            <span>Total:</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
        </div>
              </motion.div>

              {/* Informações de Entrega */}
        {dadosCliente && (
                <motion.div 
                  className="bg-white rounded-xl shadow-md p-6 mb-6"
                  variants={itemVariants}
                >
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Dados de Entrega</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                      <h3 className="text-sm uppercase text-gray-500 font-medium mb-2">Destinatário</h3>
                      <p className="text-gray-800 font-medium">{dadosCliente.nome}</p>
                      <p className="text-gray-600 text-sm mt-1">{dadosCliente.email}</p>
                      <p className="text-gray-600 text-sm">{dadosCliente.telefone}</p>
                    </div>
                    <div className="md:border-l md:pl-6">
                      <h3 className="text-sm uppercase text-gray-500 font-medium mb-2">Endereço</h3>
                      <p className="text-gray-800">{dadosCliente.rua}</p>
                      <p className="text-gray-600 text-sm">{dadosCliente.cidade}, {dadosCliente.estado}</p>
                      <p className="text-gray-600 text-sm">CEP: {dadosCliente.cep}</p>
                    </div>
            </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
            <div>
                        <h3 className="text-sm uppercase text-gray-500 font-medium">Entrega estimada</h3>
                        <p className="text-gray-800 font-medium">{dataEntregaEstimada}</p>
                      </div>
                      <div className="bg-success-50 text-success-700 px-4 py-2 rounded-lg text-sm font-medium">
                        Frete Grátis
                      </div>
            </div>
          </div>
                </motion.div>
              )}
            </>
          ) : (
            /* Tela de Rastreamento */
            <motion.div 
              className="bg-white rounded-xl shadow-md p-6 mb-6"
              variants={itemVariants}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Rastreamento</h2>
              
              <div className="relative">
                <div className="absolute top-0 bottom-0 left-7 border-l-2 border-primary-100"></div>
                
                <div className="flex mb-8 relative">
                  <div className="h-14 w-14 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium">Pedido Confirmado</h3>
                    <p className="text-sm text-gray-500">Recebemos seu pedido e estamos processando</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                
                <div className="flex mb-8 relative">
                  <div className="h-14 w-14 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-400">Pagamento</h3>
                    <p className="text-sm text-gray-500">Aguardando pagamento na entrega</p>
                  </div>
                </div>
                
                <div className="flex mb-8 relative">
                  <div className="h-14 w-14 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-400">Preparação</h3>
                    <p className="text-sm text-gray-500">Separando seus livros</p>
                  </div>
                </div>
                
                <div className="flex relative">
                  <div className="h-14 w-14 flex-shrink-0 bg-gray-100 rounded-full flex items-center justify-center z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-gray-400">Entrega</h3>
                    <p className="text-sm text-gray-500">Entrega estimada em {dataEntregaEstimada}</p>
                  </div>
                </div>
        </div>

              <div className="mt-8 pt-4 border-t border-gray-200">
                <h3 className="font-medium mb-2">Código de Rastreamento</h3>
                <div className="flex">
                  <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-mono flex-grow">
                    Disponível em breve
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Ações */}
          <motion.div 
            className="bg-white rounded-xl shadow-md p-6 mb-6"
            variants={itemVariants}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={voltarParaLoja}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
          >
            Voltar para a Loja
                </button>
                
                <button 
                  onClick={compartilharPedido}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Compartilhar pedido"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
              
              <div className="text-gray-500 text-sm">
                Tem dúvidas sobre seu pedido? <Link href="/contato" className="text-primary-600 hover:underline">Entre em contato</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 