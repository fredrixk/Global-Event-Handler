package com.globalschedule.sharing_service.controller;

import com.globalschedule.sharing_service.model.ScheduleRequest;
import com.globalschedule.sharing_service.repository.ScheduleRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sharing")
@RequiredArgsConstructor
public class SharingController {
    private final ScheduleRequestRepository requestRepository;
    private final WebClient.Builder webClientBuilder;

    @Value("${SCHEDULE_SERVICE_URL:http://localhost:8082}")
    private String scheduleServiceUrl;

    @PostMapping("/request")
    public ResponseEntity<ScheduleRequest> createRequest(@RequestBody ScheduleRequest request) {
        request.setStatus(ScheduleRequest.RequestStatus.PENDING);
        return ResponseEntity.ok(requestRepository.save(request));
    }

    @GetMapping("/requests/received/{userId}")
    public ResponseEntity<List<ScheduleRequest>> getReceivedRequests(@PathVariable UUID userId) {
        return ResponseEntity.ok(requestRepository.findByTargetUserIdAndStatus(userId, ScheduleRequest.RequestStatus.PENDING));
    }

    @GetMapping("/requests/sent/{userId}")
    public ResponseEntity<List<ScheduleRequest>> getSentRequests(@PathVariable UUID userId) {
        return ResponseEntity.ok(requestRepository.findByRequesterId(userId));
    }

    @GetMapping("/shared/{userId}")
    public ResponseEntity<List<ScheduleRequest>> getAcceptedRequests(@PathVariable UUID userId) {
        return ResponseEntity.ok(requestRepository.findByRequesterIdAndStatus(userId, ScheduleRequest.RequestStatus.ACCEPTED));
    }

    @PatchMapping("/request/{requestId}/accept")
    public Mono<ResponseEntity<ScheduleRequest>> acceptRequest(@PathVariable UUID requestId) {
        return Mono.justOrEmpty(requestRepository.findById(requestId))
                .flatMap(request -> {
                    // Validate with Schedule Service if the target user has a schedule for the requested date
                    String validationUrl = scheduleServiceUrl + "/api/schedules/user/" +
                                           request.getTargetUserId() + "/date/" +
                                           request.getRequestedDate() + "/exists";

                    return webClientBuilder.build()
                            .get()
                            .uri(validationUrl)
                            .retrieve()
                            .bodyToMono(Boolean.class)
                            .map(hasSchedule -> {
                                if (Boolean.TRUE.equals(hasSchedule)) {
                                    request.setStatus(ScheduleRequest.RequestStatus.ACCEPTED);
                                    return ResponseEntity.ok(requestRepository.save(request));
                                } else {
                                    return ResponseEntity.badRequest().<ScheduleRequest>build();
                                }
                            });
                })
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PatchMapping("/request/{requestId}/decline")
    public ResponseEntity<ScheduleRequest> declineRequest(@PathVariable UUID requestId) {
        return requestRepository.findById(requestId)
                .map(request -> {
                    request.setStatus(ScheduleRequest.RequestStatus.DECLINED);
                    return ResponseEntity.ok(requestRepository.save(request));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
