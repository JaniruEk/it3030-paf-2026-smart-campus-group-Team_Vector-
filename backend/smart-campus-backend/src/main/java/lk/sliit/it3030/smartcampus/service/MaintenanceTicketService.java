package lk.sliit.it3030.smartcampus.service;

import lk.sliit.it3030.smartcampus.dto.CreateMaintenanceTicketRequest;
import lk.sliit.it3030.smartcampus.model.MaintenanceTicket;
import lk.sliit.it3030.smartcampus.repository.MaintenanceTicketRepository;
import com.google.firebase.auth.ExportedUserRecord;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.ListUsersPage;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.concurrent.ExecutionException;

@Service
public class MaintenanceTicketService {

    private static final int MAX_ATTACHMENTS = 3;
    private static final String ROLE_ADMIN = "ADMIN";

    private final MaintenanceTicketRepository maintenanceTicketRepository;
    private final NotificationService notificationService;

    public MaintenanceTicketService(MaintenanceTicketRepository maintenanceTicketRepository, NotificationService notificationService) {
        this.maintenanceTicketRepository = maintenanceTicketRepository;
        this.notificationService = notificationService;
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

        // Notify Admins about the new incident in background
        new Thread(() -> {
            try {
                ListUsersPage page = FirebaseAuth.getInstance().listUsers(null);
                java.util.List<String> adminUids = new java.util.ArrayList<>();
                for (ExportedUserRecord user : page.iterateAll()) {
                    java.util.Map<String, Object> claims = user.getCustomClaims();
                    if (claims != null && "ADMIN".equals(claims.get("role"))) {
                        adminUids.add(user.getUid());
                    }
                }
                if (!adminUids.isEmpty()) {
                    String msg = String.format("New %s incident reported at %s: %s", 
                        ticket.getCategory(), 
                        ticket.getLocation(), 
                        ticket.getDescription());
                    notificationService.broadcastToRole(msg, "ADMIN", adminUids, ticket.getId(), "TICKET_REPORTED");
                }
            } catch (Exception e) {
                System.err.println("Failed to notify admins of new ticket: " + e.getMessage());
            }
        }).start();

        return ticket;
    }

    public List<MaintenanceTicket> getMyTickets(String userId) throws ExecutionException, InterruptedException {
        return maintenanceTicketRepository.findByUserId(userId);
    }

    public MaintenanceTicket updateMyTicket(String userId,
                                            String ticketId,
                                            CreateMaintenanceTicketRequest request)
            throws ExecutionException, InterruptedException {
        validateRequest(request);

        MaintenanceTicket ticket = getTicketOrThrow(ticketId);
        validateTicketOwner(userId, ticket);

        String currentStatus = ticket.getStatus() == null ? "OPEN" : ticket.getStatus().toUpperCase(Locale.ROOT);
        if ("RESOLVED".equals(currentStatus) || "CLOSED".equals(currentStatus) || "REJECTED".equals(currentStatus)) {
            throw new IllegalArgumentException("Ticket can only be edited before it is resolved");
        }

        ticket.setResourceId(trimToNull(request.getResourceId()));
        ticket.setResourceName(trimToNull(request.getResourceName()));
        ticket.setLocation(request.getLocation().trim());
        ticket.setCategory(request.getCategory().trim().toUpperCase(Locale.ROOT));
        ticket.setDescription(request.getDescription().trim());
        ticket.setPriority(request.getPriority().trim().toUpperCase(Locale.ROOT));
        ticket.setPreferredContactDetails(request.getPreferredContactDetails().trim());
        ticket.setPreferredContactMethod(trimToNull(request.getPreferredContactMethod()));
        ticket.setAttachments(mapAttachments(request.getAttachments()));
        ticket.setUpdatedAt(new Date());

        maintenanceTicketRepository.save(ticket);
        return ticket;
    }

    public void deleteMyTicket(String userId, String ticketId) throws ExecutionException, InterruptedException {
        MaintenanceTicket ticket = getTicketOrThrow(ticketId);
        validateTicketOwner(userId, ticket);
        maintenanceTicketRepository.deleteById(ticketId);
    }

    public List<MaintenanceTicket> getAllTicketsForAdmin() throws ExecutionException, InterruptedException {
        return maintenanceTicketRepository.findAll();
    }

    public List<MaintenanceTicket> getAssignedTicketsForTechnician(String technicianId)
            throws ExecutionException, InterruptedException {
        return maintenanceTicketRepository.findByAssignedTechnicianId(technicianId);
    }

