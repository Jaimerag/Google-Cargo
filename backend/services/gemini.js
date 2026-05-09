import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

function getClient() {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI;
}

export async function analyzeRoute(googleMapsData, validation, vehicleType = 'trailer', cargoType = 'general') {
  try {
    const model = getClient().getGenerativeModel({ model: 'gemini-2.0-flash' });

    const route = googleMapsData.routes[0];
    const leg = route.legs[0];
    const alertsSummary = validation.alerts
      .map(a => `  • [${a.type}] ${a.title}: ${a.message}`)
      .join('\n');

    const vehicleLabels = {
      camioneta: 'Camioneta 3.5T (5.5 m, 2 ejes)',
      estaca:    'Estaca 8T (7 m, 2 ejes)',
      rabon:     'Rabón 12T (8 m, 3 ejes)',
      torton_6:  'Tortón 6 ruedas 14T (9 m, 3 ejes)',
      torton_12: 'Tortón 12 ruedas 24T (11 m, 4 ejes)',
      trailer:   'Tráiler 32T (18.5 m, 5 ejes)',
      full:      'Full / Doble Remolque 52T (26 m, 7 ejes) — REQUIERE PERMISO SCT',
    };

    const cargoLabels = {
      general: 'Carga general',
      perecedera: 'Carga perecedera',
      refrigerada: 'Carga refrigerada',
      peligrosa: 'Carga peligrosa / hazmat',
      sobredimensionada: 'Carga sobredimensionada',
    };

    const prompt = `
Eres un experto en logística y reglamento de tránsito para transporte pesado en el Área Metropolitana de Monterrey, México.

TIPO DE UNIDAD: ${vehicleLabels[vehicleType] ?? vehicleType}
TIPO DE CARGA: ${cargoLabels[cargoType] ?? cargoType}

RESUMEN DE RUTA CALCULADA:
- Resumen: ${route.summary}
- Distancia: ${leg.distance?.text}
- Tiempo estimado: ${leg.duration_in_traffic?.text || leg.duration?.text}
- Estado de validación: ${validation.isValid ? 'VÁLIDA' : 'INVÁLIDA o CON RESTRICCIONES'}
- Alertas detectadas (${validation.alerts.length}):
${alertsSummary || '  (ninguna)'}

RECOMENDACIÓN DEL SISTEMA: ${validation.recommendation}

Con base en esta información, proporciona un análisis ejecutivo en español. Responde ÚNICAMENTE con un JSON válido (sin markdown, sin bloques de código) con esta estructura exacta:
{
  "riskLevel": "Bajo" | "Medio" | "Alto" | "Crítico",
  "riskColor": "#34a853" | "#f57c00" | "#ea4335" | "#b71c1c",
  "mainConcerns": ["concern1", "concern2"],
  "driverRecommendations": ["rec1", "rec2", "rec3"],
  "optimalDepartureTime": "HH:MM hrs" | null,
  "summary": "Texto de 2-3 oraciones con evaluación general."
}
`.trim();

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[Gemini] Error:', err.message);
    return {
      riskLevel: validation.isValid ? 'Bajo' : 'Alto',
      riskColor: validation.isValid ? '#34a853' : '#ea4335',
      mainConcerns: validation.alerts.map(a => a.title).slice(0, 3),
      driverRecommendations: [
        validation.recommendation,
        'Verifique el peso y dimensiones del vehículo antes de circular.',
        'Mantenga documentación vigente (permiso de circulación, carta porte).',
      ],
      optimalDepartureTime: null,
      summary: validation.recommendation,
    };
  }
}
