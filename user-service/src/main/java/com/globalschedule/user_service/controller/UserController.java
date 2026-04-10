package com.globalschedule.user_service.controller;

import com.globalschedule.user_service.model.User;
import com.globalschedule.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userRepository.save(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable UUID id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        return userRepository.findByUsername(username)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/timezone")
    public ResponseEntity<User> updateTimezone(@PathVariable UUID id, @RequestBody String timezone) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setDefaultTimezone(timezone);
                    return ResponseEntity.ok(userRepository.save(user));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