    public MaintenanceTicket addTicketComment(String ticketId,
                                              String userId,
                                              String userRole,
                                              lk.sliit.it3030.smartcampus.dto.CommentRequest request)
            throws ExecutionException, InterruptedException {
        MaintenanceTicket ticket = getTicketOrThrow(ticketId);

        String currentStatus = ticket.getStatus() == null ? "OPEN" : ticket.getStatus().toUpperCase(Locale.ROOT);
        if ("REJECTED".equals(currentStatus) || "CLOSED".equals(currentStatus)) {
            throw new IllegalArgumentException("Cannot add comments to a closed or rejected ticket");
        }

        // Optional: restriction that only owner or assigned tech or admin can comment
        boolean isAdmin = ROLE_ADMIN.equals(userRole);
        boolean isOwner = userId.equals(ticket.getUserId());
        boolean isAssignedTech = userId.equals(ticket.getAssignedTechnicianId());

        if (!isAdmin && !isOwner && !isAssignedTech) {
            throw new IllegalArgumentException("You do not have permission to comment on this ticket");
        }

        String message = trimToNull(request.getMessage());
        String imageDataUrl = trimToNull(request.getImageDataUrl());
        if (message == null && imageDataUrl == null) {
            throw new IllegalArgumentException("Message or image is required");
        }

        if (imageDataUrl != null && !imageDataUrl.startsWith("data:image/")) {
            throw new IllegalArgumentException("Only image attachments are allowed for comments");
        }

        if (ticket.getTicketMessages() == null) {
            ticket.setTicketMessages(new java.util.ArrayList<>());
        }

        MaintenanceTicket.TicketMessage ticketMessage = new MaintenanceTicket.TicketMessage(
                userId,
                userRole,
                trimToNull(request.getSenderEmail()),
                message,
                imageDataUrl,
                trimToNull(request.getImageFileName()),
                trimToNull(request.getImageContentType()),
                new Date()
        );

        ticket.getTicketMessages().add(ticketMessage);
        ticket.setUpdatedAt(new Date());

        maintenanceTicketRepository.save(ticket);

        // Notify relevant parties about the new comment
        new Thread(() -> {
            try {
                String senderName = trimToNull(request.getSenderEmail()) != null ? request.getSenderEmail() : userRole;
                String msg = String.format("New comment on %s incident at %s by %s.", 
                    ticket.getCategory(), 
                    ticket.getLocation(), 
                    senderName);
                
                if (userRole.equals("USER")) {
                    // Notify Admin and Tech
                    notificationService.broadcastToRole(msg, "ADMIN", List.of(), ticket.getId(), "COMMENT_ADDED"); 
                    if (ticket.getAssignedTechnicianId() != null) {
                        notificationService.createNotification(ticket.getAssignedTechnicianId(), msg, "COMMENT_ADDED", ticket.getId());
                    }
                } else {
                    // Notify the reporting User
                    notificationService.createNotification(ticket.getUserId(), msg, "COMMENT_ADDED", ticket.getId());
                }
            } catch (Exception e) {
                System.err.println("Failed to send comment notification: " + e.getMessage());
            }
        }).start();

        return ticket;
    }

    public MaintenanceTicket updateTicketComment(String ticketId,
                                                 String userId,
                                                 int commentIndex,
                                                 lk.sliit.it3030.smartcampus.dto.CommentRequest request)
            throws ExecutionException, InterruptedException {
        MaintenanceTicket ticket = getTicketOrThrow(ticketId);
        List<MaintenanceTicket.TicketMessage> messages = ticket.getTicketMessages();

        if (messages == null || commentIndex < 0 || commentIndex >= messages.size()) {
            throw new NoSuchElementException("Comment not found");
        }

        MaintenanceTicket.TicketMessage message = messages.get(commentIndex);
        if (message.getSenderId() == null || !message.getSenderId().equals(userId)) {
            throw new IllegalArgumentException("You can only edit your own comments");
        }

        String content = trimToNull(request.getMessage());
        if (content == null) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }

        message.setMessage(content);
        // We typically don't allow changing images in an edit for simplicity, or we can.
        // Let's just update the message text as per typical comment edit rules.
        
