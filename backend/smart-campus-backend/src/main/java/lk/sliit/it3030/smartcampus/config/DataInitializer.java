package lk.sliit.it3030.smartcampus.config;

import lk.sliit.it3030.smartcampus.model.Resource;
import lk.sliit.it3030.smartcampus.repository.ResourceRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initResources(ResourceRepository resourceRepository) {
        return args -> {
            List<Resource> defaultResources = Arrays.asList(
                new Resource(null, "A101 - Lecture Hall", "Lecture Hall", "Available"),
                new Resource(null, "A102 - Lecture Hall", "Lecture Hall", "Available"),
                new Resource(null, "B201 - Computer Lab", "Laboratory", "Available"),
                new Resource(null, "B202 - Physics Lab", "Laboratory", "Available"),
                new Resource(null, "Meeting Room - Block C", "Seminar Room", "Available"),
                new Resource(null, "Auditorium - Main", "Seminar Room", "Available")
            );

            for (Resource res : defaultResources) {
                // Only seed if they don't exist by name
                if (resourceRepository.findByName(res.getName()) == null) {
                    resourceRepository.save(res);
                    System.out.println("Seeded resource: " + res.getName());
                }
            }
        };
    }
}
