package com.example.reportmanagement.dto;

public record DashboardSummary(
        long totalReports,
        long reportsGenerated,
        long exports,
        long activeUsers) {
}

