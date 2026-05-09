import { getCargoProfile, getEffectiveVehicleProfile, getVehicleProfile } from './vehicleProfiles.js';

/**
 * Motor de Validación — Google Cargo
 * Reglamento de Tránsito AMM (Monterrey, N.L.)
 *
 * Niveles de vehículo (vehicleLevel):
 *   0 = camioneta  (3.5T, 5.5m) — no es transporte pesado oficial
 *   1 = estaca      (8T,   7m)
 *   2 = rabon       (12T,  8m)
 *   3 = torton_6/12 (14-24T, 9-11m)
 *   4 = trailer     (32T, 18.5m)
 *   5 = full        (52T, 26m)
 *
 * Cada zona/restricción declara `minLevel`: el nivel mínimo para que aplique.
 * Si el vehículo está por debajo, la restricción se ignora o se baja de severidad.
 */

// ─── Niveles de vehículo ─────────────────────────────────────────────────────
const VEHICLE_LEVEL = {
  camioneta: 0, estaca: 1, rabon: 2,
  torton_6: 3, torton_12: 3, trailer: 4, full: 5,
};

const VEHICLE_LABEL = {
  camioneta: 'Camioneta 3.5T', estaca: 'Estaca 8T', rabon: 'Rabón 12T',
  torton_6: 'Tortón 6R 14T', torton_12: 'Tortón 12R 24T',
  trailer: 'Tráiler 32T', full: 'Full/Doble 52T',
};

// ─── 1. Red Troncal (Anexo 1) ─────────────────────────────────────────────────
// minLevel: 1 — camionetas no están sujetas al reglamento de transporte pesado
const RED_TRONCAL = [
  { id: 'diaz_ordaz',         name: 'Bulevar Gustavo Díaz Ordaz',     keywords: ['diaz ordaz','díaz ordaz','gustavo diaz ordaz'],                            morningRestriction: false, eveningRestriction: false, minLevel: 1 },
  { id: 'antonio_rodriguez',  name: 'Bulevar Antonio L. Rodríguez',   keywords: ['antonio l rodriguez','antonio l. rodriguez','antonio rodriguez'],          morningRestriction: false, eveningRestriction: false, minLevel: 1 },
  { id: 'morones_prieto',     name: 'Av. Morones Prieto',             keywords: ['morones prieto'],                                                          morningRestriction: true,  eveningRestriction: true,  minLevel: 1 },
  { id: 'constitucion',       name: 'Av. Constitución',               keywords: ['constitucion','constitución','av constitucion'],                           morningRestriction: true,  eveningRestriction: false, minLevel: 1 },
  { id: 'fidel_velazquez',    name: 'Av. Fidel Velázquez',            keywords: ['fidel velazquez','fidel velázquez'],                                       morningRestriction: false, eveningRestriction: true,  minLevel: 1 },
  { id: 'lincoln',            name: 'Av. Lincoln',                    keywords: ['lincoln','av lincoln'],                                                    morningRestriction: false, eveningRestriction: false, minLevel: 1 },
  { id: 'churubusco',         name: 'Av. Churubusco',                 keywords: ['churubusco'],                                                              morningRestriction: false, eveningRestriction: false, minLevel: 1 },
  { id: 'garza_sada',         name: 'Av. Eugenio Garza Sada',         keywords: ['garza sada','eugenio garza sada'],                                         morningRestriction: true,  eveningRestriction: true,  minLevel: 1 },
  { id: 'ruiz_cortines',      name: 'Av. Ruiz Cortines',              keywords: ['ruiz cortines'],                                                           morningRestriction: false, eveningRestriction: false, minLevel: 1 },
  { id: 'miguel_aleman',      name: 'Blvd. Miguel Alemán',            keywords: ['miguel aleman','miguel alemán'],                                           morningRestriction: false, eveningRestriction: false, minLevel: 1 },
  { id: 'carretera_nacional', name: 'Carretera Nacional',             keywords: ['carretera nacional','carr nacional'],                                      morningRestriction: false, eveningRestriction: false, minLevel: 1 },
  { id: 'insurgentes',        name: 'Av. Insurgentes',                keywords: ['insurgentes'],                                                             morningRestriction: false, eveningRestriction: false, minLevel: 1 },
  { id: 'lazaro_cardenas',    name: 'Av. Lázaro Cárdenas',            keywords: ['lazaro cardenas','lázaro cárdenas','panamericana'],                        morningRestriction: false, eveningRestriction: false, minLevel: 1 },
  { id: 'union',              name: 'Av. Unión',                      keywords: ['union','unión'],                                                           morningRestriction: false, eveningRestriction: false, minLevel: 1 },
  { id: 'bernardo_reyes',     name: 'Av. Bernardo Reyes',             keywords: ['bernardo reyes'],                                                          morningRestriction: false, eveningRestriction: false, minLevel: 1 },
  { id: 'chapultepec',        name: 'Av. Chapultepec',                keywords: ['chapultepec'],                                                             morningRestriction: false, eveningRestriction: false, minLevel: 1 },
];

