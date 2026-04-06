export interface Resource {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface TicketAttachment {
  fileName: string;
  contentType: string;
  dataUrl: string;
}

export interface MaintenanceTicket {
  id: string;
  userId: string;
  resourceId?: string;
  resourceName?: string;
  location: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  preferredContactDetails: string;
  preferredContactMethod?: string;
  attachments: TicketAttachment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTicketPayload {
  resourceId?: string;
  resourceName?: string;
  location: string;
  category: string;
  description: string;
  priority: string;
  preferredContactDetails: string;
  preferredContactMethod?: string;
  attachments: TicketAttachment[];
}