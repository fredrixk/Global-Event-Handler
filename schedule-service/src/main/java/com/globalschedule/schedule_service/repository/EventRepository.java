package com.globalschedule.schedule_service.repository;

import com.globalschedule.schedule_service.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findByUserId(UUID userId);

    @Query("SELECT e FROM Event e WHERE e.userId = :userId AND " +
           "(e.startTime < :endOfDay AND e.endTime > :startOfDay)")
    List<Event> findByUserIdAndDate(@Param("userId") UUID userId,
                                    @Param("startOfDay") LocalDateTime startOfDay,
                                    @Param("endOfDay") LocalDateTime endOfDay);
}
