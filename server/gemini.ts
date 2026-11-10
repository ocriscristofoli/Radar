import { GoogleGenAI, Type } from '@google/genai';
import { AiAnalysis, OwnerClassification } from '../src/types/index.ts';

// Server-side initialization following @google/genai specifications
const apiKey = process.env.GEMINI_API_KEY || '';

let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback heuristic analyzer that scans for typical owner expressions & indicators
export function heuristicAnalyzeListing(
  title: string,
  description: string,
  advertiserName?: string
): AiAnalysis {
  const text = `${title} ${description} ${advertiserName || ''}`.toLowerCase();
  
  const positiveKeywords = [
    { regex: /direto com (o )?propriet[aá]rio/i, weight: 35, label: 'Expressão explícita: "Direto com o proprietário"' },
    { regex: /direto com (o )?dono/i, weight: 35, label: 'Expressão: "Direto com o dono"' },
    { regex: /vendo meu (apartamento|im[oó]vel|casa|terreno|apto)/i, weight: 30, label: 'Expressão pessoal: "Vendo meu imóvel"' },
    { regex: /sem imobili[aá]ria/i, weight: 25, label: 'Expressão: "Sem imobiliária"' },
    { regex: /sem intermedi[aá]rios/i, weight: 25, label: 'Expressão: "Sem intermediários"' },
    { regex: /propriet[aá]rio vende/i, weight: 30, label: 'Expressão: "Proprietário vende"' },
    { regex: /motivo (de )?mudan[çc]a|transfer[eê]ncia|viagem/i, weight: 15, label: 'Motivo pessoal citado (mudança/viagem)' },
    { regex: /aceito proposta|aberto a proposta/i, weight: 10, label: 'Aberto a negociação direta' },
    { regex: /preciso vender|urgente/i, weight: 15, label: 'Indício de urgência do proprietário' },
    { regex: /tratar direto com/i, weight: 20, label: 'Menção a contato pessoal direto' },
  ];

  const negativeKeywords = [
    { regex: /creci[:\s]*\d+/i, weight: -45, label: 'Registro de CRECI identificado no anúncio' },
    { regex: /imobili[aá]ria|corretor(a)?|assessoria imobili[aá]ria/i, weight: -30, label: 'Termos corporativos de imobiliária/corretor' },
    { regex: /consulte nossos corretores|plant[aã]o de vendas/i, weight: -35, label: 'Jargão comercial de imobiliária' },
    { regex: /c[oó]digo do im[oó]vel|ref[:\s]*\w+/i, weight: -20, label: 'Código interno de referência comercial' },
    { regex: /lan[çc]amento da construtora|obra em andamento/i, weight: -25, label: 'Anúncio de incorporadora/construtora' },
  ];

  let score = 50; // base neutrality
  const indicators: string[] = [];
  const counterIndicators: string[] = [];

  for (const item of positiveKeywords) {
    if (item.regex.test(text)) {
      score += item.weight;
      indicators.push(item.label);
    }
  }

  for (const item of negativeKeywords) {
    if (item.regex.test(text)) {
      score += item.weight;
      counterIndicators.push(item.label);
    }
  }

  score = Math.max(5, Math.min(98, score));

  let classification: OwnerClassification;
  if (score >= 75) {
    classification = 'Alta probabilidade de particular';
  } else if (score >= 55) {
    classification = 'Média probabilidade';
  } else if (score >= 35) {
    classification = 'Baixa probabilidade';
  } else {
    classification = 'Provável imobiliária';
  }

  const reasoning = indicators.length > 0
    ? `Identificados ${indicators.length} indícios consistentes de anúncio particular, incluindo: ${indicators.join('; ')}.`
    : `Poucos indícios explícitos de propriedade direta. ${counterIndicators.length > 0 ? `Detectados indícios profissionais: ${counterIndicators.join('; ')}.` : 'Anúncio com linguagem neutra.'}`;

  const suggestedApproach = score >= 60
    ? 'Abordagem cordial e consultiva, focando em segurança jurídica e carteira de investidores qualificados da Connect Imóveis em SC.'
    : 'Verificação prévia do anunciante antes do contato comercial, checando se é parceiro ou colega de profissão.';

  const suggestedMessage = `Olá ${advertiserName ? advertiserName : 'tudo bem'}? Me chamo [Seu Nome], sou consultor imobiliário na Connect Imóveis aqui no litoral de SC. Vi seu anúncio sobre o imóvel e gostaria de saber se você ainda é o proprietário e se teria interesse em apresentar aos nossos clientes qualificados que estão buscando exatamente nessa região. Podemos conversar brevemente?`;

  return {
    score,
    classification,
    indicators,
    counterIndicators,
    reasoning,
    suggestedApproach,
    suggestedMessage,
    analyzedAt: new Date().toISOString(),
  };
}

