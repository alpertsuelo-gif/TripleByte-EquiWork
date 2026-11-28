package com.equiowork.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.equiowork.backend.dto.LoginRequest;
import com.equiowork.backend.dto.LoginResponse;
import com.equiowork.backend.dto.RegisterRequest;
import com.equiowork.backend.model.User;
import com.equiowork.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email already registered.");
        }

        User.Role role;
        try {
            role = User.Role.valueOf(request.getRole().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Role must be EMPLOYEE or EMPLOYER.");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        userRepository.save(user);

        return ResponseEntity.ok("Registered successfully.");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        var userOpt = userRepository.findByEmail(request.getEmail());

        if (userOpt.isPresent() && passwordEncoder.matches(request.getPassword(), userOpt.get().getPasswordHash())) {
            User user = userOpt.get();
            return ResponseEntity.ok(new LoginResponse("Login successful.", user.getEmail(), user.getRole().name()));
        }

        return ResponseEntity.status(401).body("Invalid email or password.");
    }
}