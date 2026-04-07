package lk.sliit.it3030.smartcampus.repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.stereotype.Repository;

import com.google.api.core.ApiFuture;
import com.google.api.core.ApiFutures;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;

import lk.sliit.it3030.smartcampus.model.Booking;
import lk.sliit.it3030.smartcampus.model.BookingStatus;

@Repository
public class BookingRepository {

    private final Firestore firestore;
    private static final String collection = "bookings";

    public BookingRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public List<Booking> findAll() throws ExecutionException, InterruptedException {
        List<Booking> bookingDetails = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(collection).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        for (QueryDocumentSnapshot doc : documents) {
            bookingDetails.add(doc.toObject(Booking.class));
        }

        return bookingDetails;
    }

    public List<Booking> findByUserId(String userId) throws ExecutionException, InterruptedException {
        List<Booking> userBookings = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection(collection).whereEqualTo("userId", userId).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        for (QueryDocumentSnapshot doc : documents) {
            userBookings.add(doc.toObject(Booking.class));
        }

        return userBookings;
    }

    public String save(Booking bookingInfo) throws ExecutionException, InterruptedException {
        if (bookingInfo.getId() == null || bookingInfo.getId().isEmpty()) {
            bookingInfo.setId(java.util.UUID.randomUUID().toString());
        }

        ApiFuture<WriteResult> futureWrite =
                firestore.collection(collection).document(bookingInfo.getId()).set(bookingInfo);

        return futureWrite.get().getUpdateTime().toString();
    }

    public Booking findByID(String id) throws ExecutionException, InterruptedException {
        var documentReference = firestore.collection(collection).document(id);
        var documentSnapshot = documentReference.get().get();

        if (documentSnapshot.exists()) {
            return documentSnapshot.toObject(Booking.class);
        }

        return null;
    }

    public String updateStatus(String id, BookingStatus status, String adminReason) throws ExecutionException, InterruptedException {
        var documentReference = firestore.collection(collection).document(id);
        
        ApiFuture<WriteResult> future = documentReference.update(
            "status", status,
            "adminReason", adminReason
        );
        
        return future.get().getUpdateTime().toString();
    }
}