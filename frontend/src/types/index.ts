export interface LatLng {
  lat: number;
  lng: number;
}

export type AlertType =
  | 'PROHIBITED_ZONE'
  | 'TIME_RESTRICTION'
  | 'SCHOOL_ZONE'
  | 'LOADING_RESTRICTION'
  | 'INFRASTRUCTURE_RESTRICTION'
  | 'CARGO_RESTRICTION'
  | 'HIGH_RISK_MANEUVER'
  | 'INFO'
  | 'ERROR';
export type AlertSeverity = 'error' | 'warning' | 'info';

export interface RouteAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  roadName?: string;
  timeWindow?: string;
  stepIndex?: number;
  location?: LatLng;
  maneuver?: string;
}

export interface RouteStep {
  index: number;
  instruction: string;
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  startLocation: LatLng;
  endLocation: LatLng;
  polyline: string;
  travelMode: string;
  maneuver: string | null;
}

export interface RouteLeg {
  startAddress: string;
  endAddress: string;
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  durationInTraffic: { text: string; value: number } | null;
  steps: RouteStep[];
}

export interface Route {
  index: number;
  originalIndex?: number;
  summary: string;
  bounds: { northeast: LatLng; southwest: LatLng };
  overviewPolyline: string;
  legs: RouteLeg[];
}

export interface ValidationSummary {
  totalAlerts: number;
  prohibitedZones: number;
  timeRestrictions: number;
  schoolZones: number;
  loadingRestrictions: number;
  infrastructureRestrictions: number;
  cargoRestrictions: number;
  riskManeuvers: number;
}

export interface RouteValidation {
  isValid: boolean;
  alerts: RouteAlert[];
  restrictedSegments: number[];
  recommendation: string;
  alternativeAvailable: boolean;
  summary: ValidationSummary;
  cargoType?: string;
  vehicleLevel?: number;
  score?: number;
  routeIndex?: number;
}

export interface GeminiAnalysis {
  riskLevel: string;
  riskColor: string;
  mainConcerns: string[];
  driverRecommendations: string[];
  optimalDepartureTime: string | null;
  summary: string;
}

export interface RouteResponse {
  routes: Route[];
  validation: RouteValidation;
  validations?: RouteValidation[];
  geminiAnalysis: GeminiAnalysis | null;
  requestInfo: {
    origin: string;
    destination: string;
    departureTime: string;
    vehicleType: string;
    cargoType?: string;
  };
}
