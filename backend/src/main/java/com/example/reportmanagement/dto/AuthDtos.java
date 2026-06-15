package com.example.reportmanagement.dto;

import com.example.reportmanagement.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AuthDtos {
    public record LoginRequest(@Email String email, @NotBlank String password) {}

    public record RegisterRequest(
            @NotBlank String fullName,
            @Email String email,
            @NotBlank String password,
            UserRole role) {}

    public record AuthResponse(Long id, String fullName, String email, UserRole role, String token) {}
}
