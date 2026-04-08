package lk.sliit.it3030.smartcampus.controller;

import lk.sliit.it3030.smartcampus.model.Resource;
import lk.sliit.it3030.smartcampus.repository.ResourceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/v1/resources")
@CrossOrigin(origins = "*") 
public class ResourceController {

    private final ResourceRepository resourceRepository;

    public ResourceController(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    @PostMapping
    public ResponseEntity<String> createResource(@RequestBody Resource resource) throws ExecutionException, InterruptedException {
        String updateTime = resourceRepository.save(resource);
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
    public ResponseEntity<List<Resource>> getAllResources(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity) throws ExecutionException, InterruptedException {
        List<Resource> resources = resourceRepository.findAll();
        if (search != null && !search.isEmpty()) {
            resources = resources.stream()
                    .filter(r -> r.getName().toLowerCase().contains(search.toLowerCase()))
                    .toList();
        }
        if (type != null && !type.isEmpty()) {
            resources = resources.stream()
                    .filter(r -> type.equals(r.getType()))
                    .toList();
        }
        if (location != null && !location.isEmpty()) {
            resources = resources.stream()
                    .filter(r -> location.equals(r.getLocation()))
                    .toList();
        }
        if (minCapacity != null) {
            resources = resources.stream()
                    .filter(r -> r.getCapacity() >= minCapacity)
                    .toList();
        }
        return ResponseEntity.ok(resources);
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> updateResource(@PathVariable String id, @RequestBody Resource resource) throws ExecutionException, InterruptedException {
        resource.setId(id);
        String updateTime = resourceRepository.save(resource);
        return ResponseEntity.ok("Resource updated successfully at: " + updateTime);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteResource(@PathVariable String id) throws ExecutionException, InterruptedException {
        String result = resourceRepository.deleteById(id);
        return ResponseEntity.ok(result);
    }
}
