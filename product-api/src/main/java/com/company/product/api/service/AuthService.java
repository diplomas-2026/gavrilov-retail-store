package com.company.product.api.service;

import com.company.product.api.dto.auth.AuthResponse;
import com.company.product.api.dto.auth.LoginRequest;
import com.company.product.api.dto.user.UserProfileResponse;
import com.company.product.api.entity.UserEntity;
import com.company.product.api.security.JwtService;
import com.company.product.api.security.UserPrincipal;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
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

    private UserProfileResponse toProfile(UserEntity user) {
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }
}
