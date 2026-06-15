package com.example.reportmanagement.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "reports")
public class Report {
    @Id
    private String id;

    @NotBlank
    private String name;

    @NotBlank
    private String reportType;

    @NotBlank
    private String department;

    @NotBlank
    private String format;

    private String description;

    private String reportData;

    private Integer dataRowCount = 0;

    private BigDecimal totalValue = BigDecimal.ZERO;

    private BigDecimal averageValue = BigDecimal.ZERO;

    private String departmentInsights;

    @NotNull
    private LocalDate dateFrom;

    @NotNull
    private LocalDate dateTo;

    private String generatedBy;

    private String generatedByEmail;

    private LocalDateTime generatedOn = LocalDateTime.now();

    private ReportStatus status = ReportStatus.COMPLETED;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getReportData() {
        return reportData;
    }

    public void setReportData(String reportData) {
        this.reportData = reportData;
    }

    public Integer getDataRowCount() {
        return dataRowCount;
    }

    public void setDataRowCount(Integer dataRowCount) {
        this.dataRowCount = dataRowCount;
    }

    public BigDecimal getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(BigDecimal totalValue) {
        this.totalValue = totalValue;
    }

    public BigDecimal getAverageValue() {
        return averageValue;
    }

    public void setAverageValue(BigDecimal averageValue) {
        this.averageValue = averageValue;
    }

    public String getDepartmentInsights() {
        return departmentInsights;
    }

    public void setDepartmentInsights(String departmentInsights) {
        this.departmentInsights = departmentInsights;
    }

    public LocalDate getDateFrom() {
        return dateFrom;
    }

    public void setDateFrom(LocalDate dateFrom) {
        this.dateFrom = dateFrom;
    }

    public LocalDate getDateTo() {
        return dateTo;
    }

    public void setDateTo(LocalDate dateTo) {
        this.dateTo = dateTo;
    }

    public String getGeneratedBy() {
        return generatedBy;
    }

    public void setGeneratedBy(String generatedBy) {
        this.generatedBy = generatedBy;
    }

    public String getGeneratedByEmail() {
        return generatedByEmail;
    }

    public void setGeneratedByEmail(String generatedByEmail) {
        this.generatedByEmail = generatedByEmail;
    }

    public LocalDateTime getGeneratedOn() {
        return generatedOn;
    }

    public void setGeneratedOn(LocalDateTime generatedOn) {
        this.generatedOn = generatedOn;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public void setStatus(ReportStatus status) {
        this.status = status;
    }
}
