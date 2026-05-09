interface Vehicle {
  id: string;
  name: string;
  subtitle: string;
  weight: string;
  length: string;
  axles: number;
  lengthM: number;       // metros reales, para la barra proporcional
  maxLengthM: number;    // referencia máxima para calcular ancho de barra
  permitRequired: boolean;
}

const VEHICLES: Vehicle[] = [
  { id: 'camioneta',  name: 'Camioneta',    subtitle: '3.5 ton',  weight: '3,500 kg', length: '5.5 m',  axles: 2, lengthM: 5.5,  maxLengthM: 26, permitRequired: false },
  { id: 'estaca',     name: 'Estaca',        subtitle: '8 ton',    weight: '8,000 kg', length: '7 m',    axles: 2, lengthM: 7,    maxLengthM: 26, permitRequired: false },
  { id: 'rabon',      name: 'Rabón',         subtitle: '12 ton',   weight: '12,000 kg',length: '8 m',    axles: 3, lengthM: 8,    maxLengthM: 26, permitRequired: false },
  { id: 'torton_6',   name: 'Tortón 6R',     subtitle: '14 ton',   weight: '14,000 kg',length: '9 m',    axles: 3, lengthM: 9,    maxLengthM: 26, permitRequired: false },
  { id: 'torton_12',  name: 'Tortón 12R',    subtitle: '24 ton',   weight: '24,000 kg',length: '11 m',   axles: 4, lengthM: 11,   maxLengthM: 26, permitRequired: false },
  { id: 'trailer',    name: 'Tráiler',       subtitle: '32 ton',   weight: '32,000 kg',length: '18.5 m', axles: 5, lengthM: 18.5, maxLengthM: 26, permitRequired: false },
  { id: 'full',       name: 'Full / Doble',  subtitle: '52 ton',   weight: '52,000 kg',length: '26 m',   axles: 7, lengthM: 26,   maxLengthM: 26, permitRequired: true  },
];

// Icono SVG lateral de camión — escala proporcional según longitud
function TruckSvg({ lengthM, selected, color }: { lengthM: number; selected: boolean; color: string }) {
  // Escalar el SVG de 28px a 52px según el tamaño del vehículo
  const minW = 28, maxW = 56;
  const w = minW + ((lengthM - 5.5) / (26 - 5.5)) * (maxW - minW);
  const h = 20;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', margin: '0 auto' }}>
      {/* Chasis */}
      <rect x={0} y={h * 0.45} width={w} height={h * 0.3} rx={2}
        fill={selected ? color : '#9aa0a6'} />
      {/* Cabina */}
      <rect x={w * 0.62} y={h * 0.2} width={w * 0.36} height={h * 0.55} rx={3}
        fill={selected ? color : '#9aa0a6'} />
      {/* Parabrisas */}
      <rect x={w * 0.7} y={h * 0.25} width={w * 0.22} height={h * 0.22} rx={2}
        fill={selected ? '#e3f2fd' : '#cfd8dc'} />
      {/* Ruedas */}
      <circle cx={w * 0.12} cy={h * 0.82} r={h * 0.16} fill={selected ? '#37474f' : '#b0bec5'} />
      <circle cx={w * 0.28} cy={h * 0.82} r={h * 0.16} fill={selected ? '#37474f' : '#b0bec5'} />
      <circle cx={w * 0.78} cy={h * 0.82} r={h * 0.16} fill={selected ? '#37474f' : '#b0bec5'} />
      {/* Ruedas extra para vehículos largos */}
      {lengthM >= 11 && (
        <circle cx={w * 0.44} cy={h * 0.82} r={h * 0.16} fill={selected ? '#37474f' : '#b0bec5'} />
      )}
      {lengthM >= 18 && (
        <circle cx={w * 0.56} cy={h * 0.82} r={h * 0.16} fill={selected ? '#37474f' : '#b0bec5'} />
      )}
      {/* Remolque para full */}
      {lengthM >= 22 && (
        <>
          <rect x={0} y={h * 0.2} width={w * 0.52} height={h * 0.55} rx={2}
            fill={selected ? `${color}cc` : '#b0bec5'} />
          <circle cx={w * 0.42} cy={h * 0.82} r={h * 0.16} fill={selected ? '#37474f' : '#b0bec5'} />
        </>
      )}
    </svg>
  );
}

