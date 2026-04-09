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

@Service
public class NotificationService {

    private final Firestore firestore;
    private final SimpMessagingTemplate messagingTemplate;
    private static final String COLLECTION_NAME = "notifications";

    public NotificationService(Firestore firestore, SimpMessagingTemplate messagingTemplate) {
        this.firestore = firestore;
        this.messagingTemplate = messagingTemplate;
    }

    public Notification createNotification(String recipientId, String message, String type, String resourceId) throws ExecutionException, InterruptedException {
        String id = UUID.randomUUID().toString();
        Notification notification = Notification.builder()
                .id(id)
                .recipientId(recipientId)
                .message(message)
                .type(type)
                .resourceId(resourceId)
                .isRead(false)
                .createdAt(new Date())
                .build();

        ApiFuture<WriteResult> collectionsApiFuture = firestore.collection(COLLECTION_NAME).document(id).set(notification);
        collectionsApiFuture.get();
        
        // Push notification in real-time to the recipient's personal STOMP topic
        messagingTemplate.convertAndSend("/topic/notifications/" + recipientId, notification);
        
        return notification;
    }

    /**
     * Broadcasts a notification to a specific role/group.
     * Uses a single WebSocket message for real-time delivery and saves individually for persistence in background.
     */
    public void broadcastToRole(String message, String targetRole, List<String> recipientIds, String resourceId, String type) {
        // 1. Send one real-time message to the group topic
        Notification broadcastTemplate = Notification.builder()
                .id("bc-" + System.currentTimeMillis())
                .message(message)
                .type(type)
                .resourceId(resourceId)
                .isRead(false)
                .createdAt(new Date())
                .build();
        
        String topic = "/topic/broadcasts/" + targetRole.toUpperCase();
        messagingTemplate.convertAndSend(topic, broadcastTemplate);

        // 2. Persistent storage in background to avoid blocking the broadcast request
        new Thread(() -> {
            try {
                WriteBatch batch = firestore.batch();
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
                    
                    // Firestore batches have 500 operation limit
                    if (count >= 450) {
                        batch.commit().get();
                        batch = firestore.batch();
                        count = 0;
                    }
                }
                if (count > 0) {
                    batch.commit().get();
                }
            } catch (Exception e) {
                System.err.println("Failed to complete background broadcast persistence: " + e.getMessage());
            }
        }).start();
    }

    public List<Notification> getNotificationsForUser(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("recipientId", userId)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Notification> notifications = new ArrayList<>();
        
        for (DocumentSnapshot document : documents) {
            notifications.add(document.toObject(Notification.class));
        }
        
        // Sort in memory to avoid Firestore missing composite index runtime exceptions
        notifications.sort((n1, n2) -> {
            if (n1.getCreatedAt() == null || n2.getCreatedAt() == null) return 0;
            return n2.getCreatedAt().compareTo(n1.getCreatedAt()); // Descending
        });
        
        return notifications;
    }

    public void markAsRead(String id, String userId) throws ExecutionException, InterruptedException, IllegalArgumentException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            Notification notification = document.toObject(Notification.class);
            if(notification != null && !notification.getRecipientId().equals(userId)) {
                throw new IllegalArgumentException("Unauthorized to modify this notification");
            }
            docRef.update("isRead", true).get();
        }
    }

    public void deleteNotification(String id, String userId) throws ExecutionException, InterruptedException, IllegalArgumentException {
        DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
        ApiFuture<DocumentSnapshot> future = docRef.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            Notification notification = document.toObject(Notification.class);
            if(notification != null && !notification.getRecipientId().equals(userId)) {
                throw new IllegalArgumentException("Unauthorized to delete this notification");
            }
            docRef.delete().get();
        }
    }
    public void markAllAsRead(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("recipientId", userId)
                .whereEqualTo("isRead", false)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        WriteBatch batch = firestore.batch();
        
        for (DocumentSnapshot document : documents) {
            batch.update(document.getReference(), "isRead", true);
        }
        
        if (!documents.isEmpty()) {
            batch.commit().get();
        }
    }
}