// ─── 2. Zonas Prohibidas ──────────────────────────────────────────────────────
// minLevel: nivel mínimo de vehículo para que esta zona sea una restricción
const PROHIBITED_ZONES = [
  {
    id: 'centro_monterrey',
    name: 'Primer Cuadro / Centro de Monterrey',
    bounds: { north: 25.6800, south: 25.6650, east: -100.2900, west: -100.3200 },
    minLevel: 2,  // Rabón+ prohibido. Camioneta y estaca pueden circular con precaución.
    reason: 'Zona centro municipal — prohibida para vehículos pesados ≥ 12T (Reglamento Art. 45).',
    severityByLevel: { 2: 'warning', 3: 'error', 4: 'error', 5: 'error' },
  },
  {
    id: 'san_pedro_centro',
    name: 'Centro de San Pedro Garza García',
    bounds: { north: 25.6610, south: 25.6440, east: -100.3880, west: -100.4130 },
    minLevel: 3,  // Tortón+ prohibido. Estaca y rabón con precaución.
    reason: 'Municipio de San Pedro — vehículos >14T prohibidos en zona centro (Reglamento SPGG Art. 31).',
    severityByLevel: { 3: 'warning', 4: 'error', 5: 'error' },
  },
  {
    id: 'valle_oriente',
    name: 'Valle Oriente (zona habitacional)',
    bounds: { north: 25.6540, south: 25.6400, east: -100.3500, west: -100.3750 },
    minLevel: 3,
    reason: 'Zona habitacional de alta densidad — acceso sin justificación prohibido para T.P. >14T.',
    severityByLevel: { 3: 'warning', 4: 'error', 5: 'error' },
  },
];

// ─── 3. Zonas Escolares y Alta Densidad ──────────────────────────────────────
const SCHOOL_ZONES = [
  {
    id: 'uanl_ciudad_universitaria',
    name: 'Ciudad Universitaria UANL',
    type: 'universidad',
    bounds: { north: 25.7310, south: 25.7170, east: -100.3050, west: -100.3230 },
    minLevel: 2,          // Rabón+ recibe alerta; camioneta y estaca pasan libre
    alwaysRestricted: false,
    schoolHours: [{ startH: 7, startM: 0, endH: 9, endM: 0 }, { startH: 13, startM: 0, endH: 15, endM: 0 }],
    reason: 'Campus UANL — alta afluencia peatonal en horas de entrada/salida.',
    severityByLevel: { 2: 'info', 3: 'warning', 4: 'warning', 5: 'error' },
  },
  {
    id: 'itesm_campus_monterrey',
    name: 'Campus ITESM Monterrey',
    type: 'universidad',
    bounds: { north: 25.6540, south: 25.6450, east: -100.2880, west: -100.2970 },
    minLevel: 2,
    alwaysRestricted: false,
    schoolHours: [{ startH: 7, startM: 0, endH: 9, endM: 30 }, { startH: 12, startM: 30, endH: 14, endM: 0 }],
    reason: 'Campus ITESM sobre Av. Garza Sada — flujo peatonal crítico en horas de clases.',
    severityByLevel: { 2: 'info', 3: 'warning', 4: 'warning', 5: 'error' },
  },
  {
    id: 'udem',
    name: 'UDEM — Universidad de Monterrey',
    type: 'universidad',
    bounds: { north: 25.6690, south: 25.6580, east: -100.4010, west: -100.4160 },
    minLevel: 2,
    alwaysRestricted: false,
    schoolHours: [{ startH: 7, startM: 0, endH: 9, endM: 0 }, { startH: 13, startM: 0, endH: 15, endM: 0 }],
    reason: 'Campus UDEM en San Pedro — zona escolar activa en horas punta.',
    severityByLevel: { 2: 'info', 3: 'warning', 4: 'warning', 5: 'error' },
  },
  {
    id: 'fime_uanl',
    name: 'FIME — Facultad de Ingeniería UANL',
    type: 'facultad',
    bounds: { north: 25.7260, south: 25.7190, east: -100.3100, west: -100.3200 },
    minLevel: 2,
    alwaysRestricted: false,
    schoolHours: [{ startH: 7, startM: 0, endH: 9, endM: 0 }, { startH: 13, startM: 0, endH: 14, endM: 30 }],
    reason: 'Facultad UANL — alta densidad de peatones y ciclistas en horas de entrada.',
    severityByLevel: { 2: 'info', 3: 'warning', 4: 'warning', 5: 'error' },
  },
  {
    id: 'hospital_universitario',
    name: 'Hospital Universitario UANL',
    type: 'hospital',
    bounds: { north: 25.6995, south: 25.6925, east: -100.3340, west: -100.3460 },
    minLevel: 3,          // Tortón+ siempre restringido (zonas de emergencias)
    alwaysRestricted: true,
    schoolHours: [],
    reason: 'Zona hospitalaria con emergencias activas 24 hrs. Prohibido T.P. >14T en vialidades secundarias.',
    severityByLevel: { 3: 'warning', 4: 'error', 5: 'error' },
  },
  {
    id: 'zona_escolar_obispado',
    name: 'Cluster Escolar Obispado / Cumbres',
    type: 'zona_escolar',
    bounds: { north: 25.6960, south: 25.6870, east: -100.3370, west: -100.3520 },
    minLevel: 1,          // Estaca+ recibe aviso en horario escolar
    alwaysRestricted: false,
    schoolHours: [{ startH: 7, startM: 0, endH: 8, endM: 0 }, { startH: 13, startM: 0, endH: 14, endM: 0 }],
    reason: 'Alta concentración de escuelas primarias y secundarias — señalización "Zona Escolar" activa.',
    severityByLevel: { 1: 'info', 2: 'info', 3: 'warning', 4: 'warning', 5: 'error' },
  },
];

