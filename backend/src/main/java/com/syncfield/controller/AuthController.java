package com.syncfield.controller;

import com.syncfield.dto.ApiResponse;
import com.syncfield.dto.AuthDto;
import com.syncfield.entity.User;
import com.syncfield.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> login(@RequestBody AuthDto.LoginRequest request) {
        try {
            AuthDto.AuthResponse response = authService.login(request);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.failure("Invalid email or password"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthDto.AuthResponse>> getCurrentUser() {
        User user = authService.getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.failure("Unauthorized"));
        }
        AuthDto.AuthResponse response = AuthDto.AuthResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .organizationName(user.getOrganization() != null ? user.getOrganization().getName() : "SyncField Corp")
                .build();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
