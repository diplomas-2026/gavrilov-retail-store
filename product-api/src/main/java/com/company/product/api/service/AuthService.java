package com.company.product.api.service;

import com.company.product.api.dto.auth.AuthResponse;
import com.company.product.api.dto.auth.LoginRequest;
import com.company.product.api.dto.auth.RegisterRequest;
import com.company.product.api.dto.user.UserProfileResponse;
import com.company.product.api.entity.Role;
import com.company.product.api.entity.UserEntity;
import com.company.product.api.exception.BadRequestException;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.JwtService;
import com.company.product.api.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            String token = jwtService.generateToken(principal);
            return new AuthResponse(token, "Bearer", toProfile(principal.getUser()));
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Неверный email или пароль");
        }
    }

    public UserProfileResponse me(UserEntity user) {
        return toProfile(user);
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BadRequestException("Пользователь с таким email уже существует");
        }

        UserEntity user = new UserEntity();
        user.setEmail(request.email().trim().toLowerCase());
        user.setFullName(request.fullName().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(Role.CUSTOMER);
        user.setActive(true);

        UserEntity saved = userRepository.save(user);
        UserPrincipal principal = new UserPrincipal(saved);
        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, "Bearer", toProfile(saved));
    }

    private UserProfileResponse toProfile(UserEntity user) {
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }
}
