package lk.sliit.it3030.smartcampus.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import lk.sliit.it3030.smartcampus.model.Notification;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

/**
 * Service class for managing application notifications.
 * This service handles both persistent storage in Google Firestore and real-time 
 * delivery via WebSocket (STOMP). It supports individual notifications and role-based broadcasts.
 */
@Service
public class NotificationService {

    private final Firestore firestore; // Firestore client for persistent storage
    private final SimpMessagingTemplate messagingTemplate; // Template for sending real-time messages via WebSockets
    private static final String COLLECTION_NAME = "notifications"; // Canonical name for the notifications collection

    /**
     * Dependency injection through constructor for database and messaging components.
     */
    public NotificationService(Firestore firestore, SimpMessagingTemplate messagingTemplate) {
        this.firestore = firestore;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Creates a single notification, saves it to Firestore, and pushes it to the recipient in real-time.
     */
    @SuppressWarnings("null")
    public Notification createNotification(String recipientId, String message, String type, String resourceId) throws ExecutionException, InterruptedException {
        String id = UUID.randomUUID().toString(); // Generate a unique identifier for the notification
        Notification notification = Notification.builder()
                .id(id)
                .recipientId(recipientId)
                .message(message)
                .type(type)
                .resourceId(resourceId)
                .isRead(false) // Default status is unread
                .createdAt(new Date()) // Current timestamp
                .build();

        // 1. Save to Firestore for long-term persistence
        ApiFuture<WriteResult> collectionsApiFuture = firestore.collection(COLLECTION_NAME).document(id).set(notification);
        collectionsApiFuture.get(); // Ensure the write is complete
        
        // 2. Push notification in real-time to the recipient's personal STOMP topic
        messagingTemplate.convertAndSend("/topic/notifications/" + recipientId, notification);
        
        return notification;
    }

    /**
     * Broadcasts a notification to a specific role/group (e.g., all TECHNICIANS).
     * Uses a single WebSocket message for instant delivery and saves individual copies for persistence in a background thread.
     */
    @SuppressWarnings("null")
    public void broadcastToRole(String message, String targetRole, List<String> recipientIds, String resourceId, String type) {
        // 1. Create a template notification for the broadcast
        Notification broadcastTemplate = Notification.builder()
                .id("bc-" + System.currentTimeMillis())
                .message(message)
                .type(type)
                .resourceId(resourceId)
                .isRead(false)
                .createdAt(new Date())
                .build();
        
        // 2. Perform the real-time broadcast to the role-specific topic
        String topic = "/topic/broadcasts/" + targetRole.toUpperCase();
        messagingTemplate.convertAndSend(topic, broadcastTemplate);

        // 3. Persistent storage in background to avoid blocking the main server thread during bulk operations
        new Thread(() -> {
            try {
                WriteBatch batch = firestore.batch(); // Use Firestore batches for better performance
                int count = 0;
                for (String uid : recipientIds) {
                    String id = UUID.randomUUID().toString();
                    Notification n = Notification.builder()
                            .id(id)
                            .recipientId(uid)
                            .message(message)
                            .type(type)
                            .resourceId(resourceId)
                            .isRead(false)
                            .createdAt(new Date())
                            .build();
                    batch.set(firestore.collection(COLLECTION_NAME).document(id), n);
                    count++;
                    
                    // Firestore batches have a 500 operation limit; commit and restart if reached
                    if (count >= 450) {
                        batch.commit().get();
                        batch = firestore.batch();
                        count = 0;
                    }
                }
                if (count > 0) {
                    batch.commit().get(); // Commit remaining notifications
                }
            } catch (Exception e) {
                System.err.println("Failed to complete background broadcast persistence: " + e.getMessage());
            }
        }).start();
    }

    /**
     * Retrieves all notifications for a specific user from Firestore.
     */
    public List<Notification> getNotificationsForUser(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("recipientId", userId)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Notification> notifications = new ArrayList<>();
        
        for (DocumentSnapshot document : documents) {
            notifications.add(document.toObject(Notification.class)); // Convert Firestore document to Notification POJO
        }
        
        // Sort in memory by date (descending) to avoid requiring complex Firestore composite indexes
        notifications.sort((n1, n2) -> {
            if (n1.getCreatedAt() == null || n2.getCreatedAt() == null) return 0;
            return n2.getCreatedAt().compareTo(n1.getCreatedAt()); 
        });
        
        return notifications;
    }

    /**
     * Marks a specific notification as 'read'.
     */
    @SuppressWarnings("null")
    public void markAsRead(String id, String userId) throws ExecutionException, InterruptedException, IllegalArgumentException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            Notification notification = document.toObject(Notification.class);
            // Ownership check to ensure users don't modify each other's notifications
            if(notification != null && !notification.getRecipientId().equals(userId)) {
                throw new IllegalArgumentException("Unauthorized to modify this notification");
            }
            docRef.update("isRead", true).get(); // Perform update on the 'isRead' field
        }
    }

    /**
     * Permanently deletes a notification from Firestore.
     */
    @SuppressWarnings("null")
    public void deleteNotification(String id, String userId) throws ExecutionException, InterruptedException, IllegalArgumentException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            Notification notification = document.toObject(Notification.class);
            // Ownership check
            if(notification != null && !notification.getRecipientId().equals(userId)) {
                throw new IllegalArgumentException("Unauthorized to delete this notification");
            }
            docRef.delete().get(); // Delete the document
        }
    }

    /**
     * Marks all unread notifications for a specific user as 'read' in a single batch.
     */
    public void markAllAsRead(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("recipientId", userId)
                .whereEqualTo("isRead", false)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        WriteBatch batch = firestore.batch();
        
        for (DocumentSnapshot document : documents) {
            batch.update(document.getReference(), "isRead", true); // Add each update operation to the batch
        }
        
        if (!documents.isEmpty()) {
            batch.commit().get(); // Atomic commit of all updates
        }
    }
}

