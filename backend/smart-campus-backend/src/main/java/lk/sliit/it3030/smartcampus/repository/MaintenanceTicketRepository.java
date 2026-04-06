package lk.sliit.it3030.smartcampus.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import lk.sliit.it3030.smartcampus.model.MaintenanceTicket;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class MaintenanceTicketRepository {

    private static final String COLLECTION_NAME = "maintenance_tickets";

    private final Firestore firestore;

    public MaintenanceTicketRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public String save(MaintenanceTicket ticket) throws ExecutionException, InterruptedException {
        if (ticket.getId() == null || ticket.getId().isBlank()) {
            ticket.setId(java.util.UUID.randomUUID().toString());
        }

        ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME)
                .document(ticket.getId())
                .set(ticket);

        return future.get().getUpdateTime().toString();
    }

    public List<MaintenanceTicket> findByUserId(String userId) throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .whereEqualTo("userId", userId)
                .get();

        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<MaintenanceTicket> tickets = new ArrayList<>();
        for (DocumentSnapshot document : documents) {
            MaintenanceTicket ticket = document.toObject(MaintenanceTicket.class);
            if (ticket != null) {
                tickets.add(ticket);
            }
        }

        // Sorting in memory avoids composite index requirements in Firestore.
        tickets.sort(Comparator.comparing(MaintenanceTicket::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

        return tickets;
    }

    public MaintenanceTicket findById(String id) throws ExecutionException, InterruptedException {
        DocumentSnapshot document = firestore.collection(COLLECTION_NAME).document(id).get().get();
        if (!document.exists()) {
            return null;
        }
        return document.toObject(MaintenanceTicket.class);
    }

    public List<MaintenanceTicket> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<MaintenanceTicket> tickets = new ArrayList<>();
        for (DocumentSnapshot document : documents) {
            MaintenanceTicket ticket = document.toObject(MaintenanceTicket.class);
            if (ticket != null) {
                tickets.add(ticket);
            }
        }

        tickets.sort(Comparator.comparing(MaintenanceTicket::getCreatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())));

        return tickets;
    }
}