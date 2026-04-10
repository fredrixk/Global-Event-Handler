package com.globalschedule.sharing_service.repository;

import com.globalschedule.sharing_service.model.ScheduleRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ScheduleRequestRepository extends JpaRepository<ScheduleRequest, UUID> {
    List<ScheduleRequest> findByTargetUserIdAndStatus(UUID targetUserId, ScheduleRequest.RequestStatus status);
    List<ScheduleRequest> findByRequesterId(UUID requesterId);
    List<ScheduleRequest> findByRequesterIdAndStatus(UUID requesterId, ScheduleRequest.RequestStatus status);
}
