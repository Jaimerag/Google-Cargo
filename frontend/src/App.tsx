import { useState, useCallback, useEffect, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import MapCanvas from './components/MapCanvas';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import { RouteResponse } from './types';
import { routeApi } from './services/api';

const GMAPS_KEY = import.meta.env.VITE_GMAPS_API_KEY as string;

interface LastRouteRequest {
  origin: string;
  destination: string;
  departureTime?: string;
}

export default function App() {
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Sidebar abierto por defecto para que el usuario vea el formulario
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [vehicleType, setVehicleType] = useState('trailer'); // default: tráiler
  const [cargoType, setCargoType] = useState('general');
  const lastRequestRef = useRef<LastRouteRequest | null>(null);
  const requestSeqRef = useRef(0);


  const fetchRoute = useCallback(async (
    origin: string,
    destination: string,
    departureTime?: string,
    nextVehicleType = vehicleType,
    nextCargoType = cargoType,
  ) => {
    const requestId = ++requestSeqRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const data = await routeApi.getRoute(origin, destination, departureTime, nextVehicleType, nextCargoType);
      if (requestId !== requestSeqRef.current) return;
      setRouteData(data);
      setSelectedRoute(0);
    } catch (err: unknown) {
      if (requestId !== requestSeqRef.current) return;
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setError(axiosErr.response?.data?.error ?? axiosErr.message ?? 'Error al conectar con el servidor');
    } finally {
      if (requestId === requestSeqRef.current) setIsLoading(false);
    }
  }, [cargoType, vehicleType]);

  const handleCalculate = useCallback((
    origin: string,
    destination: string,
    departureTime?: string,
  ) => {
    lastRequestRef.current = { origin, destination, departureTime };
    void fetchRoute(origin, destination, departureTime, vehicleType, cargoType);
  }, [cargoType, fetchRoute, vehicleType]);

  useEffect(() => {
    const lastRequest = lastRequestRef.current;
    if (!lastRequest) return;
    void fetchRoute(lastRequest.origin, lastRequest.destination, lastRequest.departureTime, vehicleType, cargoType);
  }, [cargoType, fetchRoute, vehicleType]);

  return (
    // APIProvider envuelve TODO — así Sidebar y MapCanvas comparten el contexto de Google Maps
    <APIProvider apiKey={GMAPS_KEY} libraries={['places']}>
      <div className="gc-app">
        <MapCanvas
          routeData={routeData}
          selectedRoute={selectedRoute}
          isLoading={isLoading}
        />

        <SearchBar
          sidebarOpen={sidebarOpen}
          onOpen={() => setSidebarOpen(true)}
        />

        <Sidebar
          open={sidebarOpen}
          routeData={routeData}
          isLoading={isLoading}
          error={error}
          selectedRoute={selectedRoute}
          onSelectRoute={setSelectedRoute}
          onClose={() => setSidebarOpen(false)}
          onCalculate={handleCalculate}
          vehicleType={vehicleType}
          onVehicleChange={setVehicleType}
          cargoType={cargoType}
          onCargoChange={setCargoType}
        />
      </div>
    </APIProvider>
  );
}
