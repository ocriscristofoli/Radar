import express, { Request, Response } from 'express';
import { db } from './db.ts';
import { analyzeListingWithGemini } from './gemini.ts';
import { checkDuplicity, mergeDuplicateIntoProperty } from './deduplication.ts';
import { Property, ListingSource, PipelineStage, ContactHistory, PropertyType, SourcePlatform } from '../src/types/index.ts';

export const apiRouter = express.Router();

// Helper to determine city coordinates approximation for SC
function getCityCoordinates(city: string): { lat: number; lng: number } {
  const norm = (city || '').toLowerCase();
  if (norm.includes('itapema')) return { lat: -27.1425, lng: -48.6083 };
  if (norm.includes('porto belo')) return { lat: -27.1592, lng: -48.5678 };
  if (norm.includes('bombinhas')) return { lat: -27.1895, lng: -48.4981 };
  if (norm.includes('balneário') || norm.includes('camboriú') && !norm.includes('camboriú')) return { lat: -27.0048, lng: -48.6145 };
  if (norm.includes('camboriú')) return { lat: -27.0255, lng: -48.6533 };
  if (norm.includes('itajaí') || norm.includes('itajai')) return { lat: -26.9381, lng: -48.6415 };
  if (norm.includes('tijucas')) return { lat: -27.2415, lng: -48.6341 };
  return { lat: -27.1425, lng: -48.6083 };
}

// 1. GET /api/properties - Filtered list
apiRouter.get('/properties', (req: Request, res: Response) => {
  const {
    city,
    neighborhood,
    type,
    source,
    minPrice,
    maxPrice,
    minScore,
    crmStage,
    assignedTo,
    search,
    favoriteOnly,
  } = req.query;

  let results = [...db.properties];

  if (city && typeof city === 'string' && city !== 'all') {
    results = results.filter(p => p.city.toLowerCase() === city.toLowerCase());
  }

  if (neighborhood && typeof neighborhood === 'string' && neighborhood !== 'all') {
    results = results.filter(p => p.neighborhood.toLowerCase().includes(neighborhood.toLowerCase()));
  }

  if (type && typeof type === 'string' && type !== 'all') {
    results = results.filter(p => p.type.toLowerCase() === type.toLowerCase());
  }

  if (source && typeof source === 'string' && source !== 'all') {
    results = results.filter(p => p.primarySource.toLowerCase() === source.toLowerCase() || p.sources.some(s => s.source.toLowerCase() === source.toLowerCase()));
  }

  if (minPrice) {
    results = results.filter(p => p.price >= Number(minPrice));
  }

  if (maxPrice) {
    results = results.filter(p => p.price <= Number(maxPrice));
  }

  if (minScore) {
    results = results.filter(p => p.aiAnalysis.score >= Number(minScore));
  }

  if (crmStage && typeof crmStage === 'string' && crmStage !== 'all') {
    results = results.filter(p => p.crmStage === crmStage);
  }

  if (assignedTo && typeof assignedTo === 'string' && assignedTo !== 'all') {
    results = results.filter(p => p.assignedToUserId === assignedTo);
  }

  if (favoriteOnly === 'true') {
    results = results.filter(p => p.isFavorite);
  }

  if (search && typeof search === 'string' && search.trim() !== '') {
    const q = search.toLowerCase();
    results = results.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.neighborhood.toLowerCase().includes(q) ||
      p.advertiser.name.toLowerCase().includes(q) ||
      (p.advertiser.phone && p.advertiser.phone.includes(q))
    );
  }

  // Sort by recent first
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    total: results.length,
    properties: results,
  });
});

// 2. GET /api/properties/:id - Single detail
apiRouter.get('/properties/:id', (req: Request, res: Response) => {
  const property = db.properties.find(p => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ error: 'Imóvel não encontrado.' });
  }

  const history = db.contactHistory.filter(c => c.propertyId === property.id);
  res.json({
    property,
    contactHistory: history,
  });
});

