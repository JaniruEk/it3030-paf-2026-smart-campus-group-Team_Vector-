package lk.sliit.it3030.smartcampus.controller;

import java.util.List;
import java.util.concurrent.ExecutionException;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lk.sliit.it3030.smartcampus.model.Booking;
import lk.sliit.it3030.smartcampus.model.BookingStatus;
import lk.sliit.it3030.smartcampus.repository.BookingRepository;
import java.time.LocalDate;
import java.time.LocalTime;

@RestController
@RequestMapping("/booking")
@CrossOrigin(origins="http://localhost:5173")
public class BookingController {

    @Autowired
    private BookingRepository bookingRepository;

    @PostMapping
    public String createBooking(@RequestBody Booking booking) {
        try {
            LocalTime newStart = LocalTime.parse(booking.getStartTime());
            LocalTime newEnd = LocalTime.parse(booking.getEndTime());
            LocalDate newDate = LocalDate.parse(booking.getDate());

            if (newStart.isAfter(newEnd) || newStart.equals(newEnd)) {
                return "End time must be after start time";
            }

            List<Booking> existingBookings = bookingRepository.findAll();

            if (existingBookings != null && !existingBookings.isEmpty()) {
                for (Booking b : existingBookings) {
                    LocalTime oldStart = LocalTime.parse(b.getStartTime());
                    LocalTime oldEnd = LocalTime.parse(b.getEndTime());
                    LocalDate oldDate = LocalDate.parse(b.getDate());

                    if (b.getBookingResource().equals(booking.getBookingResource())
                            && oldDate.equals(newDate)) {

                        if (newStart.isBefore(oldEnd) && newEnd.isAfter(oldStart)) {
                            if (b.getStatus() == BookingStatus.APPROVED
                                    || b.getStatus() == BookingStatus.PENDING) {
                                return "Resource already booked for this time";
                            }
                        }
                    }
                }
            }

            booking.setStatus(BookingStatus.PENDING);
            bookingRepository.save(booking);

            return "Booking request submitted successfully";
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return "Error while creating booking";
        }
    }

    @GetMapping("/test")
    public String test() {
        return "Booking backend working";
    }


    @GetMapping("/{id}")
    public Booking getBookingDetails(@PathVariable String id) {
        try {
            return bookingRepository.findByID(id);
        } catch (ExecutionException | InterruptedException e) {
            e.printStackTrace();
            return null;
        }
    }
}