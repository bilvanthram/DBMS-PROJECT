package com.example.reportmanagement.migration;

import com.example.reportmanagement.model.ReportStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Read-only JPA mapping of the original PostgreSQL {@code reports} table, kept only so the
 * one-time {@link ReportMigrationRunner} can copy existing rows into MongoDB. The live
 * {@code Report} model is now a Mongo {@code @Document}. Safe to delete this whole
 * {@code migration} package once the data has been migrated.
 */
@Entity
@Table(name = "reports")
public class LegacyReport {
    @Id
    private Long id;

    private String name;
    private String reportType;
    private String department;
    private String format;

    @Column(length = 1000)
    private String description;

    @Lob
    private String reportData;

    private Integer dataRowCount;
    private BigDecimal totalValue;
    private BigDecimal averageValue;

    @Lob
    private String departmentInsights;

    private LocalDate dateFrom;
    private LocalDate dateTo;
    private String generatedBy;
    private String generatedByEmail;
    private LocalDateTime generatedOn;

    @Enumerated(EnumType.STRING)
    private ReportStatus status;

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getReportType() {
        return reportType;
    }

    public String getDepartment() {
        return department;
    }

    public String getFormat() {
        return format;
    }

    public String getDescription() {
        return description;
    }

    public String getReportData() {
        return reportData;
    }

    public Integer getDataRowCount() {
        return dataRowCount;
    }

    public BigDecimal getTotalValue() {
        return totalValue;
    }

    public BigDecimal getAverageValue() {
        return averageValue;
    }

    public String getDepartmentInsights() {
        return departmentInsights;
    }

    public LocalDate getDateFrom() {
        return dateFrom;
    }

    public LocalDate getDateTo() {
        return dateTo;
    }

    public String getGeneratedBy() {
        return generatedBy;
    }

    public String getGeneratedByEmail() {
        return generatedByEmail;
    }

    public LocalDateTime getGeneratedOn() {
        return generatedOn;
    }

    public ReportStatus getStatus() {
        return status;
    }
}