// 3. POST /api/properties - Create or import
apiRouter.post('/properties', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload.title || !payload.city) {
      return res.status(400).json({ error: 'Título e cidade são obrigatórios.' });
    }

    // Coordinates logic with approximate offset for privacy
    const baseCoords = getCityCoordinates(payload.city);
    const latOffset = (Math.random() - 0.5) * 0.015;
    const lngOffset = (Math.random() - 0.5) * 0.015;
    const lat = payload.lat || baseCoords.lat + latOffset;
    const lng = payload.lng || baseCoords.lng + lngOffset;

    // Check for duplicity
    const duplicityCheck = checkDuplicity(
      {
        title: payload.title,
        city: payload.city,
        neighborhood: payload.neighborhood || '',
        price: Number(payload.price) || 0,
        bedrooms: Number(payload.bedrooms) || 0,
        areaPrivate: Number(payload.areaPrivate) || 0,
        type: payload.type || 'Apartamento',
        description: payload.description || '',
      },
      db.properties
    );

    // If duplicate detected and merge is requested
    if (duplicityCheck.isMatch && duplicityCheck.matchedPropertyId && payload.forceMerge) {
      const existing = db.properties.find(p => p.id === duplicityCheck.matchedPropertyId);
      if (existing) {
        const newSource: ListingSource = {
          id: `src-${Date.now()}`,
          source: payload.primarySource || 'Manual / Assistido',
          originalUrl: payload.originalUrl || '',
          price: Number(payload.price) || existing.price,
          title: payload.title,
          publishedAt: new Date().toISOString(),
          discoveredAt: new Date().toISOString(),
          advertiserName: payload.advertiserName || existing.advertiser.name,
          advertiserContact: payload.advertiserContact || existing.advertiser.phone,
        };

        const merged = mergeDuplicateIntoProperty(existing, newSource);
        const index = db.properties.findIndex(p => p.id === existing.id);
        db.properties[index] = merged;
        db.saveToFile();

        db.logAudit(
          req.body.currentUserId || 'usr-1',
          req.body.currentUserName || 'Sistema',
          'MERGE_DUPLICATE',
          'Property',
          merged.id,
          `Anúncio vinculado como duplicata ao imóvel ID ${merged.id} (${duplicityCheck.reasons.join(', ')})`
        );

        return res.json({
          status: 'merged',
          duplicateDetected: true,
          property: merged,
          reasons: duplicityCheck.reasons,
        });
      }
    }

    // Run AI analysis
    const aiAnalysis = await analyzeListingWithGemini({
      title: payload.title,
      description: payload.description || '',
      price: Number(payload.price) || 0,
      city: payload.city,
      neighborhood: payload.neighborhood,
      advertiserName: payload.advertiserName,
      advertiserContact: payload.advertiserContact,
    });

    const defaultImages = [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
    ];

    const newPropId = `prop-${Date.now()}`;
    const primarySource: SourcePlatform = payload.primarySource || 'Manual / Assistido';

    const newProperty: Property = {
      id: newPropId,
      title: payload.title,
      type: payload.type || 'Apartamento',
      price: Number(payload.price) || 0,
      originalPrice: Number(payload.price) || 0,
      condoFee: Number(payload.condoFee) || 0,
      iptu: Number(payload.iptu) || 0,
      city: payload.city,
      neighborhood: payload.neighborhood || 'Centro',
      address: payload.address || '',
      isApproximateLocation: true,
      lat,
      lng,
      areaPrivate: Number(payload.areaPrivate) || 0,
      bedrooms: Number(payload.bedrooms) || 0,
      suites: Number(payload.suites) || 0,
      bathrooms: Number(payload.bathrooms) || 1,
      parkingSpots: Number(payload.parkingSpots) || 0,
      description: payload.description || '',
      images: Array.isArray(payload.images) && payload.images.length > 0 ? payload.images : defaultImages,
      primarySource,
      sources: [
        {
          id: `src-${Date.now()}`,
          source: primarySource,
          originalUrl: payload.originalUrl || '',
          price: Number(payload.price) || 0,
          title: payload.title,
          publishedAt: new Date().toISOString(),
          discoveredAt: new Date().toISOString(),
          advertiserName: payload.advertiserName || '',
          advertiserContact: payload.advertiserContact || '',
        },
      ],
      aiAnalysis,
      advertiser: {
        name: payload.advertiserName || 'Proprietário Anunciante',
        phone: payload.advertiserContact || '',
        email: payload.advertiserEmail || '',
        type: aiAnalysis.score >= 60 ? 'Particular' : 'Indefinido',
        isOwnerConfirmed: aiAnalysis.score >= 80,
        doNotContact: false,
        consentNotes: 'Captação cadastrada para qualificação comercial Connect Imóveis',
      },
      crmStage: (payload.crmStage as PipelineStage) || 'Novo anúncio',
      assignedToUserId: payload.assignedToUserId || 'usr-3',
      assignedUserName: payload.assignedUserName || 'Rodrigo Silveira',
      isFavorite: false,
      tags: aiAnalysis.score >= 75 ? ['Alta Probabilidade Particular'] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.properties.unshift(newProperty);
    db.saveToFile();

    db.logAudit(
      payload.currentUserId || 'usr-1',
      payload.currentUserName || 'Sistema',
      'CREATE_PROPERTY',
      'Property',
      newProperty.id,
      `Imóvel cadastrado/importado: "${newProperty.title}" em ${newProperty.city}. Score IA: ${aiAnalysis.score}`
    );

    res.status(201).json({
      status: 'created',
      duplicateWarning: duplicityCheck.isMatch ? duplicityCheck : null,
      property: newProperty,
    });
  } catch (err: any) {
    console.error('Error creating property:', err);
    res.status(500).json({ error: 'Falha ao processar cadastro do imóvel.' });
  }
});

