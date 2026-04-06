package lk.sliit.it3030.smartcampus.service;

import lk.sliit.it3030.smartcampus.dto.CreateMaintenanceTicketRequest;
import lk.sliit.it3030.smartcampus.model.MaintenanceTicket;
import lk.sliit.it3030.smartcampus.repository.MaintenanceTicketRepository;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Locale;
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
}