import fs from 'fs';
import path from 'path';
import {
  User,
  Property,
  ListingSource,
  PipelineStage,
  ContactHistory,
  Connector,
  SearchConfig,
  DashboardMetrics,
} from '../src/types/index.ts';
import { INITIAL_CONNECTORS, INITIAL_CONNECTOR_LOGS, ConnectorLog } from './connectors.ts';

// Audit Log structure
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

export interface SearchRun {
  id: string;
  configId: string;
  startedAt: string;
  completedAt: string;
  status: 'Concluído' | 'Em execução' | 'Erro';
  totalFound: number;
  newImports: number;
  duplicatesFound: number;
  ownersHighProbability: number;
}

export interface TaskItem {
  id: string;
  propertyId: string;
  assignedUserId: string;
  title: string;
  dueDate: string;
  completed: boolean;
  priority: 'Alta' | 'Média' | 'Baixa';
  createdAt: string;
}

// Initial realistic users for Connect Imóveis
export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Carlos Albuquerque',
    email: 'carlos.albuquerque@connectimoveis.com.br',
    role: 'ADMIN',
    active: true,
    phone: '(47) 99821-4450',
    creci: '34890-J',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    assignedLeadsCount: 5,
  },
  {
    id: 'usr-2',
    name: 'Mariana Duarte',
    email: 'mariana.duarte@connectimoveis.com.br',
    role: 'GESTOR',
    active: true,
    phone: '(47) 99732-8812',
    creci: '41209-F',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    assignedLeadsCount: 8,
  },
  {
    id: 'usr-3',
    name: 'Rodrigo Silveira',
    email: 'rodrigo.silveira@connectimoveis.com.br',
    role: 'CORRETOR',
    active: true,
    phone: '(47) 99611-3320',
    creci: '48911-F',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    assignedLeadsCount: 14,
  },
  {
    id: 'usr-4',
    name: 'Fernanda Becker',
    email: 'fernanda.becker@connectimoveis.com.br',
    role: 'CORRETOR',
    active: true,
    phone: '(47) 99945-1200',
    creci: '50234-F',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    assignedLeadsCount: 11,
  },
];

