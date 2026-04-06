package lk.sliit.it3030.smartcampus.controller;

import jakarta.validation.Valid;
import lk.sliit.it3030.smartcampus.dto.CreateMaintenanceTicketRequest;
import lk.sliit.it3030.smartcampus.model.MaintenanceTicket;
import lk.sliit.it3030.smartcampus.service.MaintenanceTicketService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tickets")
@CrossOrigin(origins = "*")
public class MaintenanceTicketController {

    private final MaintenanceTicketService maintenanceTicketService;

    public MaintenanceTicketController(MaintenanceTicketService maintenanceTicketService) {
        this.maintenanceTicketService = maintenanceTicketService;
    }

    @PostMapping
    public ResponseEntity<?> createTicket(@Valid @RequestBody CreateMaintenanceTicketRequest request,
                                          Authentication authentication) {
        try {
            String userId = authentication.getName();
            MaintenanceTicket createdTicket = maintenanceTicketService.createTicket(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdTicket);
        } catch (IllegalArgumentException e) {
            Map<String, String> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<MaintenanceTicket>> getMyTickets(Authentication authentication) {
        try {
            String userId = authentication.getName();
            return ResponseEntity.ok(maintenanceTicketService.getMyTickets(userId));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}