import apiClient from '../api/apiClient';
import type { CreateTicketPayload, MaintenanceTicket, Resource } from '../types/ticket';

export const getMyTickets = async (): Promise<MaintenanceTicket[]> => {
  const response = await apiClient.get<MaintenanceTicket[]>('/tickets/my');
  return response.data;
};

export const createTicket = async (payload: CreateTicketPayload): Promise<MaintenanceTicket> => {
  const response = await apiClient.post<MaintenanceTicket>('/tickets', payload);
  return response.data;
};

export const getResources = async (): Promise<Resource[]> => {
  const response = await apiClient.get<Resource[]>('/resources');
  return response.data;
};