// ─── 4. Zonas de Carga y Descarga ─────────────────────────────────────────────
const LOADING_ZONES = [
  {
    id: 'centro_mty_carga',
    name: 'Zona de Carga Centro Monterrey',
    bounds: { north: 25.6810, south: 25.6640, east: -100.2900, west: -100.3210 },
    minLevel: 1,          // Desde estaca en adelante
    restrictions: [
      { startH: 7,  startM: 0,  endH: 10, endM: 0,  label: 'Hora pico matutina' },
      { startH: 14, startM: 0,  endH: 16, endM: 0,  label: 'Hora pico vespertina' },
      { startH: 18, startM: 0,  endH: 21, endM: 0,  label: 'Hora comercial nocturna' },
    ],
    allowedWindow: '10:00 – 14:00 hrs (días hábiles)',
    reason: 'Centro Comercial MTY — carga/descarga restringida. Reglamento Vialidad Art. 52.',
    severityByLevel: { 1: 'info', 2: 'warning', 3: 'warning', 4: 'error', 5: 'error' },
  },
  {
    id: 'san_pedro_carga',
    name: 'Corredor Comercial San Pedro',
    bounds: { north: 25.6640, south: 25.6470, east: -100.3800, west: -100.4140 },
    minLevel: 2,
    restrictions: [
      { startH: 7,  startM: 0,  endH: 10, endM: 30, label: 'Apertura comercial' },
      { startH: 17, startM: 0,  endH: 20, endM: 0,  label: 'Hora pico tarde' },
    ],
    allowedWindow: '10:30 – 17:00 hrs',
    reason: 'San Pedro Garza García — Reglamento Municipal Art. 28 restringe carga pesada en horarios pico.',
    severityByLevel: { 2: 'info', 3: 'warning', 4: 'error', 5: 'error' },
  },
  {
    id: 'santa_catarina_industrial',
    name: 'Accesos Parque Industrial Santa Catarina',
    bounds: { north: 25.6880, south: 25.6530, east: -100.4420, west: -100.4820 },
    minLevel: 3,
    restrictions: [
      { startH: 7,  startM: 0,  endH: 8,  endM: 0,  label: 'Entrada de primer turno' },
      { startH: 15, startM: 0,  endH: 16, endM: 30, label: 'Cambio de turno' },
    ],
    allowedWindow: '08:00 – 15:00 hrs y 16:30 – 22:00 hrs',
    reason: 'Parque Industrial Santa Catarina — congestión crítica en cambios de turno.',
    severityByLevel: { 3: 'info', 4: 'warning', 5: 'error' },
  },
  {
    id: 'apodaca_industrial',
    name: 'Zona Industrial Apodaca / Aeropuerto',
    bounds: { north: 25.7850, south: 25.7550, east: -100.1750, west: -100.2180 },
    minLevel: 3,
    restrictions: [
      { startH: 6,  startM: 30, endH: 8,  endM: 30, label: 'Acceso aeropuerto — pico' },
      { startH: 17, startM: 30, endH: 19, endM: 0,  label: 'Salida turno tarde' },
    ],
    allowedWindow: '08:30 – 17:30 hrs',
    reason: 'Zona industrial Apodaca/Aeropuerto MTY — congestión en cambio de turno y vuelos.',
    severityByLevel: { 3: 'info', 4: 'warning', 5: 'error' },
  },
];

// ─── 5. Maniobras de Riesgo por Nivel ────────────────────────────────────────
// baseSeverity[vehicleLevel] — null = no aplica para ese vehículo
const MANEUVER_BASE = {
  'uturn-left':       { label: 'Vuelta en U izquierda',   baseSeverity: ['info','warning','warning','error','error','error']  },
  'uturn-right':      { label: 'Vuelta en U derecha',     baseSeverity: ['info','warning','warning','error','error','error']  },
  'turn-sharp-left':  { label: 'Giro cerrado izquierda',  baseSeverity: [null,  'info',  'info',  'warning','error','error']  },
  'turn-sharp-right': { label: 'Giro cerrado derecha',    baseSeverity: [null,  'info',  'info',  'warning','error','error']  },
  'roundabout-left':  { label: 'Glorieta — izquierda',    baseSeverity: [null,  null,   'info',  'info',  'warning','error']  },
  'roundabout-right': { label: 'Glorieta — derecha',      baseSeverity: [null,  null,   'info',  'info',  'warning','error']  },
  'fork-left':        { label: 'Bifurcación izquierda',   baseSeverity: [null,  null,   null,    'info',  'info',  'warning'] },
  'fork-right':       { label: 'Bifurcación derecha',     baseSeverity: [null,  null,   null,    'info',  'info',  'warning'] },
};