// Color de restricción por nivel
function restrictionColor(v: Vehicle, selected: boolean): string {
  if (!selected) return '#dadce0';
  if (v.lengthM >= 22) return '#d32f2f';
  if (v.lengthM >= 18) return '#ea4335';
  if (v.lengthM >= 11) return '#f57c00';
  if (v.lengthM >= 9)  return '#fb8c00';
  if (v.lengthM >= 7)  return '#1a73e8';
  return '#34a853';
}

interface Props {
  selected: string;
  onChange: (id: string) => void;
}

export default function VehicleSelector({ selected, onChange }: Props) {
  const selectedVehicle = VEHICLES.find(v => v.id === selected) ?? VEHICLES[4];

  return (
    <div style={{
      background: '#f8f9fa',
      borderBottom: '1px solid #e8eaed',
      padding: '10px 0 8px',
    }}>
      {/* Encabezado */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '0 16px 8px',
      }}>
        <span className="material-icons-round" style={{ fontSize: 15, color: '#5f6368' }}>
          local_shipping
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#5f6368',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-primary)',
        }}>
          Tipo de Unidad
        </span>
        {selectedVehicle.permitRequired && (
          <span style={{
            marginLeft: 'auto',
            fontSize: 10,
            fontWeight: 700,
            color: '#d32f2f',
            background: '#fce8e6',
            border: '1px solid #ea4335',
            borderRadius: 10,
            padding: '1px 7px',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            <span className="material-icons-round" style={{ fontSize: 11 }}>assignment</span>
            Requiere permiso SCT
          </span>
        )}
      </div>

      {/* Tarjetas de vehículos — scroll horizontal */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '0 16px 4px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {VEHICLES.map(v => {
          const isSelected = v.id === selected;
          const color = restrictionColor(v, true);

          return (
            <button
              key={v.id}
              onClick={() => onChange(v.id)}
              title={`${v.name} — ${v.weight} / ${v.length}`}
              style={{
                flexShrink: 0,
                width: 82,
                padding: '7px 6px 6px',
                border: `2px solid ${isSelected ? color : '#e8eaed'}`,
                borderRadius: 10,
                background: isSelected ? `${color}12` : '#fff',
                cursor: 'pointer',
                transition: 'all .15s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                outline: 'none',
              }}
            >
              {/* SVG del camión */}
              <TruckSvg lengthM={v.lengthM} selected={isSelected} color={color} />

              {/* Nombre */}
              <div style={{
                fontSize: 11,
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? color : '#3c4043',
                fontFamily: 'var(--font-primary)',
                lineHeight: 1.2,
                textAlign: 'center',
              }}>
                {v.name}
              </div>

              {/* Peso */}
              <div style={{
                fontSize: 10,
                color: isSelected ? color : '#70757a',
                fontWeight: isSelected ? 600 : 400,
                lineHeight: 1,
              }}>
                {v.subtitle}
              </div>

              {/* Barra de longitud proporcional */}
              <div style={{
                width: '100%',
                height: 3,
                background: '#e8eaed',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${(v.lengthM / v.maxLengthM) * 100}%`,
                  height: '100%',
                  background: isSelected ? color : '#bdc1c6',
                  borderRadius: 2,
                  transition: 'all .15s ease',
                }} />
              </div>

              {/* Longitud */}
              <div style={{ fontSize: 9, color: '#9aa0a6', marginTop: -1 }}>
                {v.length}
              </div>
            </button>
          );
        })}
      </div>

      {/* Resumen de la unidad seleccionada */}
      <div style={{
        margin: '6px 16px 0',
        padding: '5px 10px',
        background: '#fff',
        border: `1px solid ${restrictionColor(selectedVehicle, true)}30`,
        borderRadius: 8,
        display: 'flex',
        gap: 14,
        alignItems: 'center',
      }}>
        {[
          { label: 'Peso máx.', value: selectedVehicle.weight, icon: 'monitor_weight' },
          { label: 'Longitud',  value: selectedVehicle.length,  icon: 'straighten' },
          { label: 'Ejes',      value: `${selectedVehicle.axles} ejes`, icon: 'settings' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
            <span className="material-icons-round" style={{
              fontSize: 13,
              color: restrictionColor(selectedVehicle, true),
            }}>
              {item.icon}
            </span>
            <div>
              <div style={{ fontSize: 9, color: '#70757a', lineHeight: 1 }}>{item.label}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#202124', fontFamily: 'var(--font-primary)', lineHeight: 1.3 }}>
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { VEHICLES };
