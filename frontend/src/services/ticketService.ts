import apiClient from '../api/apiClient';
import type { CreateTicketPayload, MaintenanceTicket, Resource } from '../types/ticket';

export interface TechnicianTicketMessagePayload {
  message?: string;
  imageDataUrl?: string;
  imageFileName?: string;
  imageContentType?: string;
  senderEmail?: string;
}

export interface TechnicianTicketStatusPayload {
  status: 'IN_PROGRESS' | 'RESOLVED';
}

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

export const getAssignedTechnicianTickets = async (): Promise<MaintenanceTicket[]> => {
  const response = await apiClient.get<MaintenanceTicket[]>('/tickets/technician/assigned');
  return response.data;
};

export const postTechnicianTicketMessage = async (
  ticketId: string,
  payload: TechnicianTicketMessagePayload,
): Promise<MaintenanceTicket> => {
  const response = await apiClient.post<MaintenanceTicket>(`/tickets/${ticketId}/technician-message`, payload);
  return response.data;
};

export const patchTechnicianTicketStatus = async (
  ticketId: string,
  payload: TechnicianTicketStatusPayload,
): Promise<MaintenanceTicket> => {
  const response = await apiClient.patch<MaintenanceTicket>(`/tickets/${ticketId}/technician-status`, payload);
  return response.data;
};