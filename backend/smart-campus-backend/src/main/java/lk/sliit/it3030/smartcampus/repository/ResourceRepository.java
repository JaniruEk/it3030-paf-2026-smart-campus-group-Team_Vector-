package lk.sliit.it3030.smartcampus.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import lk.sliit.it3030.smartcampus.model.Resource;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class ResourceRepository {

    private final Firestore firestore;
    private static final String COLLECTION_NAME = "resources";

    public ResourceRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public String save(Resource resource) throws ExecutionException, InterruptedException {
        // If ID is null, generate a new one
        if (resource.getId() == null || resource.getId().isEmpty()) {
            resource.setId(java.util.UUID.randomUUID().toString());
        }
        ApiFuture<WriteResult> collectionsApiFuture = firestore.collection(COLLECTION_NAME).document(resource.getId()).set(resource);
        return collectionsApiFuture.get().getUpdateTime().toString();
    }

    public Resource findById(String id) throws ExecutionException, InterruptedException {
        var documentReference = firestore.collection(COLLECTION_NAME).document(id);
        var documentSnapshot = documentReference.get().get();
        if (documentSnapshot.exists()) {
            return documentSnapshot.toObject(Resource.class);
        }
        return null;
    }

    public List<Resource> findAll() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Resource> resourceList = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            resourceList.add(document.toObject(Resource.class));
        }
        return resourceList;
    }

    public String deleteById(String id) throws ExecutionException, InterruptedException {
        ApiFuture<WriteResult> writeResult = firestore.collection(COLLECTION_NAME).document(id).delete();
        return "Deleted at " + writeResult.get().getUpdateTime().toString();
    }
}
