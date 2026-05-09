import axios from 'axios';
import { RouteResponse } from '../types';

const client = axios.create({ baseURL: '/api' });

export const routeApi = {
  async getRoute(
    origin: string,
    destination: string,
    departureTime?: string,
    vehicleType = 'camion',
    cargoType = 'general'
  ): Promise<RouteResponse> {
    const { data } = await client.post<RouteResponse>('/route', {
      origin,
      destination,
      departureTime,
      vehicleType,
      cargoType,
    });
    return data;
  },

  async health() {
    const { data } = await client.get('/health');
    return data;
  },
};
