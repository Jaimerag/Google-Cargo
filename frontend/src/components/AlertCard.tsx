import { RouteAlert } from '../types';

interface Props {
  alert: RouteAlert;
}

// Configuración visual por tipo de alerta
const ALERT_CONFIG: Record<string, {
  icon: string;
  label: string;
  bg: string;
  border: string;
  titleColor: string;
  iconColor: string;
}> = {
  PROHIBITED_ZONE: {
    icon: 'block',
    label: 'ZONA PROHIBIDA',
    bg: '#fce8e6',
    border: '#ea4335',
    titleColor: '#c5221f',
    iconColor: '#ea4335',
  },
  TIME_RESTRICTION: {
    icon: 'schedule',
    label: 'RESTRICCIÓN HORARIA',
    bg: '#fff3e0',
    border: '#f57c00',
    titleColor: '#9e3c00',
    iconColor: '#f57c00',
  },
  SCHOOL_ZONE: {
    icon: 'school',
    label: 'ZONA ESCOLAR',
    bg: '#fffde7',
    border: '#f9a825',
    titleColor: '#6d4c00',
    iconColor: '#f9a825',
  },
  LOADING_RESTRICTION: {
    icon: 'local_shipping',
    label: 'CARGA / DESCARGA',
    bg: '#fce4ec',
    border: '#e91e63',
    titleColor: '#880e4f',
    iconColor: '#e91e63',
  },
  INFRASTRUCTURE_RESTRICTION: {
    icon: 'height',
    label: 'INFRAESTRUCTURA',
    bg: '#e8f0fe',
    border: '#1a73e8',
    titleColor: '#1558d6',
    iconColor: '#1a73e8',
  },
  CARGO_RESTRICTION: {
    icon: 'warning',
    label: 'TIPO DE CARGA',
    bg: '#ede7f6',
    border: '#673ab7',
    titleColor: '#4527a0',
    iconColor: '#673ab7',
  },
  HIGH_RISK_MANEUVER: {
    icon: 'turn_sharp_right',
    label: 'MANIOBRA DE RIESGO',
    bg: '#f3e5f5',
    border: '#9c27b0',
    titleColor: '#4a148c',
    iconColor: '#9c27b0',
  },
  INFO: {
    icon: 'info',
    label: 'INFORMACIÓN',
    bg: '#e8f0fe',
    border: '#1a73e8',
    titleColor: '#1558d6',
    iconColor: '#1a73e8',
  },
  ERROR: {
    icon: 'error',
    label: 'ERROR',
    bg: '#fce8e6',
    border: '#ea4335',
    titleColor: '#c5221f',
    iconColor: '#ea4335',
  },
};

// Icono especial para maniobras
const MANEUVER_ICONS: Record<string, string> = {
  'uturn-left':       'u_turn_left',
  'uturn-right':      'u_turn_right',
  'turn-sharp-left':  'turn_sharp_left',
  'turn-sharp-right': 'turn_sharp_right',
  'roundabout-left':  'roundabout_left',
  'roundabout-right': 'roundabout_right',
  'fork-left':        'fork_left',
  'fork-right':       'fork_right',
};

export default function AlertCard({ alert }: Props) {
  const cfg = ALERT_CONFIG[alert.type] ?? ALERT_CONFIG.INFO;
  const icon = (alert.type === 'HIGH_RISK_MANEUVER' && alert.maneuver && MANEUVER_ICONS[alert.maneuver])
    ? MANEUVER_ICONS[alert.maneuver as string]
    : cfg.icon;

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      padding: '10px 12px',
      borderRadius: 10,
      marginBottom: 8,
      background: cfg.bg,
      borderLeft: `4px solid ${cfg.border}`,
    }}>
      {/* Icono */}
      <span
        className="material-icons-round"
        style={{ fontSize: 20, color: cfg.iconColor, flexShrink: 0, marginTop: 1 }}
      >
        {icon}
      </span>

      {/* Contenido */}
      <div style={{ minWidth: 0, flex: 1 }}>
        {/* Chip de tipo */}
        <div style={{
          display: 'inline-block',
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.6px',
          color: cfg.iconColor,
          background: `${cfg.border}18`,
          borderRadius: 4,
          padding: '1px 6px',
          marginBottom: 4,
          fontFamily: 'var(--font-primary)',
        }}>
          {cfg.label}
        </div>

        {/* Título */}
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'var(--font-primary)',
          color: cfg.titleColor,
          lineHeight: 1.3,
          marginBottom: 4,
        }}>
          {alert.title}
        </div>

        {/* Mensaje */}
        <div style={{
          fontSize: 12,
          lineHeight: 1.55,
          color: '#3c4043',
        }}>
          {alert.message}
        </div>

        {/* Ventana horaria */}
        {alert.timeWindow && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 6,
            background: 'rgba(0,0,0,.06)',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 600,
            color: '#3c4043',
            fontFamily: 'var(--font-primary)',
          }}>
            <span className="material-icons-round" style={{ fontSize: 12 }}>schedule</span>
            {alert.timeWindow}
          </div>
        )}
      </div>
    </div>
  );
}
