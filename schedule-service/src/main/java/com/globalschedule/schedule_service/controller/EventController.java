package com.globalschedule.schedule_service.controller;

import com.globalschedule.schedule_service.model.Event;
import com.globalschedule.schedule_service.repository.EventRepository;
import java.time.*;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class EventController {

    private final EventRepository eventRepository;

    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        return ResponseEntity.ok(eventRepository.save(event));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Event>> getEventsByUser(
        @PathVariable UUID userId
    ) {
        return ResponseEntity.ok(eventRepository.findByUserId(userId));
    }

    @GetMapping("/user/{userId}/date/{date}")
    public ResponseEntity<List<Event>> getEventsByDate(
        @PathVariable UUID userId,
        @PathVariable @DateTimeFormat(
            iso = DateTimeFormat.ISO.DATE
        ) LocalDate date
    ) {
        // Convert local date to UTC range for the database query
        Instant startOfDay = date.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endOfDay = date
            .atTime(LocalTime.MAX)
            .atZone(ZoneOffset.UTC)
            .toInstant();

        return ResponseEntity.ok(
            eventRepository.findByUserIdAndDate(userId, startOfDay, endOfDay)
        );
    }

    @GetMapping("/user/{userId}/date/{date}/exists")
    public ResponseEntity<Boolean> hasEventsOnDate(
        @PathVariable UUID userId,
        @PathVariable @DateTimeFormat(
            iso = DateTimeFormat.ISO.DATE
        ) LocalDate date
    ) {
        Instant startOfDay = date.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endOfDay = date
            .atTime(LocalTime.MAX)
            .atZone(ZoneOffset.UTC)
            .toInstant();

        List<Event> events = eventRepository.findByUserIdAndDate(
            userId,
            startOfDay,
            endOfDay
        );
        return ResponseEntity.ok(!events.isEmpty());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID id) {
        eventRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
