package com.company.product.api.service;

import com.company.product.api.entity.UserEntity;
import com.company.product.api.exception.NotFoundException;
import com.company.product.api.repository.UserRepository;
import com.company.product.api.security.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserEntity getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new NotFoundException("Пользователь не найден в сессии");
        }

        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new NotFoundException("Пользователь не найден"));
    }
}