// Initial realistic properties in Santa Catarina (Porto Belo, Itapema, Bombinhas, BC, etc.)
export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    title: 'Apartamento Frente Mar em Meia Praia - Direto com Proprietário',
    type: 'Apartamento',
    price: 1850000,
    originalPrice: 1950000,
    condoFee: 780,
    iptu: 2400,
    city: 'Itapema',
    neighborhood: 'Meia Praia',
    address: 'Av. Nereu Ramos, próximo à Rua 240',
    isApproximateLocation: true,
    lat: -27.1425,
    lng: -48.6083,
    areaPrivate: 142,
    bedrooms: 3,
    suites: 3,
    bathrooms: 4,
    parkingSpots: 2,
    description: 'Vendo meu apartamento decorado e mobiliado na Meia Praia. 3 suítes amplas, sacada gourmet fechada com churrasqueira a carvão e vista mar permanente. Motivo: mudança de estado. Tratar direto com proprietário. Não tenho interesse em exclusividade com imobiliárias pequenas, mas avalio proposta concreta.',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80'
    ],
    primarySource: 'OLX',
    sources: [
      {
        id: 'src-1',
        source: 'OLX',
        originalUrl: 'https://sc.olx.com.br/imoveis/itapema/apartamento-meia-praia-direto-proprietario-1029384',
        externalId: 'OLX-1029384',
        price: 1850000,
        title: 'Apartamento Meia Praia 3 suítes Direto com o dono',
        publishedAt: '2026-11-08T14:30:00Z',
        discoveredAt: '2026-11-08T15:10:00Z',
        advertiserName: 'Dr. Paulo Henrique Ramos',
        advertiserContact: '(47) 99124-7788',
      },
      {
        id: 'src-1b',
        source: 'Facebook Marketplace',
        originalUrl: 'https://facebook.com/marketplace/item/9928172938',
        externalId: 'FB-9928172938',
        price: 1900000,
        title: 'Apto 3 suítes Meia Praia frente mar aceito proposta',
        publishedAt: '2026-11-06T10:00:00Z',
        discoveredAt: '2026-11-07T09:20:00Z',
        advertiserName: 'Paulo H. Ramos',
        advertiserContact: '(47) 99124-7788',
      }
    ],
    aiAnalysis: {
      score: 94,
      classification: 'Alta probabilidade de particular',
      indicators: [
        'Expressão explícita: "Tratar direto com proprietário"',
        'Expressão: "Vendo meu apartamento"',
        'Motivo de venda citado: "Motivo: mudança de estado"',
        'Contato direto informado pelo anunciante'
      ],
      counterIndicators: [],
      reasoning: 'Anúncio rico em detalhes pessoais de mobília e motivos de mudança. O texto enfatiza negociação direta e ausência de agenciamento formal prévio.',
      suggestedApproach: 'Abordagem focada em apresentar perfil de comprador investidor da Connect Imóveis pronto para fechar negócio à vista sem burocracia.',
      suggestedMessage: 'Olá Paulo Henrique, tudo bem? Me chamo Carlos da Connect Imóveis em Itapema. Vi seu anúncio do belíssimo apartamento de 3 suítes na Meia Praia. Temos dois clientes da nossa carteira buscando exatamente esse perfil de vista mar com 2 vagas. Você aceitaria que apresentássemos o imóvel para esse comprador qualificado?',
      analyzedAt: '2026-11-08T15:12:00Z',
    },
    advertiser: {
      name: 'Dr. Paulo Henrique Ramos',
      phone: '(47) 99124-7788',
      email: 'paulo.ramos.sc@gmail.com',
      type: 'Particular',
      isOwnerConfirmed: true,
      doNotContact: false,
      consentNotes: 'Contato inicial autorizado pelo proprietário via WhatsApp',
    },
    crmStage: 'Interessado em parceria',
    assignedToUserId: 'usr-3',
    assignedUserName: 'Rodrigo Silveira',
    isFavorite: true,
    tags: ['Vista Mar', 'Mobiliado', 'Proprietário Conectado', 'Multifonte'],
    createdAt: '2026-11-08T15:10:00Z',
    updatedAt: '2026-11-09T18:20:00Z',
  },
  {
    id: 'prop-2',
    title: 'Casa de Alto Padrão em Perequê - Porto Belo (Direto com Dono)',
    type: 'Casa',
    price: 2450000,
    originalPrice: 2450000,
    condoFee: 0,
    iptu: 3100,
    city: 'Porto Belo',
    neighborhood: 'Balneário Perequê',
    address: 'Rua Albatroz, próximo à praia de Perequê',
    isApproximateLocation: true,
    lat: -27.1592,
    lng: -48.5678,
    areaPrivate: 230,
    bedrooms: 4,
    suites: 2,
    bathrooms: 4,
    parkingSpots: 3,
    description: 'Casa recém construída a 200m da praia de Perequê em Porto Belo. Acabamento fino, porcelanato retificado, piscina aquecida com cascata e espaço gourmet completo. Sou o proprietário da obra, documentação toda 100% pronta com habite-se averbado. Não deixo em exclusividade.',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80'
    ],
    primarySource: 'Chaves na Mão',
    sources: [
      {
        id: 'src-2',
        source: 'Chaves na Mão',
        originalUrl: 'https://www.chavesnamao.com.br/imovel/casa-pereque-porto-belo-direto-883921',
        externalId: 'CNM-883921',
        price: 2450000,
        title: 'Casa Alto Padrão Perequê Porto Belo Direto com Dono',
        publishedAt: '2026-11-09T08:15:00Z',
        discoveredAt: '2026-11-09T08:50:00Z',
        advertiserName: 'Eng. Roberto Zandonai',
        advertiserContact: '(47) 99933-2190',
      }
    ],
    aiAnalysis: {
      score: 91,
      classification: 'Alta probabilidade de particular',
      indicators: [
        'Expressão: "Sou o proprietário da obra"',
        'Expressão: "Direto com Dono"',
        'Menção a documentação pessoal e habite-se averbado',
        'Ausência de CRECI'
      ],
      counterIndicators: [],
      reasoning: 'O anunciante se qualifica abertamente como proprietário/construtor pessoa física da casa em Perequê e informa situação do habite-se.',
      suggestedApproach: 'Destacar agilidade de vendas da Connect Imóveis em Porto Belo/Perequê e modelo de parceria não exclusiva com comissão garantida.',
      suggestedMessage: 'Olá Engenheiro Roberto, tudo bem? Acompanhamos sua obra em Perequê, projeto espetacular! Aqui é a Fernanda da Connect Imóveis. Temos investidores procurando casa pronta com piscina nessa região exata de Porto Belo. Podemos cadastrar sem exclusividade para levar essa demanda até você?',
      analyzedAt: '2026-11-09T08:52:00Z',
    },
    advertiser: {
      name: 'Eng. Roberto Zandonai',
      phone: '(47) 99933-2190',
      type: 'Particular',
      isOwnerConfirmed: true,
      doNotContact: false,
    },
    crmStage: 'Primeiro contato',
    assignedToUserId: 'usr-4',
    assignedUserName: 'Fernanda Becker',
    isFavorite: true,
    tags: ['Piscina', 'Perequê', 'Casa Nova', 'Habite-se'],
    createdAt: '2026-11-09T08:50:00Z',
    updatedAt: '2026-11-09T14:10:00Z',
  },
  {
    id: 'prop-3',
    title: 'Cobertura Duplex em Bombinhas - Praia de Mariscal',
    type: 'Cobertura',
    price: 1680000,
    originalPrice: 1750000,
    condoFee: 620,
    iptu: 1900,
    city: 'Bombinhas',
    neighborhood: 'Mariscal',
    address: 'Rua Amendoeira, 150m da praia',
    isApproximateLocation: true,
    lat: -27.1895,
    lng: -48.4981,
    areaPrivate: 165,
    bedrooms: 3,
    suites: 2,
    bathrooms: 3,
    parkingSpots: 2,
    description: 'Proprietário vende cobertura duplex sensacional em Mariscal, Bombinhas. Jacuzzi privativa no terraço com linda vista para as montanhas e mar. Totalmente mobiliado e climatizado. Excelente rentabilidade com locação de temporada (posso comprovar faturamento). Sem intermediários.',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80'
    ],
    primarySource: 'Viva Real',
    sources: [
      {
        id: 'src-3',
        source: 'Viva Real',
        originalUrl: 'https://www.vivareal.com.br/imovel/cobertura-mariscal-bombinhas-direto-772183',
        externalId: 'VR-772183',
        price: 1680000,
        title: 'Cobertura Duplex Mariscal Bombinhas Jacuzzi',
        publishedAt: '2026-11-07T12:00:00Z',
        discoveredAt: '2026-11-07T13:40:00Z',
        advertiserName: 'Luciana Martins Varella',
        advertiserContact: '(48) 99841-5520',
      }
    ],
    aiAnalysis: {
      score: 88,
      classification: 'Alta probabilidade de particular',
      indicators: [
        'Expressão explícita: "Proprietário vende"',
        'Expressão: "Sem intermediários"',
        'Citação a rentabilidade de locação própria: "posso comprovar faturamento"'
      ],
      counterIndicators: [],
      reasoning: 'O anúncio oferece histórico de locação direta da família e afirma venda sem intermediários.',
      suggestedApproach: 'Foco no perfil investidor da carteira de Bombinhas da Connect Imóveis.',
      suggestedMessage: 'Olá Luciana, tudo bem? Me chamo Mariana Duarte da Connect Imóveis. Vi o anúncio da sua cobertura duplex no Mariscal. A Connect trabalha fortemente com compradores que buscam rentabilidade de temporada em Bombinhas. Seria um prazer agendar uma rápida conversa.',
      analyzedAt: '2026-11-07T13:45:00Z',
    },
    advertiser: {
      name: 'Luciana Martins Varella',
      phone: '(48) 99841-5520',
      type: 'Particular',
      isOwnerConfirmed: true,
      doNotContact: false,
    },
    crmStage: 'Em negociação',
    assignedToUserId: 'usr-2',
    assignedUserName: 'Mariana Duarte',
    isFavorite: false,
    tags: ['Jacuzzi', 'Mariscal', 'Rentabilidade'],
    createdAt: '2026-11-07T13:40:00Z',
    updatedAt: '2026-11-10T02:00:00Z',
  },
  {
    id: 'prop-4',
    title: 'Apartamento Quadra Mar Barra Sul - Balneário Camboriú',
    type: 'Apartamento',
    price: 3200000,
    originalPrice: 3200000,
    condoFee: 1250,
    iptu: 4500,
    city: 'Balneário Camboriú',
    neighborhood: 'Barra Sul',
    address: 'Av. Atlântica / Rua 3700',
    isApproximateLocation: true,
    lat: -27.0048,
    lng: -48.6145,
    areaPrivate: 178,
    bedrooms: 4,
    suites: 4,
    bathrooms: 5,
    parkingSpots: 3,
    description: 'Imóvel particular à venda. Andar alto na Barra Sul em Balneário Camboriú. 4 suítes, living integrado, 3 vagas privativas. Empreendimento com lazer de resort completo. Aceito carro ou apartamento menor em Itapema ou BC como parte do pagamento. Chamar no WhatsApp.',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1502005229762-ee152d8205bd?auto=format&fit=crop&w=1000&q=80'
    ],
    primarySource: 'ZAP Imóveis',
    sources: [
      {
        id: 'src-4',
        source: 'ZAP Imóveis',
        originalUrl: 'https://www.zapimoveis.com.br/imovel/apartamento-barra-sul-balneario-camboriu-994012',
        externalId: 'ZAP-994012',
        price: 3200000,
        title: 'Barra Sul 4 suítes particular aceita permuta',
        publishedAt: '2026-11-09T16:00:00Z',
        discoveredAt: '2026-11-09T16:45:00Z',
        advertiserName: 'Marcos Vinícius Siqueira',
        advertiserContact: '(47) 98812-9090',
      }
    ],
    aiAnalysis: {
      score: 82,
      classification: 'Alta probabilidade de particular',
      indicators: [
        'Expressão: "Imóvel particular à venda"',
        'Disposição para permuta direta com veículo/imóvel menor',
        'Linguagem direta e pessoal'
      ],
      counterIndicators: [],
      reasoning: 'Anúncio cita expressamente condição particular e interesse em permuta específica por imóveis em Itapema/BC.',
      suggestedApproach: 'Apresentar opções de permuta da carteira de Itapema da Connect Imóveis para facilitar o fechamento.',
      suggestedMessage: 'Olá Marcos Vinícius, tudo bem? Vi seu anúncio na Barra Sul. Temos investidores com apartamentos em Itapema procurando upgrade para a Barra Sul em BC. Essa troca direta te interessaria?',
      analyzedAt: '2026-11-09T16:50:00Z',
    },
    advertiser: {
      name: 'Marcos Vinícius Siqueira',
      phone: '(47) 98812-9090',
      type: 'Particular',
      isOwnerConfirmed: true,
      doNotContact: false,
    },
    crmStage: 'Autorização de venda',
    assignedToUserId: 'usr-1',
    assignedUserName: 'Carlos Albuquerque',
    isFavorite: true,
    tags: ['Barra Sul', 'Permuta', '4 Suítes', 'Lazer Resort'],
    createdAt: '2026-11-09T16:45:00Z',
    updatedAt: '2026-11-10T03:15:00Z',
  },
  {
    id: 'prop-5',
    title: 'Terreno Plano Próximo à Praia do Canto - Itapema',
    type: 'Terreno',
    price: 890000,
    originalPrice: 890000,
    city: 'Itapema',
    neighborhood: 'Canto da Praia',
    address: 'Rua 109, Canto da Praia',
    isApproximateLocation: true,
    lat: -27.0862,
    lng: -48.6015,
    areaPrivate: 360,
    bedrooms: 0,
    suites: 0,
    bathrooms: 0,
    parkingSpots: 0,
    description: 'Terreno da família há mais de 20 anos, 12x30m (360m²), topografia plana, rua pavimentada, escritura pública registrada no cartório de Itapema. Excelente para sobrado de alto padrão ou pousada charmosa. Direto com os herdeiros/proprietários.',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80'
    ],
    primarySource: 'OLX',
    sources: [
      {
        id: 'src-5',
        source: 'OLX',
        originalUrl: 'https://sc.olx.com.br/imoveis/itapema/terreno-canto-da-praia-360m-direto-882103',
        externalId: 'OLX-882103',
        price: 890000,
        title: 'Terreno Canto da Praia 360m plano escriturado',
        publishedAt: '2026-11-08T09:00:00Z',
        discoveredAt: '2026-11-08T10:15:00Z',
        advertiserName: 'Família Souza',
        advertiserContact: '(47) 99201-1122',
      }
    ],
    aiAnalysis: {
      score: 95,
      classification: 'Alta probabilidade de particular',
      indicators: [
        'Expressão: "Direto com os herdeiros/proprietários"',
        'Histórico familiar: "Terreno da família há mais de 20 anos"',
        'Especificação de escritura pública em cartório'
      ],
      counterIndicators: [],
      reasoning: 'Anúncio autêntico de herdeiros com terreno próprio e documentação regular.',
      suggestedApproach: 'Oferecer aos construtores parceiros da Connect Imóveis em Itapema.',
      suggestedMessage: 'Olá Família Souza! Sou o Rodrigo da Connect Imóveis em Itapema. Atendemos construtoras sólidas que buscam terrenos no Canto da Praia para pagamento à vista. Vocês têm interesse em receber uma proposta?',
      analyzedAt: '2026-11-08T10:20:00Z',
    },
    advertiser: {
      name: 'Família Souza',
      phone: '(47) 99201-1122',
      type: 'Particular',
      isOwnerConfirmed: true,
      doNotContact: false,
    },
    crmStage: 'Em análise',
    assignedToUserId: 'usr-3',
    assignedUserName: 'Rodrigo Silveira',
    isFavorite: false,
    tags: ['Terreno', 'Canto da Praia', 'Escriturado', 'Herança'],
    createdAt: '2026-11-08T10:15:00Z',
    updatedAt: '2026-11-08T10:15:00Z',
  },
  {
    id: 'prop-6',
    title: 'Apartamento 2 Dormitórios no Centro de Tijucas',
    type: 'Apartamento',
    price: 420000,
    originalPrice: 420000,
    condoFee: 280,
    iptu: 650,
    city: 'Tijucas',
    neighborhood: 'Centro',
    address: 'Rua Florianópolis',
    isApproximateLocation: true,
    lat: -27.2415,
    lng: -48.6341,
    areaPrivate: 72,
    bedrooms: 2,
    suites: 1,
    bathrooms: 2,
    parkingSpots: 1,
    description: 'Apartamento seminovo no centro de Tijucas. 2 quartos sendo 1 suíte, sacada com churrasqueira. Pronto para morar. Motivo de transferência de trabalho para Florianópolis. Venda rápida pelo dono.',
    images: [
      'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1000&q=80'
    ],
    primarySource: 'Facebook Marketplace',
    sources: [
      {
        id: 'src-6',
        source: 'Facebook Marketplace',
        originalUrl: 'https://facebook.com/marketplace/item/4481029381',
        externalId: 'FB-4481029381',
        price: 420000,
        title: 'Apto Tijucas Centro 2 quartos dono direto',
        publishedAt: '2026-11-09T11:00:00Z',
        discoveredAt: '2026-11-09T12:00:00Z',
        advertiserName: 'Tiago Mendes',
        advertiserContact: '(48) 99177-3344',
      }
    ],
    aiAnalysis: {
      score: 86,
      classification: 'Alta probabilidade de particular',
      indicators: [
        'Expressão: "Venda rápida pelo dono"',
        'Motivo pessoal: "transferência de trabalho para Florianópolis"'
      ],
      counterIndicators: [],
      reasoning: 'Motivo pessoal autêntico de transferência de emprego.',
      suggestedApproach: 'Apresentar compradores com financiamento bancário pré-aprovado.',
      suggestedMessage: 'Olá Tiago! Sou a Fernanda da Connect Imóveis. Parabéns pelo apartamento em Tijucas. Temos clientes com crédito pré-aprovado para a região central. Podemos auxiliá-lo a fechar sua venda com agilidade e segurança jurídica?',
      analyzedAt: '2026-11-09T12:05:00Z',
    },
    advertiser: {
      name: 'Tiago Mendes',
      phone: '(48) 99177-3344',
      type: 'Particular',
      isOwnerConfirmed: true,
      doNotContact: false,
    },
    crmStage: 'Novo anúncio',
    assignedToUserId: 'usr-4',
    assignedUserName: 'Fernanda Becker',
    isFavorite: false,
    tags: ['Tijucas', 'Seminovo', 'Venda Rápida'],
    createdAt: '2026-11-09T12:00:00Z',
    updatedAt: '2026-11-09T12:00:00Z',
  },
  {
    id: 'prop-7',
    title: 'Apartamento Mobiliado Brava Home Resort - Praia Brava, Itajaí',
    type: 'Apartamento',
    price: 3950000,
    originalPrice: 4100000,
    condoFee: 1800,
    iptu: 5200,
    city: 'Itajaí',
    neighborhood: 'Praia Brava',
    address: 'Av. Osvaldo Reis / Brava',
    isApproximateLocation: true,
    lat: -26.9381,
    lng: -48.6415,
    areaPrivate: 210,
    bedrooms: 4,
    suites: 4,
    bathrooms: 5,
    parkingSpots: 3,
    description: 'Espetacular apartamento finamente decorado na Praia Brava. 4 suítes, adega climatizada, automação residencial e vista mar deslumbrante. Anúncio feito pelo proprietário. Favor corretores trazerem apenas clientes cadastrados e com potencial real.',
    images: [
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80'
    ],
    primarySource: 'ZAP Imóveis',
    sources: [
      {
        id: 'src-7',
        source: 'ZAP Imóveis',
        originalUrl: 'https://www.zapimoveis.com.br/imovel/apartamento-praia-brava-itajai-direto-prop-8812',
        externalId: 'ZAP-8812',
        price: 3950000,
        title: 'Brava Home Resort 4 suítes proprietário',
        publishedAt: '2026-11-07T18:00:00Z',
        discoveredAt: '2026-11-08T08:30:00Z',
        advertiserName: 'Dr. Fernando Lins',
        advertiserContact: '(47) 99655-0011',
      }
    ],
    aiAnalysis: {
      score: 89,
      classification: 'Alta probabilidade de particular',
      indicators: [
        'Expressão: "Anúncio feito pelo proprietário"',
        'Exigência a corretores: "trazerem apenas clientes cadastrados"'
      ],
      counterIndicators: [],
      reasoning: 'Condição típica de proprietário de alto padrão na Brava que aceita visitas se houver comprador qualificado real.',
      suggestedApproach: 'Envio de termo de visita com comprador qualificado da Connect Imóveis.',
      suggestedMessage: 'Olá Dr. Fernando, boa tarde! Aqui é o Carlos da Connect Imóveis. Respeitamos totalmente suas diretrizes. Temos um empresário de Curitiba com interesse específico na Brava para este final de semana. Gostaria de verificar a viabilidade de agendamento.',
      analyzedAt: '2026-11-08T08:35:00Z',
    },
    advertiser: {
      name: 'Dr. Fernando Lins',
      phone: '(47) 99655-0011',
      type: 'Particular',
      isOwnerConfirmed: true,
      doNotContact: false,
    },
    crmStage: 'Possível proprietário',
    assignedToUserId: 'usr-1',
    assignedUserName: 'Carlos Albuquerque',
    isFavorite: true,
    tags: ['Praia Brava', 'Alto Padrão', 'Vista Mar', 'Automação'],
    createdAt: '2026-11-08T08:30:00Z',
    updatedAt: '2026-11-09T10:00:00Z',
  },
  {
    id: 'prop-8',
    title: 'Casa em Condomínio Fechado - Camboriú',
    type: 'Casa',
    price: 1350000,
    originalPrice: 1350000,
    condoFee: 450,
    iptu: 1400,
    city: 'Camboriú',
    neighborhood: 'Areias',
    address: 'Condomínio Caledônia Private Village',
    isApproximateLocation: true,
    lat: -27.0255,
    lng: -48.6533,
    areaPrivate: 195,
    bedrooms: 3,
    suites: 3,
    bathrooms: 4,
    parkingSpots: 2,
    description: 'Casa térrea moderna no Caledônia em Camboriú. Pé direito duplo, energia solar instalada, 3 suítes plenas. Venda direta pelos donos que residem no local. Excelente segurança para famílias.',
    images: [
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1000&q=80'
    ],
    primarySource: 'OLX',
    sources: [
      {
        id: 'src-8',
        source: 'OLX',
        originalUrl: 'https://sc.olx.com.br/imoveis/camboriu/casa-condominio-caledonia-direto-donos-1029',
        externalId: 'OLX-1029',
        price: 1350000,
        title: 'Casa Caledônia Camboriú 3 suítes direta com donos',
        publishedAt: '2026-11-09T14:00:00Z',
        discoveredAt: '2026-11-09T15:10:00Z',
        advertiserName: 'Juliana e Gustavo',
        advertiserContact: '(47) 99712-4433',
      }
    ],
    aiAnalysis: {
      score: 92,
      classification: 'Alta probabilidade de particular',
      indicators: [
        'Expressão: "Venda direta pelos donos que residem no local"',
        'Contato de casal morador'
      ],
      counterIndicators: [],
      reasoning: 'Proprietários moradores do condomínio Caledônia em Camboriú.',
      suggestedApproach: 'Parceria de captação e divulgação direcionada.',
      suggestedMessage: 'Olá Juliana e Gustavo! Aqui é a Mariana da Connect Imóveis. Adoramos o anúncio da casa de vocês no Caledônia! Temos clientes procurando casa térrea pronta no condomínio. Podemos conversar?',
      analyzedAt: '2026-11-09T15:15:00Z',
    },
    advertiser: {
      name: 'Juliana e Gustavo',
      phone: '(47) 99712-4433',
      type: 'Particular',
      isOwnerConfirmed: true,
      doNotContact: false,
    },
    crmStage: 'Aguardando resposta',
    assignedToUserId: 'usr-2',
    assignedUserName: 'Mariana Duarte',
    isFavorite: false,
    tags: ['Condomínio Fechado', 'Energia Solar', 'Camboriú'],
    createdAt: '2026-11-09T15:10:00Z',
    updatedAt: '2026-11-09T15:10:00Z',
  }
];

