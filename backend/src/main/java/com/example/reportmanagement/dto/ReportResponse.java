package com.example.reportmanagement.dto;

import com.example.reportmanagement.model.Report;
import com.example.reportmanagement.model.ReportStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ReportResponse(
        String id,
        String name,
        String reportType,
        String department,
        String format,
        String description,
        String reportData,
        Integer dataRowCount,
        BigDecimal totalValue,
        BigDecimal averageValue,
        String departmentInsights,
        LocalDate dateFrom,
        LocalDate dateTo,
        String generatedBy,
        String generatedByEmail,
        LocalDateTime generatedOn,
        ReportStatus status) {

    public static ReportResponse from(Report report) {
        return new ReportResponse(
                report.getId(),
                report.getName(),
                report.getReportType(),
                report.getDepartment(),
                report.getFormat(),
                report.getDescription(),
                report.getReportData(),
                report.getDataRowCount(),
                report.getTotalValue(),
                report.getAverageValue(),
                report.getDepartmentInsights(),
                report.getDateFrom(),
                report.getDateTo(),
                report.getGeneratedBy(),
                report.getGeneratedByEmail(),
                report.getGeneratedOn(),
                report.getStatus());
    }
}
