package lk.sliit.it3030.smartcampus.service;

import lk.sliit.it3030.smartcampus.dto.CreateMaintenanceTicketRequest;
import lk.sliit.it3030.smartcampus.model.MaintenanceTicket;
import lk.sliit.it3030.smartcampus.repository.MaintenanceTicketRepository;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.concurrent.ExecutionException;

@Service
public class MaintenanceTicketService {

    private static final int MAX_ATTACHMENTS = 3;

    private final MaintenanceTicketRepository maintenanceTicketRepository;

    public MaintenanceTicketService(MaintenanceTicketRepository maintenanceTicketRepository) {
        this.maintenanceTicketRepository = maintenanceTicketRepository;
    }

    public MaintenanceTicket createTicket(String userId, CreateMaintenanceTicketRequest request) throws ExecutionException, InterruptedException {
        validateRequest(request);

        Date now = new Date();

        MaintenanceTicket ticket = MaintenanceTicket.builder()
                .userId(userId)
                .resourceId(trimToNull(request.getResourceId()))
                .resourceName(trimToNull(request.getResourceName()))
                .location(request.getLocation().trim())
                .category(request.getCategory().trim().toUpperCase(Locale.ROOT))
                .description(request.getDescription().trim())
                .priority(request.getPriority().trim().toUpperCase(Locale.ROOT))
                .status("OPEN")
                .preferredContactDetails(request.getPreferredContactDetails().trim())
                .preferredContactMethod(trimToNull(request.getPreferredContactMethod()))
                .attachments(mapAttachments(request.getAttachments()))
                .createdAt(now)
                .updatedAt(now)
                .build();

        maintenanceTicketRepository.save(ticket);
        return ticket;
    }

    public List<MaintenanceTicket> getMyTickets(String userId) throws ExecutionException, InterruptedException {
        return maintenanceTicketRepository.findByUserId(userId);
    }

    public List<MaintenanceTicket> getAllTicketsForAdmin() throws ExecutionException, InterruptedException {
        return maintenanceTicketRepository.findAll();
    }

    public MaintenanceTicket assignTechnician(String ticketId, String technicianId, String technicianEmail)
            throws ExecutionException, InterruptedException {
        if (technicianId == null || technicianId.isBlank()) {
            throw new IllegalArgumentException("Technician ID is required");
        }

        MaintenanceTicket ticket = getTicketOrThrow(ticketId);
        if ("REJECTED".equalsIgnoreCase(ticket.getStatus())) {
            throw new IllegalArgumentException("Rejected tickets cannot be modified");
        }

        Date now = new Date();

        ticket.setAssignedTechnicianId(technicianId.trim());
        ticket.setAssignedTechnicianEmail(trimToNull(technicianEmail));
        ticket.setAssignedAt(now);
        ticket.setStatus("IN_PROGRESS");
        ticket.setUpdatedAt(now);

        maintenanceTicketRepository.save(ticket);
        return ticket;
    }

    public MaintenanceTicket updateTicketStatusByAdmin(String ticketId, String status, String reason)
            throws ExecutionException, InterruptedException {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }

        String normalizedStatus = status.trim().toUpperCase(Locale.ROOT);
        if (!"OPEN".equals(normalizedStatus)
                && !"IN_PROGRESS".equals(normalizedStatus)
                && !"RESOLVED".equals(normalizedStatus)
                && !"CLOSED".equals(normalizedStatus)
                && !"REJECTED".equals(normalizedStatus)) {
            throw new IllegalArgumentException("Status can only be OPEN, IN_PROGRESS, RESOLVED, CLOSED, or REJECTED");
        }

        MaintenanceTicket ticket = getTicketOrThrow(ticketId);
        String currentStatus = ticket.getStatus() == null ? "OPEN" : ticket.getStatus().toUpperCase(Locale.ROOT);
        if ("REJECTED".equals(currentStatus)) {
            throw new IllegalArgumentException("Rejected tickets cannot be modified");
        }

        if ("REJECTED".equals(normalizedStatus)) {
            if (!"OPEN".equals(currentStatus)) {
                throw new IllegalArgumentException("Only OPEN tickets can be rejected");
            }
            if (reason == null || reason.isBlank()) {
                throw new IllegalArgumentException("Reason is required when rejecting a ticket");
            }
        }

        Date now = new Date();

        ticket.setStatus(normalizedStatus);
        ticket.setUpdatedAt(now);
        ticket.setRejectionReason("REJECTED".equals(normalizedStatus) ? reason.trim() : null);
        ticket.setClosedAt(("CLOSED".equals(normalizedStatus) || "REJECTED".equals(normalizedStatus)) ? now : null);

        maintenanceTicketRepository.save(ticket);
        return ticket;
    }

    private void validateRequest(CreateMaintenanceTicketRequest request) {
        if (request.getAttachments() != null && request.getAttachments().size() > MAX_ATTACHMENTS) {
            throw new IllegalArgumentException("You can upload up to 3 image attachments only.");
        }

        if (request.getAttachments() == null) {
            return;
        }

        for (CreateMaintenanceTicketRequest.ImageAttachmentRequest attachment : request.getAttachments()) {
            if (attachment.getContentType() == null || !attachment.getContentType().toLowerCase(Locale.ROOT).startsWith("image/")) {
                throw new IllegalArgumentException("Only image attachments are allowed.");
            }
            if (attachment.getDataUrl() == null || !attachment.getDataUrl().startsWith("data:image/")) {
                throw new IllegalArgumentException("Attachment data must be a valid image data URL.");
            }
        }
    }

    private List<MaintenanceTicket.ImageAttachment> mapAttachments(List<CreateMaintenanceTicketRequest.ImageAttachmentRequest> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return List.of();
        }

        return attachments.stream()
                .map(attachment -> new MaintenanceTicket.ImageAttachment(
                        attachment.getFileName().trim(),
                        attachment.getContentType().trim(),
                        attachment.getDataUrl().trim()
                ))
                .toList();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private MaintenanceTicket getTicketOrThrow(String ticketId) throws ExecutionException, InterruptedException {
        MaintenanceTicket ticket = maintenanceTicketRepository.findById(ticketId);
        if (ticket == null) {
            throw new NoSuchElementException("Ticket not found");
        }
        return ticket;
    }
}