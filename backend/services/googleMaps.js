import axios from 'axios';

const DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';

const STATUS_MESSAGES = {
  NOT_FOUND: 'No se encontró la dirección especificada.',
  ZERO_RESULTS: 'No hay rutas disponibles entre los puntos indicados.',
  MAX_WAYPOINTS_EXCEEDED: 'Se excedió el número máximo de puntos intermedios.',
  INVALID_REQUEST: 'La solicitud es inválida. Verifique origen y destino.',
  REQUEST_DENIED: 'La solicitud fue denegada. Verifique la API Key de Google Maps.',
  OVER_DAILY_LIMIT: 'Se alcanzó el límite diario de la API de Google Maps.',
  OVER_QUERY_LIMIT: 'Demasiadas solicitudes. Intente nuevamente en unos segundos.',
  UNKNOWN_ERROR: 'Error desconocido en la API de Google Maps.',
};

export async function getRoute(origin, destination, departureTime, _vehicleType, _cargoType) {
  const params = {
    origin,
    destination,
    mode: 'driving',
    key: process.env.GMAPS_API_KEY,
    language: 'es',
    region: 'MX',
    alternatives: 'true',
    traffic_model: 'best_guess',
  };

  if (departureTime) {
    const ts = Math.floor(new Date(departureTime).getTime() / 1000);
    if (!isNaN(ts)) params.departure_time = ts;
  } else {
    params.departure_time = 'now';
  }

  const { data } = await axios.get(DIRECTIONS_URL, { params, timeout: 10000 });

  if (data.status !== 'OK') {
    const msg = STATUS_MESSAGES[data.status] || `Error Google Maps: ${data.status}`;
    throw new Error(msg);
  }

  return data;
}
