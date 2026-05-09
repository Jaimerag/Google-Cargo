export const VEHICLE_PROFILES = {
  camioneta: {
    id: 'camioneta',
    label: 'Camioneta 3.5T',
    level: 0,
    weightT: 3.5,
    lengthM: 5.5,
    widthM: 2.0,
    heightM: 2.2,
    axles: 2,
    turnRadiusM: 6.5,
  },
  estaca: {
    id: 'estaca',
    label: 'Estaca 8T',
    level: 1,
    weightT: 8,
    lengthM: 7,
    widthM: 2.3,
    heightM: 2.8,
    axles: 2,
    turnRadiusM: 8,
  },
  rabon: {
    id: 'rabon',
    label: 'Rabon 12T',
    level: 2,
    weightT: 12,
    lengthM: 8,
    widthM: 2.45,
    heightM: 3.2,
    axles: 3,
    turnRadiusM: 9,
  },
  torton_6: {
    id: 'torton_6',
    label: 'Torton 6R 14T',
    level: 3,
    weightT: 14,
    lengthM: 9,
    widthM: 2.5,
    heightM: 3.6,
    axles: 3,
    turnRadiusM: 10,
  },
  torton_12: {
    id: 'torton_12',
    label: 'Torton 12R 24T',
    level: 3,
    weightT: 24,
    lengthM: 11,
    widthM: 2.55,
    heightM: 3.8,
    axles: 4,
    turnRadiusM: 11.5,
  },
  trailer: {
    id: 'trailer',
    label: 'Trailer 32T',
    level: 4,
    weightT: 32,
    lengthM: 18.5,
    widthM: 2.6,
    heightM: 4.2,
    axles: 5,
    turnRadiusM: 13.5,
  },
  full: {
    id: 'full',
    label: 'Full/Doble 52T',
    level: 5,
    weightT: 52,
    lengthM: 26,
    widthM: 2.6,
    heightM: 4.25,
    axles: 7,
    turnRadiusM: 16.5,
    permitRequired: true,
  },
};

export const CARGO_PROFILES = {
  general: {
    id: 'general',
    label: 'Carga general',
  },
  perecedera: {
    id: 'perecedera',
    label: 'Perecedera',
    timeSensitive: true,
  },
  refrigerada: {
    id: 'refrigerada',
    label: 'Refrigerada',
    timeSensitive: true,
    needsStableSpeed: true,
  },
  peligrosa: {
    id: 'peligrosa',
    label: 'Peligrosa / Hazmat',
    hazmat: true,
  },
  sobredimensionada: {
    id: 'sobredimensionada',
    label: 'Sobredimensionada',
    oversize: true,
    extraLengthM: 1.5,
    extraWidthM: 0.25,
    extraHeightM: 0.2,
    extraTurnRadiusM: 1.5,
  },
};

export function getVehicleProfile(vehicleType = 'trailer') {
  return VEHICLE_PROFILES[vehicleType] ?? VEHICLE_PROFILES.trailer;
}

export function getCargoProfile(cargoType = 'general') {
  return CARGO_PROFILES[cargoType] ?? CARGO_PROFILES.general;
}

export function getEffectiveVehicleProfile(vehicleType = 'trailer', cargoType = 'general') {
  const vehicle = getVehicleProfile(vehicleType);
  const cargo = getCargoProfile(cargoType);

  return {
    ...vehicle,
    effectiveLengthM: vehicle.lengthM + (cargo.extraLengthM ?? 0),
    effectiveWidthM: vehicle.widthM + (cargo.extraWidthM ?? 0),
    effectiveHeightM: vehicle.heightM + (cargo.extraHeightM ?? 0),
    effectiveTurnRadiusM: vehicle.turnRadiusM + (cargo.extraTurnRadiusM ?? 0),
    cargo,
  };
}
