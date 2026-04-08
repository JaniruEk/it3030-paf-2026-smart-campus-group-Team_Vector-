package lk.sliit.it3030.smartcampus.controller;

import lk.sliit.it3030.smartcampus.model.Resource;
import lk.sliit.it3030.smartcampus.repository.ResourceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/v1/resources")
@CrossOrigin(origins = "*") 
public class ResourceController {

    private final ResourceRepository resourceRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ResourceController(ResourceRepository resourceRepository, SimpMessagingTemplate messagingTemplate) {
        this.resourceRepository = resourceRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping
    public ResponseEntity<String> createResource(@RequestBody Resource resource) throws ExecutionException, InterruptedException {
        String updateTime = resourceRepository.save(resource);
        messagingTemplate.convertAndSend("/topic/assets/updates", "ASSET_CREATED");
        return ResponseEntity.ok("Resource saved successfully at: " + updateTime);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResource(@PathVariable String id) throws ExecutionException, InterruptedException {
        Resource resource = resourceRepository.findById(id);
        if (resource != null) {
            return ResponseEntity.ok(resource);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources() throws ExecutionException, InterruptedException {
        return ResponseEntity.ok(resourceRepository.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateResource(@PathVariable String id, @RequestBody Resource resource) throws ExecutionException, InterruptedException {
        resource.setId(id);
        String updateTime = resourceRepository.save(resource);
        messagingTemplate.convertAndSend("/topic/assets/updates", "ASSET_UPDATED");
        return ResponseEntity.ok("Resource updated successfully at: " + updateTime);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteResource(@PathVariable String id) throws ExecutionException, InterruptedException {
        String result = resourceRepository.deleteById(id);
        messagingTemplate.convertAndSend("/topic/assets/updates", "ASSET_DELETED");
        return ResponseEntity.ok(result);
    }
}