// Full Gemini 3.8 Flash model execution for rich natural language analysis & message personalization
export async function analyzeListingWithGemini(params: {
  title: string;
  description: string;
  price?: number;
  city?: string;
  neighborhood?: string;
  advertiserName?: string;
  advertiserContact?: string;
}): Promise<AiAnalysis> {
  if (!process.env.GEMINI_API_KEY) {
    // If no key in environment, gracefully utilize the heuristic engine
    return heuristicAnalyzeListing(params.title, params.description, params.advertiserName);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Você é o motor de inteligência artificial do sistema RADAR DE PROPRIETÁRIOS da imobiliária Connect Imóveis (Litoral de Santa Catarina: Porto Belo, Itapema, Bombinhas, Balneário Camboriú, etc).
Sua missão é interpretar minuciosamente o anúncio imobiliário a seguir e avaliar se foi publicado DIRETAMENTE POR UM PROPRIETÁRIO PARTICULAR ou por uma imobiliária/corretor.

Dados do Anúncio:
Título: "${params.title}"
Preço: R$ ${params.price || 'Não informado'}
Localização: ${params.neighborhood || ''}, ${params.city || 'Santa Catarina'}
Nome Anunciante: ${params.advertiserName || 'Não informado'}
Descrição completa:
"""
${params.description}
"""

Critérios de Análise:
1. Expressões típicas de particular: "direto com proprietário", "vendo meu imóvel", "sem imobiliária", "motivo de mudança", linguagem coloquial, detalhes afetivos, contato pessoal direto.
2. Indícios profissionais/imobiliária: "CRECI", "código ref", termos de marketing institucional, "nossa equipe", múltiplos empreendimentos, linguagem formal padronizada.
3. Pontuação de 0 a 100 (onde 100 é certeza prática de proprietário direto e 0 é anúncio corporativo evidente).
4. Classificação categórica rigorosa:
   - "Alta probabilidade de particular" (score >= 75)
   - "Média probabilidade" (score 55 a 74)
   - "Baixa probabilidade" (score 35 a 54)
   - "Provável imobiliária" (score < 35)
   - "Não identificado"
5. Sugestão de mensagem amigável, humanizada, em conformidade com a LGPD e sem tom invasivo para WhatsApp.

Retorne estritamente um JSON no formato especificado.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: 'Score de probabilidade de 0 a 100' },
            classification: {
              type: Type.STRING,
              enum: [
                'Alta probabilidade de particular',
                'Média probabilidade',
                'Baixa probabilidade',
                'Provável imobiliária',
                'Não identificado',
              ],
            },
            indicators: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de indícios positivos que sugerem proprietário particular',
            },
            counterIndicators: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de indícios que sugerem imobiliária ou corretor terceiro',
            },
            reasoning: {
              type: Type.STRING,
              description: 'Justificativa objetiva e detalhada da pontuação',
            },
            suggestedApproach: {
              type: Type.STRING,
              description: 'Estratégia recomendada para o corretor abordar este contato',
            },
            suggestedMessage: {
              type: Type.STRING,
              description: 'Mensagem personalizada e humanizada para contato inicial no WhatsApp respeitando LGPD',
            },
          },
          required: [
            'score',
            'classification',
            'indicators',
            'counterIndicators',
            'reasoning',
            'suggestedApproach',
            'suggestedMessage',
          ],
        },
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return {
        score: Math.max(0, Math.min(100, Number(parsed.score) || 50)),
        classification: parsed.classification as OwnerClassification,
        indicators: Array.isArray(parsed.indicators) ? parsed.indicators : [],
        counterIndicators: Array.isArray(parsed.counterIndicators) ? parsed.counterIndicators : [],
        reasoning: parsed.reasoning || 'Análise processada com sucesso.',
        suggestedApproach: parsed.suggestedApproach || 'Abordagem consultiva.',
        suggestedMessage: parsed.suggestedMessage || 'Olá, temos clientes para o seu imóvel.',
        analyzedAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error('Gemini API call failed, falling back to heuristic engine:', error);
  }

  return heuristicAnalyzeListing(params.title, params.description, params.advertiserName);
}
