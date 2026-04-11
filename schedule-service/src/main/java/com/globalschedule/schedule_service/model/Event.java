package com.globalschedule.schedule_service.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private Instant startTime; // Changed to Instant for automatic UTC serialization

    @Column(nullable = false)
    private Instant endTime;

    @Column(nullable = false)
    private String originalTimezone;
}
