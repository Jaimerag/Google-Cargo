import { useState, useEffect } from 'react';
import {
  Button, IconButton, CircularProgress, Tooltip,
} from '@mui/material';
import {
  Close, LocalShipping, SwapVert,
  CheckCircleOutline, ErrorOutline, WarningAmberRounded,
  AutoAwesome, NavigateNext, TripOrigin, Place,
  OpenInNew,
} from '@mui/icons-material';
import AlertCard from './AlertCard';
import RouteStep from './RouteStep';
import PlaceAutocomplete from './PlaceAutocomplete';
import VehicleSelector from './VehicleSelector';
import CargoSelector from './CargoSelector';
import DeparturePicker from './DeparturePicker';
import { RouteResponse } from '../types';

interface Props {
  open: boolean;
  routeData: RouteResponse | null;
  isLoading: boolean;
  error: string | null;
  selectedRoute: number;
  onSelectRoute: (i: number) => void;
  onClose: () => void;
  onCalculate: (origin: string, dest: string, time?: string) => void;
  vehicleType: string;
  onVehicleChange: (id: string) => void;
  cargoType: string;
  onCargoChange: (id: string) => void;
}

export default function Sidebar({
  open, routeData, isLoading, error,
  selectedRoute, onSelectRoute, onClose, onCalculate,
  vehicleType, onVehicleChange, cargoType, onCargoChange,
}: Props) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [stepsExpanded, setStepsExpanded] = useState(false);

  // Pre-fill fields when route data arrives
  useEffect(() => {
    if (routeData) {
      setOrigin(routeData.requestInfo.origin);
      setDestination(routeData.requestInfo.destination);
    }
  }, [routeData]);

  const handleSwap = () => {
    const tmp = origin;
    setOrigin(destination);
    setDestination(tmp);
  };

  const handleCalculate = () => {
    if (origin.trim() && destination.trim()) {
      const scheduledDeparture = departureDate && departureTime
        ? `${departureDate}T${departureTime}`
        : undefined;
      onCalculate(origin.trim(), destination.trim(), scheduledDeparture);
    }
  };

  const route = routeData?.routes[selectedRoute];
  const leg   = route?.legs[0];
  const currentValidation = routeData?.validations?.[selectedRoute] ?? routeData?.validation;
  const restrictedSet = new Set(currentValidation?.restrictedSegments ?? []);
  const alerts = currentValidation?.alerts ?? [];
  const gemini = selectedRoute === 0 ? routeData?.geminiAnalysis : null;
  const isValid = currentValidation?.isValid;

  return (
    <aside className={`gc-sidebar${open ? '' : ' hidden'}`}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="gc-sidebar-header">
        <div className="gc-logo" aria-label="Google Cargo">
          <img
            src="/google-cargo-logo-cutout.png"
            alt="Google Cargo"
            className="gc-logo-img"
          />
        </div>
        <Tooltip title="Cerrar panel">
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      {/* ── Selector de tipo de unidad — SIEMPRE visible arriba ── */}
      <VehicleSelector selected={vehicleType} onChange={onVehicleChange} />

      <div className="gc-sidebar-body">
        {/* ── Route Form ──────────────────────────────────────────── */}
        <div className="gc-form">
          <div className="gc-input-row">
            <TripOrigin sx={{ color: '#34a853', fontSize: 18, flexShrink: 0 }} />
            <PlaceAutocomplete
              placeholder="Origen (ej. Parque Industrial Monterrey)"
              value={origin}
              onChange={setOrigin}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
            <div style={{ width: 2, height: 18, background: '#dadce0', marginLeft: 7 }} />
            <div style={{ flex: 1 }} />
            <Tooltip title="Intercambiar origen y destino">
              <IconButton size="small" onClick={handleSwap}>
                <SwapVert fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>

          <div className="gc-input-row">
            <Place sx={{ color: '#ea4335', fontSize: 18, flexShrink: 0 }} />
            <PlaceAutocomplete
              placeholder="Destino (ej. Zona Centro, San Pedro)"
              value={destination}
              onChange={setDestination}
            />
          </div>

          <DeparturePicker
            dateValue={departureDate}
            timeValue={departureTime}
            onDateChange={setDepartureDate}
            onTimeChange={setDepartureTime}
          />

          <CargoSelector selected={cargoType} onChange={onCargoChange} />

          <Button
            variant="contained"
            fullWidth
            size="medium"
            disabled={isLoading || !origin.trim() || !destination.trim()}
            onClick={handleCalculate}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <LocalShipping />}
            sx={{ mt: 0.5, py: 1.1, fontSize: 14, fontWeight: 600 }}
          >
            {isLoading ? 'Calculando ruta…' : 'Calcular Ruta'}
          </Button>
        </div>

        {/* ── Error state ─────────────────────────────────────────── */}
        {error && (
          <div className="gc-alert-card error" style={{ margin: '12px 16px 0' }}>
            <span className="material-icons-round gc-alert-icon">error</span>
            <div>
              <div className="gc-alert-title">Error al calcular la ruta</div>
              <div className="gc-alert-msg">{error}</div>
            </div>
          </div>
        )}

        {/* ── Route Summary ───────────────────────────────────────── */}
        {routeData && leg && (
          <>
            <div style={{ padding: '12px 16px 0' }}>
              {/* Validity badge */}
              {isValid === true && (
                <span className="gc-valid-badge valid">
                  <CheckCircleOutline sx={{ fontSize: 14 }} /> Ruta válida para T.P.
                </span>
              )}
              {isValid === false && (
                <span className="gc-valid-badge invalid">
                  <ErrorOutline sx={{ fontSize: 14 }} /> Ruta con restricciones
                </span>
              )}
              {alerts.some(a => a.type === 'TIME_RESTRICTION') && isValid !== false && (
                <span className="gc-valid-badge warning" style={{ marginLeft: 6 }}>
                  <WarningAmberRounded sx={{ fontSize: 14 }} /> Horario restringido
                </span>
              )}
            </div>

            {/* Stats de ruta */}
            <div className="gc-summary-card">
              <div className="gc-summary-stat">
                <div className="value">{leg.durationInTraffic?.text ?? leg.duration.text}</div>
                <div className="label">Tiempo c/ tráfico</div>
              </div>
              <div style={{ width: 1, height: 40, background: '#e8eaed', flexShrink: 0 }} />
              <div className="gc-summary-stat">
                <div className="value">{leg.distance.text}</div>
                <div className="label">Distancia</div>
              </div>
              <div style={{ width: 1, height: 40, background: '#e8eaed', flexShrink: 0 }} />
              <div className="gc-summary-stat">
                <div className="value" style={{ fontSize: 16, color: alerts.length > 0 ? '#ea4335' : '#34a853' }}>
                  {alerts.length}
                </div>
                <div className="label">Alertas</div>
              </div>
            </div>

            {/* Desglose de alertas por categoría */}
            {currentValidation?.summary && alerts.length > 0 && (
              <div style={{ padding: '0 16px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {currentValidation.summary.prohibitedZones > 0 && (
                  <span style={{ background: '#fce8e6', color: '#c5221f', border: '1px solid #ea4335', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-icons-round" style={{ fontSize: 12 }}>block</span>
                    {currentValidation.summary.prohibitedZones} Prohibida{currentValidation.summary.prohibitedZones > 1 ? 's' : ''}
                  </span>
                )}
                {currentValidation.summary.timeRestrictions > 0 && (
                  <span style={{ background: '#fff3e0', color: '#9e3c00', border: '1px solid #f57c00', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-icons-round" style={{ fontSize: 12 }}>schedule</span>
                    {currentValidation.summary.timeRestrictions} Horaria{currentValidation.summary.timeRestrictions > 1 ? 's' : ''}
                  </span>
                )}
                {currentValidation.summary.schoolZones > 0 && (
                  <span style={{ background: '#fffde7', color: '#6d4c00', border: '1px solid #f9a825', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-icons-round" style={{ fontSize: 12 }}>school</span>
                    {currentValidation.summary.schoolZones} Escolar{currentValidation.summary.schoolZones > 1 ? 'es' : ''}
                  </span>
                )}
                {currentValidation.summary.loadingRestrictions > 0 && (
                  <span style={{ background: '#fce4ec', color: '#880e4f', border: '1px solid #e91e63', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-icons-round" style={{ fontSize: 12 }}>local_shipping</span>
                    {currentValidation.summary.loadingRestrictions} Carga
                  </span>
                )}
                {currentValidation.summary.infrastructureRestrictions > 0 && (
                  <span style={{ background: '#e8f0fe', color: '#1558d6', border: '1px solid #1a73e8', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-icons-round" style={{ fontSize: 12 }}>height</span>
                    {currentValidation.summary.infrastructureRestrictions} Infra
                  </span>
                )}
                {currentValidation.summary.cargoRestrictions > 0 && (
                  <span style={{ background: '#ede7f6', color: '#4527a0', border: '1px solid #673ab7', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-icons-round" style={{ fontSize: 12 }}>warning</span>
                    {currentValidation.summary.cargoRestrictions} Tipo carga
                  </span>
                )}
                {currentValidation.summary.riskManeuvers > 0 && (
                  <span style={{ background: '#f3e5f5', color: '#4a148c', border: '1px solid #9c27b0', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-icons-round" style={{ fontSize: 12 }}>turn_sharp_right</span>
                    {currentValidation.summary.riskManeuvers} Maniobra{currentValidation.summary.riskManeuvers > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}

            {/* Alternative routes selector */}
            {routeData.routes.length > 1 && (
              <div style={{ padding: '0 16px 8px', display: 'flex', gap: 8 }}>
                {routeData.routes.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectRoute(i)}
                    style={{
                      flex: 1,
                      padding: '6px 4px',
                      border: `2px solid ${i === selectedRoute ? '#1a73e8' : '#dadce0'}`,
                      borderRadius: 8,
                      background: i === selectedRoute ? '#e8f0fe' : '#fff',
                      color: i === selectedRoute ? '#1a73e8' : '#5f6368',
                      fontSize: 12,
                      fontFamily: 'var(--font-primary)',
                      fontWeight: i === selectedRoute ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {i === 0 ? 'Ruta principal' : `Alternativa ${i}`}
                  </button>
                ))}
              </div>
            )}

            {/* Recommendation */}
            <div className="gc-recommendation">
              <strong>Recomendación:</strong> {currentValidation?.recommendation}
            </div>

            {/* Google Maps link */}
            <div style={{ padding: '12px 16px 0' }}>
              <Button
                variant="contained"
                fullWidth
                size="medium"
                color="success"
                endIcon={<OpenInNew />}
                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(routeData.requestInfo.origin)}&destination=${encodeURIComponent(routeData.requestInfo.destination)}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                component="a"
                sx={{ py: 1.1, fontSize: 14, fontWeight: 600 }}
              >
                Navegar en Google Maps
              </Button>
            </div>
          </>
        )}

        {/* ── Alerts ──────────────────────────────────────────────── */}
        {alerts.length > 0 && (
          <div className="gc-alerts-section">
            <div className="gc-alerts-title">
              <span className="material-icons-round" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>
                warning
              </span>
              Alertas viales ({alerts.length})
            </div>
            {alerts.map(a => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </div>
        )}

        {/* ── Gemini Analysis ─────────────────────────────────────── */}
        {gemini && (
          <div className="gc-gemini-section">
            <div className="gc-gemini-header">
              <AutoAwesome sx={{ fontSize: 16, color: '#9c27b0' }} />
              <span className="gc-gemini-title">Análisis IA — Google Gemini</span>
              <span
                className="gc-risk-chip"
                style={{ background: gemini.riskColor ?? '#f57c00' }}
              >
                Riesgo {gemini.riskLevel}
              </span>
            </div>

            <p className="gc-gemini-summary">{gemini.summary}</p>

            {gemini.optimalDepartureTime && (
              <div style={{ marginBottom: 8, fontSize: 12, color: '#3c4043' }}>
                <strong>Horario óptimo de salida:</strong> {gemini.optimalDepartureTime}
              </div>
            )}

            {gemini.driverRecommendations.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#5f6368', marginBottom: 4 }}>
                  RECOMENDACIONES AL OPERADOR
                </div>
                <ul className="gc-gemini-list">
                  {gemini.driverRecommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* ── Route Steps ─────────────────────────────────────────── */}
        {leg && (
          <div className="gc-steps-section">
            <div className="gc-alerts-title" style={{ marginTop: 16 }}>
              <span className="material-icons-round" style={{ fontSize: 14, verticalAlign: 'middle', marginRight: 4 }}>
                directions
              </span>
              Ruta paso a paso
            </div>

            {(stepsExpanded ? leg.steps : leg.steps.slice(0, 5)).map(step => (
              <RouteStep
                key={step.index}
                step={step}
                isRestricted={restrictedSet.has(step.index)}
              />
            ))}

            {leg.steps.length > 5 && (
              <button
                onClick={() => setStepsExpanded(v => !v)}
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '8px',
                  background: 'none',
                  border: '1px solid #dadce0',
                  borderRadius: 8,
                  color: '#1a73e8',
                  fontSize: 13,
                  fontFamily: 'var(--font-primary)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {stepsExpanded
                  ? 'Ver menos'
                  : `Ver ${leg.steps.length - 5} pasos más`}
                <NavigateNext
                  sx={{
                    fontSize: 16,
                    transform: stepsExpanded ? 'rotate(-90deg)' : 'rotate(90deg)',
                    transition: 'transform .2s',
                  }}
                />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