export const INITIAL_CONTACT_HISTORY: ContactHistory[] = [
  {
    id: 'cnt-1',
    propertyId: 'prop-1',
    userId: 'usr-3',
    userName: 'Rodrigo Silveira',
    channel: 'WhatsApp',
    date: '2026-11-09T10:30:00Z',
    messageContent: 'Olá Paulo Henrique! Sou o Rodrigo da Connect Imóveis. Temos investidores qualificados buscando 3 suítes na Meia Praia...',
    responseStatus: 'Respondido',
    notes: 'Proprietário foi extremamente receptivo. Solicitou que avisemos com 2 horas de antecedência para organizar a visita.',
    optOutRequested: false,
  },
  {
    id: 'cnt-2',
    propertyId: 'prop-3',
    userId: 'usr-2',
    userName: 'Mariana Duarte',
    channel: 'WhatsApp',
    date: '2026-11-08T16:00:00Z',
    messageContent: 'Olá Luciana! Aqui é a Mariana da Connect Imóveis em Bombinhas...',
    responseStatus: 'Agendou visita',
    notes: 'Agendada visita técnica para quarta-feira às 15h para fotos profissionais e assinatura de autorização de venda.',
    optOutRequested: false,
  }
];

export const INITIAL_SEARCH_CONFIGS: SearchConfig[] = [
  {
    id: 'cfg-1',
    name: 'Foco Costa Esmeralda - Porto Belo, Itapema e Bombinhas',
    cities: ['Porto Belo', 'Itapema', 'Bombinhas'],
    propertyTypes: ['Apartamento', 'Casa', 'Cobertura'],
    minPrice: 500000,
    maxPrice: 5000000,
    minBedrooms: 2,
    sources: ['OLX', 'Chaves na Mão', 'ZAP Imóveis', 'Viva Real', 'Facebook Marketplace'],
    minOwnerProbabilityScore: 60,
    isActive: true,
    createdAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'cfg-2',
    name: 'Foco Alto Padrão Balneário Camboriú & Brava',
    cities: ['Balneário Camboriú', 'Itajaí'],
    propertyTypes: ['Apartamento', 'Cobertura'],
    minPrice: 2000000,
    minArea: 130,
    sources: ['ZAP Imóveis', 'Viva Real', 'OLX'],
    minOwnerProbabilityScore: 70,
    isActive: true,
    createdAt: '2026-11-02T00:00:00Z',
  },
  {
    id: 'cfg-3',
    name: 'Oportunidades em Tijucas e Camboriú',
    cities: ['Tijucas', 'Camboriú'],
    propertyTypes: ['Casa', 'Apartamento', 'Terreno'],
    maxPrice: 1500000,
    sources: ['OLX', 'Facebook Marketplace', 'Chaves na Mão'],
    minOwnerProbabilityScore: 50,
    isActive: true,
    createdAt: '2026-11-03T00:00:00Z',
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-1',
    userId: 'usr-1',
    userName: 'Carlos Albuquerque',
    action: 'LOGIN',
    entityType: 'User',
    entityId: 'usr-1',
    details: 'Login administrativo com sucesso via sessão segura.',
    timestamp: '2026-11-10T04:00:00Z',
    ipAddress: '189.102.40.12',
  },
  {
    id: 'aud-2',
    userId: 'usr-3',
    userName: 'Rodrigo Silveira',
    action: 'MOVE_CRM_STAGE',
    entityType: 'Property',
    entityId: 'prop-1',
    details: 'Avançou imóvel de "Proprietário confirmado" para "Interessado em parceria".',
    timestamp: '2026-11-09T18:20:00Z',
    ipAddress: '177.85.12.9',
  },
  {
    id: 'aud-3',
    userId: 'usr-2',
    userName: 'Mariana Duarte',
    action: 'ASSIGN_BROKER',
    entityType: 'Property',
    entityId: 'prop-3',
    details: 'Atribuiu lead da Cobertura em Bombinhas para Mariana Duarte.',
    timestamp: '2026-11-08T09:10:00Z',
    ipAddress: '189.102.40.12',
  }
];

