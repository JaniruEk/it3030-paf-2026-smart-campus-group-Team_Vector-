package lk.sliit.it3030.smartcampus.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceTicket {
    private String id;
    private String userId;
    private String resourceId;
    private String resourceName;
    private String location;
    private String category;
    private String description;
    private String priority;
    private String status;
    private String preferredContactDetails;
    private String preferredContactMethod;
    @Builder.Default
    private List<ImageAttachment> attachments = new ArrayList<>();
    private Date createdAt;
    private Date updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageAttachment {
        private String fileName;
        private String contentType;
        private String dataUrl;
    }
}