// 4. PATCH /api/properties/:id - Update fields (stage, broker, etc.)
apiRouter.patch('/properties/:id', (req: Request, res: Response) => {
  const propertyIndex = db.properties.findIndex(p => p.id === req.params.id);
  if (propertyIndex === -1) {
    return res.status(404).json({ error: 'Imóvel não encontrado.' });
  }

  const existing = db.properties[propertyIndex];
  const updates = req.body;

  // Handle stage change
  const oldStage = existing.crmStage;
  if (updates.crmStage && updates.crmStage !== oldStage) {
    db.logAudit(
      updates.currentUserId || 'usr-1',
      updates.currentUserName || 'Usuário',
      'MOVE_CRM_STAGE',
      'Property',
      existing.id,
      `Estágio alterado de "${oldStage}" para "${updates.crmStage}"`
    );
  }

  // Handle assigned broker change
  if (updates.assignedToUserId && updates.assignedToUserId !== existing.assignedToUserId) {
    const user = db.users.find(u => u.id === updates.assignedToUserId);
    if (user) {
      updates.assignedUserName = user.name;
      db.logAudit(
        updates.currentUserId || 'usr-1',
        updates.currentUserName || 'Usuário',
        'ASSIGN_BROKER',
        'Property',
        existing.id,
        `Oportunidade atribuída a ${user.name}`
      );
    }
  }

  // Merge updates
  const updatedProperty: Property = {
    ...existing,
    ...updates,
    advertiser: {
      ...existing.advertiser,
      ...(updates.advertiser || {}),
    },
    updatedAt: new Date().toISOString(),
  };

  db.properties[propertyIndex] = updatedProperty;
  db.saveToFile();

  res.json({ property: updatedProperty });
});

// 5. POST /api/properties/:id/ai-analyze - Re-analyze with Gemini
apiRouter.post('/properties/:id/ai-analyze', async (req: Request, res: Response) => {
  const property = db.properties.find(p => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ error: 'Imóvel não encontrado.' });
  }

  try {
    const analysis = await analyzeListingWithGemini({
      title: property.title,
      description: property.description,
      price: property.price,
      city: property.city,
      neighborhood: property.neighborhood,
      advertiserName: property.advertiser.name,
      advertiserContact: property.advertiser.phone,
    });

    property.aiAnalysis = analysis;
    property.updatedAt = new Date().toISOString();
    db.saveToFile();

    db.logAudit(
      req.body.currentUserId || 'usr-1',
      req.body.currentUserName || 'Sistema',
      'AI_REANALYZE',
      'Property',
      property.id,
      `Reanálise de IA concluída. Novo score: ${analysis.score}/100 (${analysis.classification})`
    );

    res.json({ analysis, property });
  } catch (err: any) {
    console.error('Error in re-analysis:', err);
    res.status(500).json({ error: 'Falha ao reanalisar anúncio.' });
  }
});