// Persistent Store Class with file backup and fast in-memory access
class DatabaseStore {
  users: User[] = [...INITIAL_USERS];
  properties: Property[] = [...INITIAL_PROPERTIES];
  connectors: Connector[] = [...INITIAL_CONNECTORS];
  connectorLogs: ConnectorLog[] = [...INITIAL_CONNECTOR_LOGS];
  contactHistory: ContactHistory[] = [...INITIAL_CONTACT_HISTORY];
  searchConfigs: SearchConfig[] = [...INITIAL_SEARCH_CONFIGS];
  auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  availableCities: string[] = [
    'Porto Belo',
    'Itapema',
    'Bombinhas',
    'Balneário Camboriú',
    'Camboriú',
    'Itajaí',
    'Tijucas',
  ];

  constructor() {
    this.loadFromFile();
  }

  private getStorageFilePath() {
    return path.resolve(process.cwd(), '.radar_db.json');
  }

  private loadFromFile() {
    try {
      const filePath = this.getStorageFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw);
        if (data.properties && Array.isArray(data.properties)) this.properties = data.properties;
        if (data.users && Array.isArray(data.users)) this.users = data.users;
        if (data.connectors && Array.isArray(data.connectors)) this.connectors = data.connectors;
        if (data.contactHistory && Array.isArray(data.contactHistory)) this.contactHistory = data.contactHistory;
        if (data.searchConfigs && Array.isArray(data.searchConfigs)) this.searchConfigs = data.searchConfigs;
        if (data.availableCities && Array.isArray(data.availableCities)) this.availableCities = data.availableCities;
        if (data.auditLogs && Array.isArray(data.auditLogs)) this.auditLogs = data.auditLogs;
      }
    } catch (e) {
      console.warn('Could not load persistent storage from file, starting with default seeded records.', e);
    }
  }

  saveToFile() {
    try {
      const filePath = this.getStorageFilePath();
      const payload = {
        users: this.users,
        properties: this.properties,
        connectors: this.connectors,
        contactHistory: this.contactHistory,
        searchConfigs: this.searchConfigs,
        availableCities: this.availableCities,
        auditLogs: this.auditLogs.slice(0, 500),
      };
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save store to file:', e);
    }
  }

  logAudit(userId: string, userName: string, action: string, entityType: string, entityId: string, details: string) {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      userName,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    this.saveToFile();
    return log;
  }

  getDashboardMetrics(): DashboardMetrics {
    const totalListings = this.properties.length;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const newListingsToday = this.properties.filter(p => p.createdAt.startsWith(todayStr)).length;
    const possibleOwners = this.properties.filter(p => p.aiAnalysis.score >= 55 && p.aiAnalysis.score < 80).length;
    const confirmedOwners = this.properties.filter(p => p.aiAnalysis.score >= 80 || p.advertiser.isOwnerConfirmed).length;
    const qualifiedProperties = this.properties.filter(p => p.aiAnalysis.score >= 70).length;
    const inNegotiation = this.properties.filter(p => p.crmStage === 'Em negociação' || p.crmStage === 'Interessado em parceria').length;
    const capturedProperties = this.properties.filter(p => p.crmStage === 'Imóvel captado' || p.crmStage === 'Autorização de venda').length;

    const conversionRate = totalListings > 0 ? Number(((capturedProperties / totalListings) * 100).toFixed(1)) : 0;

    // City distribution
    const cityMap = new Map<string, { count: number; captured: number }>();
    for (const city of this.availableCities) {
      cityMap.set(city, { count: 0, captured: 0 });
    }
    for (const p of this.properties) {
      const current = cityMap.get(p.city) || { count: 0, captured: 0 };
      current.count += 1;
      if (p.crmStage === 'Imóvel captado' || p.crmStage === 'Autorização de venda') {
        current.captured += 1;
      }
      cityMap.set(p.city, current);
    }
    const byCity = Array.from(cityMap.entries()).map(([city, val]) => ({
      city,
      count: val.count,
      captured: val.captured,
    })).sort((a, b) => b.count - a.count);

    // Source distribution
    const sourceMap = new Map<string, { count: number; ownerScores: number[] }>();
    for (const p of this.properties) {
      const current = sourceMap.get(p.primarySource) || { count: 0, ownerScores: [] };
      current.count += 1;
      current.ownerScores.push(p.aiAnalysis.score);
      sourceMap.set(p.primarySource, current);
    }
    const bySource = Array.from(sourceMap.entries()).map(([source, val]) => {
      const highOwners = val.ownerScores.filter(s => s >= 70).length;
      return {
        source: source as any,
        count: val.count,
        ownerPercentage: val.count > 0 ? Math.round((highOwners / val.count) * 100) : 0,
      };
    });

    // Pipeline stages
    const stages: PipelineStage[] = [
      'Novo anúncio',
      'Em análise',
      'Possível proprietário',
      'Proprietário confirmado',
      'Primeiro contato',
      'Aguardando resposta',
      'Interessado em parceria',
      'Em negociação',
      'Autorização de venda',
      'Imóvel captado',
      'Descartado',
    ];
    const pipelineSummary = stages.map(stage => ({
      stage,
      count: this.properties.filter(p => p.crmStage === stage).length,
    }));

    const monthlyPerformance = [
      { month: 'Jun', captured: 3, leads: 22 },
      { month: 'Jul', captured: 5, leads: 34 },
      { month: 'Ago', captured: 7, leads: 41 },
      { month: 'Set', captured: 9, leads: 52 },
      { month: 'Out', captured: 14, leads: 68 },
      { month: 'Nov', captured: capturedProperties + 6, leads: totalListings + 18 },
    ];

    return {
      totalListings,
      newListingsToday,
      possibleOwners,
      confirmedOwners,
      qualifiedProperties,
      inNegotiation,
      capturedProperties,
      conversionRate,
      byCity,
      bySource,
      pipelineSummary,
      monthlyPerformance,
    };
  }
}

export const db = new DatabaseStore();
