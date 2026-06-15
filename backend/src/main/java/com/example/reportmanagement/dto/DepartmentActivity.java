package com.example.reportmanagement.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DepartmentActivity(
        String department,
        long reportsCreated,
        int dataRows,
        BigDecimal totalValue,
        BigDecimal averageValue,
        String latestReportName,
        String latestReportType,
        String latestInsight,
        String latestGeneratedBy,
        LocalDateTime latestActivityAt) {
}
