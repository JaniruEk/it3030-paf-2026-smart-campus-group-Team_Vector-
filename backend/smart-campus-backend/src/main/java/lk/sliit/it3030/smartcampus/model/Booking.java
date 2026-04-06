package lk.sliit.it3030.smartcampus.model;
import com.fasterxml.jackson.annotation.JsonFormat;
import lk.sliit.it3030.smartcampus.model.BookingStatus;
import java.time.LocalDate;
import java.time.LocalTime;

public class Booking {

    private String id;
    private String userId;
    private String bookingResource;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    @JsonFormat(pattern ="HH:mm")
    private LocalTime startTime;
    @JsonFormat(pattern ="HH:mm")
    private LocalTime endTime;

    private String purpose;
    private Integer noOfAttendees;

    private BookingStatus status; 
    private String adminReason; // reason for reject

    // Constructors
    public Booking() {}

    public Booking(String id, String userId, String bookingResource, LocalDate date,
                   LocalTime startTime, LocalTime endTime,
                   String purpose, Integer noOfAttendees,
                   BookingStatus status, String adminReason) {
        this.id = id;
        this.userId = userId;
        this.bookingResource = bookingResource;
        this.date = date;
        this.startTime = startTime;
        this.endTime = endTime;
        this.purpose = purpose;
        this.noOfAttendees = noOfAttendees;
        this.status = status;
        this.adminReason = adminReason;
    }

    // Getters
    public String getId() {
        return id;
    }

    public String getUserId() {
        return userId;
    }

    public String getBookingResource() {
        return bookingResource;
    }

    public LocalDate getDate() {
        return date;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public String getPurpose() {
        return purpose;
    }

    public Integer getNoOfAttendees() {
        return noOfAttendees;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public String getAdminReason() {
        return adminReason;
    }

    // Setters
    public void setId(String id) {
        this.id = id;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setBookingResource(String bookingResource) {
        this.bookingResource = bookingResource;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public void setNoOfAttendees(Integer noOfAttendees) {
        this.noOfAttendees = noOfAttendees;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public void setAdminReason(String adminReason) {
        this.adminReason = adminReason;
    }

    

    
    
    
}