// 6. POST /api/properties/:id/contact - Log communication
apiRouter.post('/properties/:id/contact', (req: Request, res: Response) => {
  const property = db.properties.find(p => p.id === req.params.id);
  if (!property) {
    return res.status(404).json({ error: 'Imóvel não encontrado.' });
  }

  const {
    userId,
    userName,
    channel,
    messageContent,
    responseStatus,
    notes,
    optOutRequested,
    advanceToStage,
  } = req.body;

  const log: ContactHistory = {
    id: `cnt-${Date.now()}`,
    propertyId: property.id,
    userId: userId || 'usr-1',
    userName: userName || 'Corretor Connect',
    channel: channel || 'WhatsApp',
    date: new Date().toISOString(),
    messageContent: messageContent || '',
    responseStatus: responseStatus || 'Aguardando',
    notes: notes || '',
    optOutRequested: !!optOutRequested,
  };

  db.contactHistory.unshift(log);

  // If user requested opt-out (LGPD "Não perturbe")
  if (optOutRequested) {
    property.advertiser.doNotContact = true;
    property.crmStage = 'Descartado';
  } else if (advanceToStage) {
    property.crmStage = advanceToStage;
  }

  property.updatedAt = new Date().toISOString();
  db.saveToFile();

  db.logAudit(
    log.userId,
    log.userName,
    'LOG_CONTACT',
    'ContactHistory',
    log.id,
    `Contato registrado via ${log.channel}. Status: ${log.responseStatus}. LGPD Opt-out: ${optOutRequested ? 'Sim' : 'Não'}`
  );

  res.status(201).json({ log, property });
});