        ticket.setUpdatedAt(new Date());
        maintenanceTicketRepository.save(ticket);
        return ticket;
    }

    public MaintenanceTicket deleteTicketComment(String ticketId,
                                                 String userId,
                                                 String userRole,
                                                 int commentIndex)
            throws ExecutionException, InterruptedException {
        MaintenanceTicket ticket = getTicketOrThrow(ticketId);
        List<MaintenanceTicket.TicketMessage> messages = ticket.getTicketMessages();

        if (messages == null || commentIndex < 0 || commentIndex >= messages.size()) {
            throw new NoSuchElementException("Comment not found");
        }

        MaintenanceTicket.TicketMessage message = messages.get(commentIndex);
        
        boolean isAdmin = ROLE_ADMIN.equals(userRole);
        boolean isAuthor = userId.equals(message.getSenderId());

        if (!isAdmin && !isAuthor) {
            throw new IllegalArgumentException("You do not have permission to delete this comment");
        }

        messages.remove(commentIndex);
        ticket.setUpdatedAt(new Date());
        maintenanceTicketRepository.save(ticket);
        return ticket;
    }

    public MaintenanceTicket updateTicketStatusByTechnician(String ticketId,
                                                            String technicianId,
                                                            String targetStatus,
                                                            String resolutionNotes)
            throws ExecutionException, InterruptedException {
        if (targetStatus == null || targetStatus.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }

        String normalizedTarget = targetStatus.trim().toUpperCase(Locale.ROOT);
        if (!"IN_PROGRESS".equals(normalizedTarget) && !"RESOLVED".equals(normalizedTarget)) {
            throw new IllegalArgumentException("Technician can only set status to IN_PROGRESS or RESOLVED");
        }

        MaintenanceTicket ticket = getTicketOrThrow(ticketId);

        String assignedTechId = trimToNull(ticket.getAssignedTechnicianId());
        if (assignedTechId == null || !assignedTechId.equals(technicianId)) {
            throw new IllegalArgumentException("You are not assigned to this ticket");
        }

        String currentStatus = ticket.getStatus() == null ? "OPEN" : ticket.getStatus().toUpperCase(Locale.ROOT);
        if ("REJECTED".equals(currentStatus) || "CLOSED".equals(currentStatus)) {
            throw new IllegalArgumentException("Cannot update status of a closed or rejected ticket");
        }

        boolean validTransition =
                ("OPEN".equals(currentStatus) && "IN_PROGRESS".equals(normalizedTarget))
                        || ("IN_PROGRESS".equals(currentStatus) && "RESOLVED".equals(normalizedTarget))
                        || ("RESOLVED".equals(currentStatus) && "IN_PROGRESS".equals(normalizedTarget));

        if (!validTransition) {
             // Allow technician to pick up an OPEN ticket too if assigned
        }

        if ("RESOLVED".equals(normalizedTarget)) {
            ticket.setResolutionNotes(trimToNull(resolutionNotes));
        }

        ticket.setStatus(normalizedTarget);
        ticket.setUpdatedAt(new Date());
        maintenanceTicketRepository.save(ticket);

        // Notify User when technician resolves the ticket
        if ("RESOLVED".equals(normalizedTarget)) {
            new Thread(() -> {
                try {
                    String msg = String.format("Your %s incident at %s has been resolved. Please check the resolution notes.", 
                        ticket.getCategory(), 
                        ticket.getLocation());
                    notificationService.createNotification(ticket.getUserId(), msg, "TICKET_RESOLVED", ticket.getId());
                } catch (Exception e) {
                    System.err.println("Failed to notify user of resolved ticket: " + e.getMessage());
                }
            }).start();
        }

        return ticket;
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

        // Notify User and Technician
        new Thread(() -> {
            try {
                // Notify User
                String userMsg = String.format("Your %s incident report has been assigned to a technician: %s", 
                    ticket.getCategory(), 
                    technicianEmail != null ? technicianEmail : "Support Team");
                notificationService.createNotification(ticket.getUserId(), userMsg, "TICKET_ASSIGNED", ticket.getId());

                // Notify Technician
                String techMsg = String.format("New task assigned: %s incident at %s. Please review and start work.", 
                    ticket.getCategory(), 
                    ticket.getLocation());
                notificationService.createNotification(technicianId, techMsg, "TASK_ASSIGNED", ticket.getId());
            } catch (Exception e) {
                System.err.println("Failed to send assignment notifications: " + e.getMessage());
            }
        }).start();

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

        // Notify User about the status change
        new Thread(() -> {
            try {
                String msg = String.format("Admin updated your %s incident at %s to: %s.", 
                    ticket.getCategory(), 
                    ticket.getLocation(), 
                    normalizedStatus);
                if ("REJECTED".equals(normalizedStatus) && reason != null) {
                    msg += " Reason: " + reason;
                }
                notificationService.createNotification(ticket.getUserId(), msg, "TICKET_UPDATE", ticket.getId());
            } catch (Exception e) {
                System.err.println("Failed to notify user of admin ticket update: " + e.getMessage());
            }
        }).start();

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

    private void validateTicketOwner(String userId, MaintenanceTicket ticket) {
        String ownerId = trimToNull(ticket.getUserId());
        if (ownerId == null || !ownerId.equals(userId)) {
            throw new IllegalArgumentException("You can only modify your own tickets");
        }
    }

    private MaintenanceTicket getTicketOrThrow(String ticketId) throws ExecutionException, InterruptedException {
        MaintenanceTicket ticket = maintenanceTicketRepository.findById(ticketId);
        if (ticket == null) {
            throw new NoSuchElementException("Ticket not found");
        }
        return ticket;
    }
}