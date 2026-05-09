import { MenuItem, TextField } from '@mui/material';

interface CargoOption {
  id: string;
  label: string;
  detail: string;
  icon: string;
}

const CARGO_OPTIONS: CargoOption[] = [
  { id: 'general', label: 'Carga general', detail: 'Sin restricciones especiales', icon: 'inventory_2' },
  { id: 'perecedera', label: 'Perecedera', detail: 'Prioriza ventanas de entrega', icon: 'timer' },
  { id: 'refrigerada', label: 'Refrigerada', detail: 'Evita demoras prolongadas', icon: 'ac_unit' },
  { id: 'peligrosa', label: 'Peligrosa / Hazmat', detail: 'Evita tuneles y zonas sensibles', icon: 'warning' },
  { id: 'sobredimensionada', label: 'Sobredimensionada', detail: 'Aplica galibo y radios mayores', icon: 'open_in_full' },
];

interface Props {
  selected: string;
  onChange: (id: string) => void;
}

export default function CargoSelector({ selected, onChange }: Props) {
  return (
    <div className="gc-cargo-selector">
      <div className="gc-cargo-label">
        <span className="material-icons-round">package_2</span>
        <span>Tipo de carga</span>
      </div>

      <TextField
        select
        fullWidth
        size="small"
        value={selected}
        onChange={event => onChange(event.target.value)}
        SelectProps={{
          renderValue: value => {
            const option = CARGO_OPTIONS.find(item => item.id === value) ?? CARGO_OPTIONS[0];
            return (
              <span className="gc-cargo-value">
                <span className="material-icons-round">{option.icon}</span>
                {option.label}
              </span>
            );
          },
        }}
      >
        {CARGO_OPTIONS.map(option => (
          <MenuItem key={option.id} value={option.id}>
            <span className="gc-cargo-option">
              <span className="material-icons-round">{option.icon}</span>
              <span>
                <strong>{option.label}</strong>
                <small>{option.detail}</small>
              </span>
            </span>
          </MenuItem>
        ))}
      </TextField>
    </div>
  );
}

export { CARGO_OPTIONS };
