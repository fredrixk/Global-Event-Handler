package com.globalschedule.sharing_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "schedule_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID requesterId;

    @Column(nullable = false)
    private UUID targetUserId;

    @Column(nullable = false)
    private LocalDate requestedDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RequestStatus status;

    public enum RequestStatus {
        PENDING, ACCEPTED, DECLINED
    }
}
