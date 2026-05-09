import { useState, useRef, useEffect, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { TextField, Paper, List, ListItemButton, ListItemIcon, ListItemText, InputAdornment } from '@mui/material';
import { LocationOn, Search } from '@mui/icons-material';

interface Prediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  description: string;
}

interface Props {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  leadingIcon?: React.ReactNode;
}

const MONTERREY_LATLNG = { lat: 25.6866, lng: -100.3161 };

export default function PlaceAutocomplete({ placeholder, value, onChange, leadingIcon }: Props) {
  const placesLib = useMapsLibrary('places');
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [open, setOpen] = useState(false);
  const [inputVal, setInputVal] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inicializar AutocompleteService cuando la librería esté lista
  useEffect(() => {
    if (!placesLib) return;
    serviceRef.current = new placesLib.AutocompleteService();
  }, [placesLib]);

  // Sincronizar si el valor externo cambia (ej. swap de origen/destino)
  useEffect(() => {
    setInputVal(value);
  }, [value]);

  const fetchSuggestions = useCallback((query: string) => {
    if (!serviceRef.current || query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    serviceRef.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'mx' },
        locationBias: {
          center: new google.maps.LatLng(MONTERREY_LATLNG.lat, MONTERREY_LATLNG.lng),
          radius: 80000, // 80 km alrededor de Monterrey
        } as unknown as google.maps.Circle,
        types: ['geocode', 'establishment'],
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions.map(p => ({
            placeId: p.place_id,
            mainText: p.structured_formatting.main_text,
            secondaryText: p.structured_formatting.secondary_text ?? '',
            description: p.description,
          })));
          setOpen(true);
        } else {
          setSuggestions([]);
          setOpen(false);
        }
      },
    );
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 280);
  };

  const handleSelect = (prediction: Prediction) => {
    setInputVal(prediction.description);
    onChange(prediction.description);
    setSuggestions([]);
    setOpen(false);
  };

  const handleBlur = () => {
    // Pequeño delay para que el click en sugerencia se procese antes de cerrar
    setTimeout(() => setOpen(false), 180);
  };

  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <TextField
        fullWidth
        size="small"
        placeholder={placeholder}
        value={inputVal}
        onChange={handleInputChange}
        onFocus={() => inputVal.length >= 3 && suggestions.length > 0 && setOpen(true)}
        onBlur={handleBlur}
        InputProps={{
          style: { fontSize: 14 },
          startAdornment: leadingIcon ? (
            <InputAdornment position="start">{leadingIcon}</InputAdornment>
          ) : undefined,
        }}
      />

      {open && suggestions.length > 0 && (
        <Paper
          elevation={6}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            maxHeight: 280,
            overflowY: 'auto',
            borderRadius: 12,
          }}
        >
          <List dense disablePadding>
            {suggestions.map((s, i) => (
              <ListItemButton
                key={s.placeId}
                onMouseDown={() => handleSelect(s)}
                divider={i < suggestions.length - 1}
                sx={{ py: 1, px: 2 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LocationOn sx={{ color: '#70757a', fontSize: 20 }} />
                </ListItemIcon>
                <ListItemText
                  primary={s.mainText}
                  secondary={s.secondaryText}
                  primaryTypographyProps={{ fontSize: 13, fontWeight: 500, color: '#202124' }}
                  secondaryTypographyProps={{ fontSize: 11, color: '#70757a' }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
}
