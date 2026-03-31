package lk.sliit.it3030.smartcampus.controller;

import com.google.firebase.auth.ExportedUserRecord;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.ListUsersPage;
import lk.sliit.it3030.smartcampus.dto.UserRoleUpdateRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    public ResponseEntity<Map<String, String>> updateUserRole(@PathVariable String userId, @Valid @RequestBody UserRoleUpdateRequest request) {
        try {
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", request.getRole().toUpperCase());
            FirebaseAuth.getInstance().setCustomUserClaims(userId, claims);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Successfully updated role for user " + userId + " to " + request.getRole().toUpperCase());
            
            return ResponseEntity.ok(response);

        } catch (FirebaseAuthException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