// 7. POST /api/ai/parse-listing - Instant Raw Listing Text/URL Parser with Gemini
apiRouter.post('/ai/parse-listing', async (req: Request, res: Response) => {
  const { rawText, sourceUrl, sourcePlatform } = req.body;
  if (!rawText || rawText.trim() === '') {
    return res.status(400).json({ error: 'Texto ou link do anúncio é obrigatório.' });
  }

  try {
    const analysis = await analyzeListingWithGemini({
      title: rawText.slice(0, 150),
      description: rawText,
      advertiserName: '',
    });

    // Check if duplicate of existing properties
    const candidatePreview = {
      title: rawText.slice(0, 100),
      description: rawText,
      city: 'Itapema',
    };
    const duplicateCheck = checkDuplicity(candidatePreview, db.properties);

    res.json({
      extracted: {
        rawText,
        sourceUrl: sourceUrl || '',
        sourcePlatform: sourcePlatform || 'Manual / Assistido',
        aiAnalysis: analysis,
        duplicateWarning: duplicateCheck.isMatch ? duplicateCheck : null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao analisar anúncio via IA.' });
  }
});

// 8. GET /api/dashboard/metrics
apiRouter.get('/dashboard/metrics', (_req: Request, res: Response) => {
  const metrics = db.getDashboardMetrics();
  res.json(metrics);
});

// 9. GET /api/connectors
apiRouter.get('/connectors', (_req: Request, res: Response) => {
  res.json({
    connectors: db.connectors,
    logs: db.connectorLogs,
  });
});

// 10. POST /api/connectors/:id/sync - Trigger sync
apiRouter.post('/connectors/:id/sync', (req: Request, res: Response) => {
  const connector = db.connectors.find(c => c.id === req.params.id);
  if (!connector) {
    return res.status(404).json({ error: 'Conector não encontrado.' });
  }

  connector.lastSyncAt = new Date().toISOString();
  connector.recordsReceivedCount += Math.floor(Math.random() * 8) + 2;

  const logEntry = {
    id: `log-${Date.now()}`,
    source: connector.source,
    timestamp: new Date().toISOString(),
    level: 'SUCCESS' as const,
    message: `Sincronização autorizada executada para ${connector.source}.`,
    recordsCount: Math.floor(Math.random() * 8) + 2,
  };

  db.connectorLogs.unshift(logEntry);
  db.saveToFile();

  db.logAudit(
    req.body.currentUserId || 'usr-1',
    req.body.currentUserName || 'Sistema',
    'SYNC_CONNECTOR',
    'Connector',
    connector.id,
    `Sincronização acionada para fonte ${connector.source}`
  );

  res.json({ connector, log: logEntry });
});

// 11. GET /api/users
apiRouter.get('/users', (_req: Request, res: Response) => {
  const usersWithCounts = db.users.map(u => ({
    ...u,
    assignedLeadsCount: db.properties.filter(p => p.assignedToUserId === u.id).length,
  }));
  res.json({ users: usersWithCounts });
});

// 12. POST /api/users - Create User
apiRouter.post('/users', (req: Request, res: Response) => {
  const { name, email, role, phone, creci } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e email são obrigatórios.' });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    role: role || 'CORRETOR',
    active: true,
    phone: phone || '',
    creci: creci || '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    assignedLeadsCount: 0,
  };

  db.users.push(newUser);
  db.saveToFile();

  db.logAudit(
    req.body.currentUserId || 'usr-1',
    req.body.currentUserName || 'Admin',
    'CREATE_USER',
    'User',
    newUser.id,
    `Novo usuário ${newUser.name} cadastrado como ${newUser.role}`
  );

  res.status(201).json({ user: newUser });
});

// 13. GET /api/search-configs
apiRouter.get('/search-configs', (_req: Request, res: Response) => {
  res.json({
    configs: db.searchConfigs,
    availableCities: db.availableCities,
  });
});

// 14. POST /api/search-configs
apiRouter.post('/search-configs', (req: Request, res: Response) => {
  const { name, cities, propertyTypes, minPrice, maxPrice, minOwnerProbabilityScore, sources } = req.body;
  if (!name || !cities || cities.length === 0) {
    return res.status(400).json({ error: 'Nome e ao menos uma cidade são obrigatórios.' });
  }

  const newConfig = {
    id: `cfg-${Date.now()}`,
    name,
    cities,
    propertyTypes: propertyTypes || ['Apartamento', 'Casa'],
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sources: sources || ['OLX', 'Chaves na Mão', 'ZAP Imóveis', 'Viva Real'],
    minOwnerProbabilityScore: Number(minOwnerProbabilityScore) || 50,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  db.searchConfigs.push(newConfig);
  db.saveToFile();

  res.status(201).json({ config: newConfig });
});

// 15. POST /api/cities - Add new city
apiRouter.post('/cities', (req: Request, res: Response) => {
  const { city } = req.body;
  if (!city || city.trim() === '') {
    return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });
  }

  const clean = city.trim();
  if (!db.availableCities.includes(clean)) {
    db.availableCities.push(clean);
    db.saveToFile();
  }

  res.json({ availableCities: db.availableCities });
});

// 16. GET /api/audit-logs
apiRouter.get('/audit-logs', (_req: Request, res: Response) => {
  res.json({ logs: db.auditLogs });
});

// 17. GET /api/reports/export-csv - CSV export
apiRouter.get('/reports/export-csv', (_req: Request, res: Response) => {
  const header = [
    'ID',
    'Titulo',
    'Cidade',
    'Bairro',
    'Valor_R$',
    'Tipo',
    'Area_m2',
    'Quartos',
    'Fonte_Principal',
    'Score_IA',
    'Classificacao_IA',
    'Nome_Anunciante',
    'Telefone_Anunciante',
    'Proprietario_Confirmado',
    'Estagio_CRM',
    'Corretor_Responsavel',
    'Data_Descoberta'
  ];

  const rows = db.properties.map(p => [
    `"${p.id}"`,
    `"${p.title.replace(/"/g, '""')}"`,
    `"${p.city}"`,
    `"${p.neighborhood}"`,
    p.price,
    `"${p.type}"`,
    p.areaPrivate,
    p.bedrooms,
    `"${p.primarySource}"`,
    p.aiAnalysis.score,
    `"${p.aiAnalysis.classification}"`,
    `"${(p.advertiser.name || '').replace(/"/g, '""')}"`,
    `"${p.advertiser.phone || ''}"`,
    p.advertiser.isOwnerConfirmed ? 'SIM' : 'NAO',
    `"${p.crmStage}"`,
    `"${p.assignedUserName || ''}"`,
    `"${p.createdAt}"`
  ]);

  const csvContent = [header.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="radar_proprietarios_connect_imoveis.csv"');
  res.send('\uFEFF' + csvContent); // UTF-8 BOM for Excel compatibility
});

// 18. GET /api/database/schema.sql - Supabase / PostgreSQL schema export
apiRouter.get('/database/schema.sql', (_req: Request, res: Response) => {
  const sql = `-- RADAR DE PROPRIETÁRIOS - CONNECT IMÓVEIS
-- DDL PostgreSQL para Supabase com RLS (Row Level Security) e Índices

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários (Corretores, Gestores, Admins)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'GESTOR', 'CORRETOR')),
  phone VARCHAR(50),
  creci VARCHAR(50),
  avatar_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Imóveis (Cadastro Mestre Unificado)
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  type VARCHAR(100) NOT NULL,
  price NUMERIC(14,2) NOT NULL,
  original_price NUMERIC(14,2),
  condo_fee NUMERIC(10,2) DEFAULT 0,
  iptu NUMERIC(10,2) DEFAULT 0,
  city VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(150) NOT NULL,
  address TEXT,
  is_approximate_location BOOLEAN DEFAULT TRUE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  area_private NUMERIC(10,2) DEFAULT 0,
  bedrooms INT DEFAULT 0,
  suites INT DEFAULT 0,
  bathrooms INT DEFAULT 1,
  parking_spots INT DEFAULT 0,
  description TEXT,
  primary_source VARCHAR(100) NOT NULL,
  crm_stage VARCHAR(100) DEFAULT 'Novo anúncio',
  assigned_to UUID REFERENCES users(id),
  is_favorite BOOLEAN DEFAULT FALSE,
  duplicate_group_id UUID,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Anunciantes e Proprietários
CREATE TABLE IF NOT EXISTS advertisers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  advertiser_type VARCHAR(50) DEFAULT 'Particular',
  is_owner_confirmed BOOLEAN DEFAULT FALSE,
  do_not_contact BOOLEAN DEFAULT FALSE,
  consent_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Análises de IA (Gemini)
CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  classification VARCHAR(100) NOT NULL,
  indicators JSONB DEFAULT '[]'::jsonb,
  counter_indicators JSONB DEFAULT '[]'::jsonb,
  reasoning TEXT,
  suggested_approach TEXT,
  suggested_message TEXT,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Fontes e Anúncios Vinculados (Antiduplicidade)
CREATE TABLE IF NOT EXISTS property_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  source_platform VARCHAR(100) NOT NULL,
  original_url TEXT NOT NULL,
  external_id VARCHAR(100),
  price NUMERIC(14,2) NOT NULL,
  title VARCHAR(500),
  published_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Histórico de Contatos e Comunicações (LGPD Compliance)
CREATE TABLE IF NOT EXISTS contact_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  channel VARCHAR(50) NOT NULL,
  message_content TEXT NOT NULL,
  response_status VARCHAR(100) NOT NULL,
  notes TEXT,
  opt_out_requested BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Configurações de Busca
CREATE TABLE IF NOT EXISTS search_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  cities TEXT[] NOT NULL,
  property_types TEXT[] NOT NULL,
  min_price NUMERIC(14,2),
  max_price NUMERIC(14,2),
  min_owner_score INT DEFAULT 50,
  sources TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Conectores de Plataformas
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_platform VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL,
  integration_type VARCHAR(100) NOT NULL,
  last_sync_at TIMESTAMPTZ,
  records_count INT DEFAULT 0,
  errors_count INT DEFAULT 0,
  auto_sync_enabled BOOLEAN DEFAULT TRUE,
  sync_interval_minutes INT DEFAULT 60
);

-- 9. Logs de Auditoria e Segurança
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_name VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  details TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para Alta Performance
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_crm_stage ON properties(crm_stage);
CREATE INDEX IF NOT EXISTS idx_properties_assigned ON properties(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ai_score ON ai_analyses(score);
CREATE INDEX IF NOT EXISTS idx_contact_history_prop ON contact_history(property_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Exemplo de política de RLS: Corretores veem seus leads ou não atribuídos
CREATE POLICY "Corretores veem leads atribuidos" ON properties
  FOR SELECT
  USING (auth.uid() = assigned_to OR assigned_to IS NULL);
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(sql);
});
