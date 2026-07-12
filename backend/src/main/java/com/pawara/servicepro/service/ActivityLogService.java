package com.pawara.servicepro.service;

import com.pawara.servicepro.model.ActivityLog;
import com.pawara.servicepro.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Transactional
    public void logActivity(String activityType, String description) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String performedBy = (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) 
                ? auth.getName() 
                : "system";

        ActivityLog log = ActivityLog.builder()
                .activityType(activityType)
                .description(description)
                .performedBy(performedBy)
                .createdAt(LocalDateTime.now())
                .build();

        activityLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<ActivityLog> getRecentActivities() {
        return activityLogRepository.findTop5ByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<ActivityLog> getAllActivities() {
        return activityLogRepository.findAllByOrderByCreatedAtDesc(); // We will define this if we need all activities later
    }
}
