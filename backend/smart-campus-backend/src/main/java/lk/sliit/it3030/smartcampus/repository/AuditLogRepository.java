package lk.sliit.it3030.smartcampus.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import lk.sliit.it3030.smartcampus.model.AuditLog;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class AuditLogRepository {

    private final Firestore firestore;
    private static final String COLLECTION_NAME = "audit_logs";

    public AuditLogRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public void save(AuditLog log) throws ExecutionException, InterruptedException {
        if (log.getId() == null || log.getId().isEmpty()) {
            log.setId(java.util.UUID.randomUUID().toString());
        }
        ApiFuture<WriteResult> collectionsApiFuture = firestore.collection(COLLECTION_NAME).document(log.getId()).set(log);
        collectionsApiFuture.get();
    }

    public List<AuditLog> getRecentLogs() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .limit(50)
                .get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<AuditLog> logs = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            logs.add(document.toObject(AuditLog.class));
        }
        return logs;
    }
}