const MANEUVER_DESCRIPTIONS = {
  'uturn-left':       'Vuelta en U — radio de giro puede ser insuficiente para esta unidad.',
  'uturn-right':      'Vuelta en U — radio de giro puede ser insuficiente para esta unidad.',
  'turn-sharp-left':  'Giro de ángulo agudo izquierda — requiere carril libre y precaución con peatones.',
  'turn-sharp-right': 'Giro de ángulo agudo derecha — ángulo muerto en cabina, precaución máxima.',
  'roundabout-left':  'Glorieta — circula a velocidad reducida y respeta el radio interno.',
  'roundabout-right': 'Glorieta — circula a velocidad reducida y respeta el radio interno.',
  'fork-left':        'Bifurcación — señaliza con ≥100 m de anticipación y ajusta el carril a tiempo.',
  'fork-right':       'Bifurcación — señaliza con ≥100 m de anticipación y ajusta el carril a tiempo.',
};

// ─── 6. Restricciones de infraestructura por dimensiones reales ───────────────
// Google Directions no soporta perfil de camion. Por eso se evaluan las
// alternativas con galibo, peso, ancho y radio de giro de la unidad seleccionada.
const INFRASTRUCTURE_RULES = [
  {
    id: 'centro_calles_angostas',
    name: 'Calles estrechas Centro Monterrey',
    bounds: { north: 25.6820, south: 25.6635, east: -100.2870, west: -100.3230 },
    limits: { maxLengthM: 11, maxWidthM: 2.55, maxWeightT: 24, maxTurnRadiusM: 11.5 },
    reason: 'Calles con carriles estrechos, estacionamiento lateral y giros reducidos.',
  },
  {
    id: 'centrito_valle',
    name: 'Centrito Valle / vialidades locales',
    bounds: { north: 25.6565, south: 25.6475, east: -100.3540, west: -100.3705 },
    limits: { maxLengthM: 9, maxWidthM: 2.5, maxWeightT: 14, maxTurnRadiusM: 10 },
    reason: 'Zona comercial con radios de giro cortos y maniobras restringidas.',
  },
  {
    id: 'loma_larga_galibo',
    name: 'Tunel Loma Larga / galibo controlado',
    keywords: ['tunel loma larga', 'túnel loma larga', 'loma larga'],
    limits: { maxHeightM: 4.1, maxWidthM: 2.6 },
    reason: 'Tramo con galibo controlado; unidades altas o sobredimensionadas requieren alternativa.',
  },
  {
    id: 'gonzalitos_puentes',
    name: 'Gonzalitos / pasos inferiores',
    keywords: ['gonzalitos', 'avenida gonzalitos', 'av gonzalitos'],
    limits: { maxHeightM: 4.2, maxWeightT: 32 },
    reason: 'Pasos inferiores y puentes urbanos con tolerancia limitada para carga alta o pesada.',
  },
  {
    id: 'garza_sada_giros',
    name: 'Garza Sada / giros cerrados urbanos',
    keywords: ['garza sada', 'eugenio garza sada'],
    maneuvers: ['turn-sharp-left', 'turn-sharp-right', 'uturn-left', 'uturn-right'],
    limits: { maxLengthM: 14, maxTurnRadiusM: 12 },
    reason: 'Giros urbanos que pueden invadir carriles contiguos con unidades largas.',
  },
];

const DIRECTIONAL_LIMITS = {
  'uturn-left':       { maxLengthM: 8,  maxTurnRadiusM: 9,    label: 'vuelta en U izquierda' },
  'uturn-right':      { maxLengthM: 8,  maxTurnRadiusM: 9,    label: 'vuelta en U derecha' },
  'turn-sharp-left':  { maxLengthM: 14, maxTurnRadiusM: 12,   label: 'giro cerrado izquierda' },
  'turn-sharp-right': { maxLengthM: 14, maxTurnRadiusM: 12,   label: 'giro cerrado derecha' },
  'roundabout-left':  { maxLengthM: 18.5, maxTurnRadiusM: 13.5, label: 'glorieta izquierda' },
  'roundabout-right': { maxLengthM: 18.5, maxTurnRadiusM: 13.5, label: 'glorieta derecha' },
};

