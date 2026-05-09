import { useEffect, useRef } from 'react';
import {
  Map,
  useMap,
  useMapsLibrary,
  AdvancedMarker,
} from '@vis.gl/react-google-maps';
import { CircularProgress } from '@mui/material';
import { RouteResponse } from '../types';
import { decodePolyline } from '../utils/polyline';

const MONTERREY = { lat: 25.6866, lng: -100.3161 };
const MAP_ID = 'DEMO_MAP_ID';


// ─── Marcador origen ──────────────────────────────────────────────────────
function OriginPin() {
  return (
    <div style={{
      width: 20, height: 20,
      background: '#34a853',
      border: '3px solid #fff',
      borderRadius: '50%',
      boxShadow: '0 2px 8px rgba(0,0,0,.5)',
    }} />
  );
}

// ─── Marcador destino ─────────────────────────────────────────────────────
function DestPin() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      filter: 'drop-shadow(0 3px 5px rgba(0,0,0,.45))',
    }}>
      <div style={{
        width: 28, height: 28,
        background: '#ea4335',
        border: '3px solid #fff',
        borderRadius: '50% 50% 50% 0',
        transform: 'rotate(-45deg)',
      }} />
    </div>
  );
}

// ─── Overlay de ruta (dentro del contexto Map) ────────────────────────────
function RouteOverlay({
  routeData,
  selectedRoute,
}: {
  routeData: RouteResponse;
  selectedRoute: number;
}) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const polysRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || !mapsLib) return;

    // Limpiar polilíneas anteriores
    polysRef.current.forEach(p => p.setMap(null));
    polysRef.current = [];

    const route = routeData.routes[selectedRoute];
    if (!route) return;

    const currentValidation = routeData.validations?.[selectedRoute] ?? routeData.validation;
    const restricted = new Set(currentValidation.restrictedSegments);

    // Rutas alternativas en gris
    routeData.routes.forEach((r, ri) => {
      if (ri === selectedRoute) return;
      const pts = decodePolyline(r.overviewPolyline);
      polysRef.current.push(new mapsLib.Polyline({
        path: pts,
        strokeColor: '#9aa0a6',
        strokeWeight: 5,
        strokeOpacity: 0.5,
        zIndex: 1,
        map,
        clickable: false,
      }));
    });

    // Pasos de la ruta seleccionada
    const steps = route.legs[0]?.steps ?? [];
    steps.forEach((step) => {
      if (!step.polyline) return;
      const path = decodePolyline(step.polyline);
      const isR = restricted.has(step.index);

      // Sombra / casing
      polysRef.current.push(new mapsLib.Polyline({
        path,
        strokeColor: isR ? '#b71c1c' : '#0d47a1',
        strokeWeight: 11,
        strokeOpacity: 0.22,
        zIndex: 5,
        map,
        clickable: false,
      }));

      // Línea principal
      polysRef.current.push(new mapsLib.Polyline({
        path,
        strokeColor: isR ? '#ea4335' : '#1a73e8',
        strokeWeight: 6,
        strokeOpacity: isR ? 1 : 0.92,
        zIndex: 10,
        map,
        clickable: false,
      }));
    });

    // Ajustar viewport al bbox de la ruta (con padding para el sidebar)
    if (route.bounds) {
      map.fitBounds(
        new google.maps.LatLngBounds(route.bounds.southwest, route.bounds.northeast),
        { top: 60, right: 60, bottom: 60, left: 460 },
      );
    }

    return () => {
      polysRef.current.forEach(p => p.setMap(null));
      polysRef.current = [];
    };
  }, [map, mapsLib, routeData, selectedRoute]);

  const leg = routeData.routes[selectedRoute]?.legs[0];
  const steps = leg?.steps ?? [];
  const originLoc = steps[0]?.startLocation;
  const destLoc   = steps[steps.length - 1]?.endLocation;

  return (
    <>
      {originLoc && (
        <AdvancedMarker position={originLoc} title="Origen">
          <OriginPin />
        </AdvancedMarker>
      )}
      {destLoc && (
        <AdvancedMarker position={destLoc} title="Destino">
          <DestPin />
        </AdvancedMarker>
      )}
      {(routeData.validations?.[selectedRoute] ?? routeData.validation).alerts
        .filter(a => a.location && ['PROHIBITED_ZONE', 'INFRASTRUCTURE_RESTRICTION', 'CARGO_RESTRICTION'].includes(a.type))
        .map(a => (
          <AdvancedMarker key={a.id} position={a.location!} title={a.title}>
            <span className="material-icons-round" style={{
              fontSize: 28,
              color: '#ea4335',
              background: '#fff',
              borderRadius: '50%',
              padding: 2,
              boxShadow: '0 2px 6px rgba(0,0,0,.4)',
            }}>
              block
            </span>
          </AdvancedMarker>
        ))}
    </>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────
export default function MapCanvas({
  routeData,
  selectedRoute,
  isLoading,
}: {
  routeData: RouteResponse | null;
  selectedRoute: number;
  isLoading: boolean;
}) {
  return (
    <div className="gc-map">
      {/* APIProvider ya está en App.tsx — aquí solo va el Map */}
      <Map
        mapId={MAP_ID}
        defaultCenter={MONTERREY}
        defaultZoom={12}
        gestureHandling="greedy"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        {routeData && (
          <RouteOverlay routeData={routeData} selectedRoute={selectedRoute} />
        )}
      </Map>

      {isLoading && (
        <div className="gc-loading">
          <CircularProgress size={44} color="primary" />
        </div>
      )}
    </div>
  );
}
