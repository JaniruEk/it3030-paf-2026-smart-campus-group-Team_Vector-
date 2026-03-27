package lk.sliit.it3030.smartcampus.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.google.firebase.cloud.StorageClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @Bean
    public FirebaseApp firebaseApp() throws IOException {
        ClassPathResource serviceAccount = new ClassPathResource("firebase-service-account.json");
        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount.getInputStream()))
                .build();

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseApp app = FirebaseApp.initializeApp(options);
            System.out.println("✅ Firebase initialized successfully!");
            return app;
        }
        return FirebaseApp.getInstance();
    }

    @Bean
    @DependsOn("firebaseApp")
    public com.google.cloud.firestore.Firestore firestore() {
        return FirestoreClient.getFirestore();
    }

    @Bean
    @DependsOn("firebaseApp")
    public com.google.firebase.cloud.StorageClient storageClient() {
        return StorageClient.getInstance();
    }
}