const HAZMAT_RULES = [
  {
    id: 'hazmat_loma_larga',
    name: 'Tunel Loma Larga',
    keywords: ['tunel loma larga', 'túnel loma larga', 'loma larga'],
    reason: 'La carga peligrosa debe evitar tuneles urbanos y tramos cerrados.',
  },
  {
    id: 'hazmat_hospital_universitario',
    name: 'Hospital Universitario / zona sensible',
    bounds: { north: 25.6995, south: 25.6925, east: -100.3340, west: -100.3460 },
    reason: 'Carga peligrosa cerca de hospitales y zonas de emergencia requiere ruta alterna.',
  },
  {
    id: 'hazmat_itesm',
    name: 'Zona escolar ITESM',
    bounds: { north: 25.6540, south: 25.6450, east: -100.2880, west: -100.2970 },
    reason: 'Carga peligrosa cerca de zonas escolares debe evitar calles internas.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractRoadName(html) {
  const bolds = [...(html.matchAll(/<b>(.*?)<\/b>/g))];
  if (bolds.length) return bolds.map(m => m[1].replace(/<[^>]*>/g, '')).join(' ');
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function isInBounds(lat, lng, bounds) {
  return lat <= bounds.north && lat >= bounds.south && lng <= bounds.east && lng >= bounds.west;
}

function matchTroncal(text) {
  const n = normalize(text);
  return RED_TRONCAL.find(r => r.keywords.some(kw => n.includes(kw))) || null;
}

function mins(h, m) { return h * 60 + m; }
function isMorningPeak(h, m)  { const t = mins(h,m); return t >= mins(6,30) && t <= mins(9,30); }
function isEveningPeak(h, m)  { const t = mins(h,m); return t >= mins(18,0) && t <= mins(20,0); }
function inSchoolHours(h, m, ranges) { const t = mins(h,m); return ranges.some(r => t >= mins(r.startH,r.startM) && t <= mins(r.endH,r.endM)); }
function inLoadingBlock(h, m, restrictions) { const t = mins(h,m); return restrictions.find(r => t >= mins(r.startH,r.startM) && t <= mins(r.endH,r.endM)) || null; }
function hhmm(date) { return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }
function fmtHM(h, m) { return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }

function resolveSeverity(zone, vehicleLevel) {
  // Retorna la severidad correcta para este nivel de vehículo, o null si no aplica
  if (vehicleLevel < zone.minLevel) return null;
  return zone.severityByLevel?.[vehicleLevel]
    ?? zone.severityByLevel?.[zone.minLevel]
    ?? 'warning';
}

function isRuleMatch(rule, lat, lng, roadText, maneuver) {
  if (rule.bounds && (lat == null || lng == null || !isInBounds(lat, lng, rule.bounds))) {
    return false;
  }
  if (rule.keywords?.length) {
    const n = normalize(roadText);
    if (!rule.keywords.some(kw => n.includes(normalize(kw)))) return false;
  }
  if (rule.maneuvers?.length && !rule.maneuvers.includes(maneuver)) return false;
  return true;
}

function limitFailures(profile, limits = {}) {
  const failures = [];

  if (limits.maxLengthM && profile.effectiveLengthM > limits.maxLengthM) {
    failures.push(`largo ${profile.effectiveLengthM.toFixed(1)} m > ${limits.maxLengthM} m`);
  }
  if (limits.maxWidthM && profile.effectiveWidthM > limits.maxWidthM) {
    failures.push(`ancho ${profile.effectiveWidthM.toFixed(2)} m > ${limits.maxWidthM} m`);
  }
  if (limits.maxHeightM && profile.effectiveHeightM > limits.maxHeightM) {
    failures.push(`alto ${profile.effectiveHeightM.toFixed(2)} m > ${limits.maxHeightM} m`);
  }
  if (limits.maxWeightT && profile.weightT > limits.maxWeightT) {
    failures.push(`peso ${profile.weightT} t > ${limits.maxWeightT} t`);
  }
  if (limits.maxTurnRadiusM && profile.effectiveTurnRadiusM > limits.maxTurnRadiusM) {
    failures.push(`radio de giro ${profile.effectiveTurnRadiusM.toFixed(1)} m > ${limits.maxTurnRadiusM} m`);
  }

  return failures;
}

function infrastructureSeverity(profile, failures) {
  if (!failures.length) return null;
  if (profile.level >= 4 || failures.length > 1 || profile.cargo?.oversize) return 'error';
  return 'warning';
}

function routeRiskScore(validation, route) {
  const severityScore = validation.alerts.reduce((sum, alert) => {
    if (alert.severity === 'error' && alert.type !== 'INFO') return sum + 1000;
    if (alert.severity === 'warning') return sum + 160;
    return sum + 25;
  }, 0);

  const restrictedScore = validation.restrictedSegments.length * 250;
  const duration = route?.legs?.[0]?.duration_in_traffic?.value ?? route?.legs?.[0]?.duration?.value ?? 0;
  const distance = route?.legs?.[0]?.distance?.value ?? 0;

  return severityScore + restrictedScore + (duration / 120) + (distance / 5000);
}

// ─── Motor Principal ──────────────────────────────────────────────────────────
export function validateRoute(googleMapsData, departureTimeStr, vehicleType = 'trailer', cargoType = 'general', routeIndex = 0) {
  const baseVehicle = getVehicleProfile(vehicleType);
  const vehicleProfile = getEffectiveVehicleProfile(vehicleType, cargoType);
  const cargoProfile = getCargoProfile(cargoType);
  const vehicleLevel = baseVehicle.level ?? VEHICLE_LEVEL[vehicleType] ?? 4;
  const vehicleLabel = baseVehicle.label ?? VEHICLE_LABEL[vehicleType] ?? 'Vehículo pesado';
  const cargoLabel = cargoProfile.label ?? 'Carga general';

  const alerts = [];
  const restrictedSegments = [];
  const seenKeys = new Set();
  const departureTime = departureTimeStr ? new Date(departureTimeStr) : new Date();

  if (!googleMapsData?.routes?.length) {
    return {
      isValid: false,
      alerts: [{ id: 'no_route', type: 'ERROR', severity: 'error', title: 'Ruta no encontrada', message: 'No se pudo obtener ruta para los puntos indicados.' }],
      restrictedSegments: [],
      recommendation: 'Verifique los puntos de origen y destino.',
      alternativeAvailable: false,
      vehicleType,
      cargoType,
      vehicleProfile,
      summary: { totalAlerts: 1, prohibitedZones: 0, timeRestrictions: 0, schoolZones: 0, loadingRestrictions: 0, infrastructureRestrictions: 0, cargoRestrictions: 0, riskManeuvers: 0 },
    };
  }

  const route = googleMapsData.routes[routeIndex] ?? googleMapsData.routes[0];
  let stepIdx = 0;
  let accMs = departureTime.getTime();

  for (const leg of (route.legs || [])) {
    for (const step of (leg.steps || [])) {
      const roadText = extractRoadName(step.html_instructions || '');
      const maneuver = step.maneuver;
      const lat = step.start_location?.lat;
      const lng = step.start_location?.lng;
      const durMs = (step.duration?.value || 0) * 1000;
      const arrival = new Date(accMs);
      const sh = arrival.getHours();
      const sm = arrival.getMinutes();
      const arrStr = hhmm(arrival);

      // ── CAPA 1: Zonas Prohibidas ─────────────────────────────────────────
      if (lat != null && lng != null) {
        for (const zone of PROHIBITED_ZONES) {
          if (!isInBounds(lat, lng, zone.bounds)) continue;
          const sev = resolveSeverity(zone, vehicleLevel);
          if (!sev) continue;                        // este vehículo puede circular aquí
          const key = `prohibited_${zone.id}`;
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);
          alerts.push({
            id: `prohibited_${stepIdx}`,
            type: 'PROHIBITED_ZONE',
            severity: sev,
            title: `${sev === 'error' ? 'Zona Prohibida' : 'Precaución — Zona Restringida'} para ${vehicleLabel}`,
            message: `"${zone.name}". ${zone.reason}`,
            roadName: zone.name,
            stepIndex: stepIdx,
            location: { lat, lng },
          });
          if (sev === 'error') restrictedSegments.push(stepIdx);
        }
      }

      // ── CAPA 2: Red Troncal + Horarios ───────────────────────────────────
      const troncal = matchTroncal(roadText);
      if (troncal && vehicleLevel >= troncal.minLevel) {
        if (troncal.morningRestriction && isMorningPeak(sh, sm)) {
          const key = `morning_${troncal.id}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            alerts.push({
              id: `morning_${stepIdx}_${troncal.id}`,
              type: 'TIME_RESTRICTION',
              severity: vehicleLevel >= 3 ? 'error' : 'warning',
              title: 'Restricción Horaria Matutina',
              message: `[${vehicleLabel}] "${troncal.name}" — restricción de 06:30 a 09:30 hrs (Anexo 2). Llegada estimada: ${arrStr} hrs.`,
              roadName: troncal.name,
              timeWindow: '06:30 – 09:30 hrs',
              stepIndex: stepIdx,
              location: { lat, lng },
            });
            restrictedSegments.push(stepIdx);
          }
        }
        if (troncal.eveningRestriction && isEveningPeak(sh, sm)) {
          const key = `evening_${troncal.id}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            alerts.push({
              id: `evening_${stepIdx}_${troncal.id}`,
              type: 'TIME_RESTRICTION',
              severity: vehicleLevel >= 3 ? 'error' : 'warning',
              title: 'Restricción Horaria Vespertina',
              message: `[${vehicleLabel}] "${troncal.name}" — restricción de 18:00 a 20:00 hrs (Anexo 3). Llegada estimada: ${arrStr} hrs.`,
              roadName: troncal.name,
              timeWindow: '18:00 – 20:00 hrs',
              stepIndex: stepIdx,
              location: { lat, lng },
            });
            restrictedSegments.push(stepIdx);
          }
        }
      }

      // ── CAPA 3: Zonas Escolares ──────────────────────────────────────────
      if (lat != null && lng != null) {
        for (const zone of SCHOOL_ZONES) {
          if (!isInBounds(lat, lng, zone.bounds)) continue;
          const sev = resolveSeverity(zone, vehicleLevel);
          if (!sev) continue;
          const key = `school_${zone.id}`;
          if (seenKeys.has(key)) continue;
          const active = zone.alwaysRestricted || inSchoolHours(sh, sm, zone.schoolHours);
          if (!active) continue;
          seenKeys.add(key);
          const windowStr = zone.alwaysRestricted
            ? '24 hrs'
            : zone.schoolHours.map(r => `${fmtHM(r.startH,r.startM)}–${fmtHM(r.endH,r.endM)}`).join(', ');
          alerts.push({
            id: `school_${stepIdx}_${zone.id}`,
            type: 'SCHOOL_ZONE',
            severity: sev,
            title: `Zona Escolar — ${zone.name}`,
            message: `[${vehicleLabel}] ${zone.reason} Horario de restricción: ${windowStr} hrs. Llegada estimada: ${arrStr} hrs.`,
            roadName: zone.name,
            timeWindow: windowStr,
            stepIndex: stepIdx,
            location: { lat, lng },
          });
          if (sev === 'error') restrictedSegments.push(stepIdx);
        }
      }

      // ── CAPA 4: Carga y Descarga ─────────────────────────────────────────
      if (lat != null && lng != null) {
        for (const zone of LOADING_ZONES) {
          if (!isInBounds(lat, lng, zone.bounds)) continue;
          const sev = resolveSeverity(zone, vehicleLevel);
          if (!sev) continue;
          const key = `loading_${zone.id}`;
          if (seenKeys.has(key)) continue;
          const activeBlock = inLoadingBlock(sh, sm, zone.restrictions);
          if (!activeBlock) continue;
          seenKeys.add(key);
          alerts.push({
            id: `loading_${stepIdx}_${zone.id}`,
            type: 'LOADING_RESTRICTION',
            severity: sev,
            title: `Restricción Carga/Descarga — ${zone.name}`,
            message: `[${vehicleLabel}] ${zone.reason} Restricción activa: ${activeBlock.label} (llegada ${arrStr} hrs). Ventana permitida: ${zone.allowedWindow}.`,
            roadName: zone.name,
            timeWindow: zone.allowedWindow,
            stepIndex: stepIdx,
            location: { lat, lng },
          });
          if (sev === 'error') restrictedSegments.push(stepIdx);
        }
      }

      // ── CAPA 5: Infraestructura fisica de la unidad ──────────────────────
      for (const rule of INFRASTRUCTURE_RULES) {
        if (!isRuleMatch(rule, lat, lng, roadText, maneuver)) continue;
        const failures = limitFailures(vehicleProfile, rule.limits);
        const sev = infrastructureSeverity(vehicleProfile, failures);
        if (!sev) continue;
        const key = `infra_${rule.id}_${stepIdx}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        alerts.push({
          id: `infra_${stepIdx}_${rule.id}`,
          type: 'INFRASTRUCTURE_RESTRICTION',
          severity: sev,
          title: `Infraestructura no apta — ${rule.name}`,
          message: `[${vehicleLabel} / ${cargoLabel}] ${rule.reason} Limite rebasado: ${failures.join(', ')}.`,
          roadName: rule.name,
          stepIndex: stepIdx,
          location: { lat, lng },
        });
        if (sev === 'error') restrictedSegments.push(stepIdx);
      }

      const directionalLimit = maneuver ? DIRECTIONAL_LIMITS[maneuver] : null;
      if (directionalLimit) {
        const failures = limitFailures(vehicleProfile, directionalLimit);
        const sev = infrastructureSeverity(vehicleProfile, failures);
        if (sev) {
          alerts.push({
            id: `direction_${stepIdx}_${maneuver}`,
            type: 'INFRASTRUCTURE_RESTRICTION',
            severity: sev,
            title: `Direccion no apta — ${directionalLimit.label}`,
            message: `[${vehicleLabel}] La maniobra exige mas espacio que la unidad disponible: ${failures.join(', ')}.`,
            roadName: roadText,
            stepIndex: stepIdx,
            location: { lat, lng },
            maneuver,
          });
          if (sev === 'error') restrictedSegments.push(stepIdx);
        }
      }

      if (cargoProfile.hazmat) {
        for (const rule of HAZMAT_RULES) {
          if (!isRuleMatch(rule, lat, lng, roadText, maneuver)) continue;
          const key = `cargo_${rule.id}`;
          if (seenKeys.has(key)) continue;
          seenKeys.add(key);
          alerts.push({
            id: `cargo_${stepIdx}_${rule.id}`,
            type: 'CARGO_RESTRICTION',
            severity: 'error',
            title: `Restriccion por carga — ${rule.name}`,
            message: `[${cargoLabel}] ${rule.reason}`,
            roadName: rule.name,
            stepIndex: stepIdx,
            location: { lat, lng },
          });
          restrictedSegments.push(stepIdx);
        }
      }

      // ── CAPA 6: Maniobras de Riesgo ──────────────────────────────────────
      if (maneuver && MANEUVER_BASE[maneuver]) {
        const base = MANEUVER_BASE[maneuver];
        const sev = base.baseSeverity[vehicleLevel] ?? null;
        if (sev) {
          alerts.push({
            id: `maneuver_${stepIdx}_${maneuver}`,
            type: 'HIGH_RISK_MANEUVER',
            severity: sev,
            title: `Maniobra de Riesgo — ${base.label}`,
            message: `[${vehicleLabel}] ${MANEUVER_DESCRIPTIONS[maneuver]} (Tramo: "${roadText}")`,
            roadName: roadText,
            stepIndex: stepIdx,
            location: { lat, lng },
            maneuver,
          });
          if (sev === 'error') restrictedSegments.push(stepIdx);
        }
      }

      accMs += durMs;
      stepIdx++;
    }
  }

  // Alerta especial Full/Doble — permiso SCT
  if (vehicleType === 'full') {
    alerts.unshift({
      id: 'full_permit',
      type: 'INFO',
      severity: 'info',
      title: 'Permiso SCT Requerido — Full/Doble',
      message: 'Vehículos Full/Doble (>22 m, 52T) requieren permiso especial SCT para circular en vías federales del AMM. Verifique documentación y configuración de ejes antes de salir.',
      timeWindow: 'Trámite: ventanilla SCT o portal.sct.gob.mx',
    });
  }

  // Aviso de restricción matutina próxima
  const dH = departureTime.getHours(), dM = departureTime.getMinutes();
  if (vehicleLevel >= 1 && !isMorningPeak(dH, dM) && !isEveningPeak(dH, dM)) {
    const nx = new Date(departureTime);
    nx.setHours(6, 30, 0, 0);
    if (nx <= departureTime) nx.setDate(nx.getDate() + 1);
    const minsUntil = Math.round((nx - departureTime) / 60000);
    if (minsUntil > 0 && minsUntil <= 90) {
      alerts.push({
        id: 'approaching_morning',
        type: 'INFO',
        severity: 'info',
        title: 'Restricción Próxima',
        message: `En aprox. ${minsUntil} min iniciará la restricción matutina (06:30–09:30) en Morones Prieto, Constitución y Garza Sada.`,
        timeWindow: '06:30 – 09:30 hrs',
      });
    }
  }

  const unique = [...new Set(restrictedSegments)];
  const hasError   = alerts.some(a => a.severity === 'error' && a.type !== 'INFO');
  const hasWarning = alerts.some(a => a.severity === 'warning');
  const isValid    = !hasError;

  let recommendation;
  if (vehicleLevel === 0) {
    recommendation = hasError
      ? `Ruta con puntos de cuidado para [${vehicleLabel}]. Revise las alertas señaladas.`
      : `Ruta libre para [${vehicleLabel}]. Circule con precaución en zonas escolares y comerciales.`;
  } else if (alerts.some(a => a.type === 'INFRASTRUCTURE_RESTRICTION' && a.severity === 'error')) {
    recommendation = `Ruta INVÁLIDA para [${vehicleLabel}]: las dimensiones/peso de la unidad rebasan infraestructura de la ruta. Use una alternativa con mayor galibo, radio de giro o vialidades troncales.`;
  } else if (alerts.some(a => a.type === 'CARGO_RESTRICTION' && a.severity === 'error')) {
    recommendation = `Ruta INVÁLIDA para [${vehicleLabel} / ${cargoLabel}]: el tipo de carga requiere evitar zonas sensibles o tuneles.`;
  } else if (alerts.some(a => a.type === 'PROHIBITED_ZONE' && a.severity === 'error')) {
    recommendation = `Ruta INVÁLIDA para [${vehicleLabel}]: atraviesa zonas prohibidas. Use Red Troncal evitando el Centro Municipal.`;
  } else if (alerts.some(a => a.type === 'HIGH_RISK_MANEUVER' && a.severity === 'error')) {
    recommendation = `Maniobras prohibidas detectadas para [${vehicleLabel}]. Seleccione ruta alternativa que evite vueltas en U o giros cerrados.`;
  } else if (hasWarning) {
    recommendation = `Ruta con precauciones para [${vehicleLabel}]. Revise horarios de restricción y coordine ventana de entrega con el destinatario.`;
  } else {
    recommendation = `Ruta válida para [${vehicleLabel}]. Respete señalizaciones y límites de peso en accesos al destino.`;
  }

  return {
    isValid,
    alerts,
    restrictedSegments: unique,
    recommendation,
    alternativeAvailable: googleMapsData.routes.length > 1,
    vehicleType,
    cargoType,
    vehicleLevel,
    vehicleProfile,
    summary: {
      totalAlerts:         alerts.length,
      prohibitedZones:     alerts.filter(a => a.type === 'PROHIBITED_ZONE').length,
      timeRestrictions:    alerts.filter(a => a.type === 'TIME_RESTRICTION').length,
      schoolZones:         alerts.filter(a => a.type === 'SCHOOL_ZONE').length,
      loadingRestrictions: alerts.filter(a => a.type === 'LOADING_RESTRICTION').length,
      infrastructureRestrictions: alerts.filter(a => a.type === 'INFRASTRUCTURE_RESTRICTION').length,
      cargoRestrictions:   alerts.filter(a => a.type === 'CARGO_RESTRICTION').length,
      riskManeuvers:       alerts.filter(a => a.type === 'HIGH_RISK_MANEUVER').length,
    },
  };
}

export function validateRouteOptions(googleMapsData, departureTimeStr, vehicleType = 'trailer', cargoType = 'general') {
  if (!googleMapsData?.routes?.length) {
    const validation = validateRoute(googleMapsData, departureTimeStr, vehicleType, cargoType, 0);
    return [{ route: null, validation, originalIndex: 0, score: Number.POSITIVE_INFINITY }];
  }

  return googleMapsData.routes
    .map((route, originalIndex) => {
      const validation = validateRoute(googleMapsData, departureTimeStr, vehicleType, cargoType, originalIndex);
      const score = routeRiskScore(validation, route);
      return {
        route,
        originalIndex,
        score,
        validation: {
          ...validation,
          routeIndex: originalIndex,
          score,
        },
      };
    })
    .sort((a, b) => a.score - b.score);
}
