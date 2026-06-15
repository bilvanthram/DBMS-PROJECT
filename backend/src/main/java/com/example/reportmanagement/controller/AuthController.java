package com.example.reportmanagement.controller;

import com.example.reportmanagement.dto.AuthDtos.AuthResponse;
import com.example.reportmanagement.dto.AuthDtos.LoginRequest;
import com.example.reportmanagement.dto.AuthDtos.RegisterRequest;
import com.example.reportmanagement.model.AppUser;
import com.example.reportmanagement.model.UserRole;
import com.example.reportmanagement.repository.UserRepository;
import com.example.reportmanagement.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        AppUser user = userRepository.findByEmail(request.email())
                .filter(candidate -> isPasswordValid(request.password(), candidate))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!user.getPassword().startsWith("$2a$") && !user.getPassword().startsWith("$2b$")) {
            user.setPassword(passwordEncoder.encode(request.password()));
            userRepository.save(user);
        }

        return toResponse(user);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }
        AppUser user = new AppUser();
        user.setFullName(request.fullName());
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(request.role() == null ? UserRole.VIEWER : request.role());
        return toResponse(userRepository.save(user));
    }

    private boolean isPasswordValid(String rawPassword, AppUser user) {
        String storedPassword = user.getPassword();
        if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$")) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }
        return storedPassword.equals(rawPassword);
    }

    private AuthResponse toResponse(AppUser user) {
        return new AuthResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                jwtService.generateToken(user));
    }
}
