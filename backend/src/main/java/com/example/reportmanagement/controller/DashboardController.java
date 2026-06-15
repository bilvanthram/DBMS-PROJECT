package com.example.reportmanagement.controller;

import com.example.reportmanagement.dto.DashboardSummary;
import com.example.reportmanagement.dto.DepartmentActivity;
import com.example.reportmanagement.model.Report;
import com.example.reportmanagement.repository.ReportRepository;
import com.example.reportmanagement.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    public DashboardController(ReportRepository reportRepository, UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/summary")
    public DashboardSummary summary() {
        String currentUserEmail = currentUserEmail();
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        long totalReports;
        long reportsThisMonth;
        if (isCurrentUserAdmin()) {
            totalReports = reportRepository.count();
            reportsThisMonth = reportRepository.countByGeneratedOnAfter(monthStart);
        } else {
            totalReports = reportRepository.countByGeneratedByEmail(currentUserEmail);
            reportsThisMonth = reportRepository.countByGeneratedByEmailAndGeneratedOnAfter(currentUserEmail, monthStart);
        }
        return new DashboardSummary(totalReports, reportsThisMonth, 0, userRepository.countByActiveTrue());
    }

    @GetMapping("/department-activity")
    public List<DepartmentActivity> departmentActivity() {
        Map<String, DepartmentActivityBuilder> departments = new LinkedHashMap<>();
        departments.put("HR", new DepartmentActivityBuilder("HR"));
        departments.put("Sales", new DepartmentActivityBuilder("Sales"));
        departments.put("Operations", new DepartmentActivityBuilder("Operations"));
        departments.put("Finance", new DepartmentActivityBuilder("Finance"));

        List<Report> reports = isCurrentUserAdmin()
                ? reportRepository.findAllByOrderByGeneratedOnDesc()
                : reportRepository.findByGeneratedByEmailOrderByGeneratedOnDesc(currentUserEmail());
        reports.forEach(report -> {
            DepartmentActivityBuilder builder = departments.get(normalizeDepartment(report.getDepartment()));
            if (builder != null) {
                builder.add(report);
            }
        });

        return departments.values().stream()
                .map(DepartmentActivityBuilder::build)
                .toList();
    }

    private String normalizeDepartment(String department) {
        if (!StringUtils.hasText(department)) {
            return "";
        }

        String normalized = department.trim().toLowerCase();
        if (normalized.equals("hr") || normalized.equals("human resources")) {
            return "HR";
        }
        if (normalized.equals("sales")) {
            return "Sales";
        }
        if (normalized.equals("operations")) {
            return "Operations";
        }
        if (normalized.equals("finance")) {
            return "Finance";
        }
        return department.trim();
    }

    private String currentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !StringUtils.hasText(authentication.getName())) {
            return "";
        }
        return authentication.getName();
    }

    private boolean isCurrentUserAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    private static class DepartmentActivityBuilder {
        private final String department;
        private long reportsCreated;
        private int dataRows;
        private BigDecimal totalValue = BigDecimal.ZERO;
        private String latestReportName;
        private String latestReportType;
        private String latestInsight;
        private String latestGeneratedBy;
        private LocalDateTime latestActivityAt;

        DepartmentActivityBuilder(String department) {
            this.department = department;
        }

        void add(Report report) {
            reportsCreated++;
            dataRows += report.getDataRowCount() == null ? 0 : report.getDataRowCount();
            totalValue = totalValue.add(report.getTotalValue() == null ? BigDecimal.ZERO : report.getTotalValue());

            if (report.getGeneratedOn() != null
                    && (latestActivityAt == null || report.getGeneratedOn().isAfter(latestActivityAt))) {
                latestReportName = report.getName();
                latestReportType = report.getReportType();
                latestInsight = report.getDepartmentInsights();
                latestGeneratedBy = report.getGeneratedBy();
                latestActivityAt = report.getGeneratedOn();
            }
        }

        DepartmentActivity build() {
            BigDecimal averageValue = dataRows == 0
                    ? BigDecimal.ZERO
                    : totalValue.divide(BigDecimal.valueOf(dataRows), 2, RoundingMode.HALF_UP);

            return new DepartmentActivity(
                    department,
                    reportsCreated,
                    dataRows,
                    totalValue,
                    averageValue,
                    latestReportName,
                    latestReportType,
                    latestInsight,
                    latestGeneratedBy,
                    latestActivityAt);
        }
    }
}
