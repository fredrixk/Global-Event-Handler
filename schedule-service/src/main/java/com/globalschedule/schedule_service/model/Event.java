package com.globalschedule.schedule_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private LocalDateTime startTime; // Stored in UTC

    @Column(nullable = false)
    private LocalDateTime endTime; // Stored in UTC

    @Column(nullable = false)
    private String originalTimezone;
}
