package lk.sliit.it3030.smartcampus.controller;

import com.google.firebase.auth.ExportedUserRecord;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.ListUsersPage;
import lk.sliit.it3030.smartcampus.dto.UserRoleUpdateRequest;
import lk.sliit.it3030.smartcampus.service.NotificationService;
import lk.sliit.it3030.smartcampus.model.AuditLog;
import lk.sliit.it3030.smartcampus.repository.AuditLogRepository;
import com.google.firebase.auth.UserRecord;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final NotificationService notificationService;
    private final AuditLogRepository auditLogRepository;

    public UserController(NotificationService notificationService, AuditLogRepository auditLogRepository) {
        this.notificationService = notificationService;
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        try {
            ListUsersPage page = FirebaseAuth.getInstance().listUsers(null);
            List<Map<String, Object>> response = new ArrayList<>();

            for (ExportedUserRecord user : page.iterateAll()) {
                Map<String, Object> userData = new HashMap<>();
                userData.put("uid", user.getUid());
                userData.put("email", user.getEmail());
                userData.put("displayName", user.getDisplayName());
                userData.put("disabled", user.isDisabled());
                
                Map<String, Object> customClaims = user.getCustomClaims();
                String role = "USER";
                if (customClaims != null && customClaims.containsKey("role")) {
                    role = (String) customClaims.get("role");
                }
                userData.put("role", role);
                
                response.add(userData);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (FirebaseAuthException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateUserRole(@PathVariable String userId, @Valid @RequestBody UserRoleUpdateRequest request, Authentication auth) {
        try {
            Map<String, Object> claims = new HashMap<>();
            String newRole = request.getRole().toUpperCase();
            claims.put("role", newRole);
            FirebaseAuth.getInstance().setCustomUserClaims(userId, claims);

            try {
                String msg = "A system administrator has updated your account role to " + newRole + ". Welcome!";
                notificationService.createNotification(userId, msg, "ROLE_UPDATE", null);
                
                String performedBy = auth.getName();
                try {
                    String email = FirebaseAuth.getInstance().getUser(performedBy).getEmail();
                    if (email != null) performedBy = email;
                } catch (Exception ignored) {}
                
                auditLogRepository.save(AuditLog.builder()
                        .action("ROLE_CHANGED_TO_" + newRole)
                        .performedBy(performedBy)
                        .targetUser(userId)
                        .timestamp(new java.util.Date())
                        .build());
            } catch (Exception e) {
                System.err.println("Failed to perform secondary tasks: " + e.getMessage());
            }

            Map<String, String> response = new HashMap<>();
            response.put("message", "Successfully updated role for user " + userId + " to " + newRole);
            return ResponseEntity.ok(response);

        } catch (FirebaseAuthException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> updateUserStatus(@PathVariable String userId, @RequestBody Map<String, Boolean> request, Authentication auth) {
        try {
            boolean disabled = request.getOrDefault("disabled", false);
            UserRecord.UpdateRequest updateRequest = new UserRecord.UpdateRequest(userId)
                    .setDisabled(disabled);
            FirebaseAuth.getInstance().updateUser(updateRequest);

            try {
                String performedBy = auth.getName();
                try {
                    String email = FirebaseAuth.getInstance().getUser(performedBy).getEmail();
                    if (email != null) performedBy = email;
                } catch (Exception ignored) {}
                
                auditLogRepository.save(AuditLog.builder()
                        .action(disabled ? "ACCOUNT_SUSPENDED" : "ACCOUNT_ACTIVATED")
                        .performedBy(performedBy)
                        .targetUser(userId)
                        .timestamp(new java.util.Date())
                        .build());
            } catch (Exception e) {
                 System.err.println("Failed to save audit log: " + e.getMessage());
            }

            Map<String, String> response = new HashMap<>();
            response.put("message", "Successfully " + (disabled ? "suspended" : "activated") + " user account.");
            return ResponseEntity.ok(response);

        } catch (FirebaseAuthException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
