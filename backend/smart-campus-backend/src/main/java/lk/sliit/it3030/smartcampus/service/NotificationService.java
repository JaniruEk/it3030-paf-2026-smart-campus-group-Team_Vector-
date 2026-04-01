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

    public Notification createNotification(String recipientId, String message, String type) throws ExecutionException, InterruptedException {
        String id = UUID.randomUUID().toString();
        Notification notification = Notification.builder()
                .id(id)
                .recipientId(recipientId)
                .message(message)
                .type(type)
                .isRead(false)
                .createdAt(new Date())
                .build();

        ApiFuture<WriteResult> collectionsApiFuture = firestore.collection(COLLECTION_NAME).document(id).set(notification);
        collectionsApiFuture.get();
        
        // Push notification in real-time to the recipient's personal STOMP queue
        messagingTemplate.convertAndSendToUser(recipientId, "/queue/notifications", notification);
        
        return notification;
    }

    public List<Notification> getNotificationsForUser(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("recipientId", userId)
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Notification> notifications = new ArrayList<>();
        
        for (DocumentSnapshot document : documents) {
            notifications.add(document.toObject(Notification.class));
        }
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
}
