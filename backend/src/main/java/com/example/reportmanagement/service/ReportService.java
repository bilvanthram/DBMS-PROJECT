package com.example.reportmanagement.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.reportmanagement.dto.ReportResponse;
import com.example.reportmanagement.model.Report;
import com.example.reportmanagement.model.ReportStatus;
import com.example.reportmanagement.repository.ReportRepository;
import com.example.reportmanagement.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Service
public class ReportService {
    private static final TypeReference<List<Map<String, String>>> REPORT_DATA_TYPE = new TypeReference<>() {
    };

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public ReportService(ReportRepository reportRepository, UserRepository userRepository, ObjectMapper objectMapper) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> findAll() {
        List<Report> reports = isCurrentUserAdmin()
                ? reportRepository.findAllByOrderByGeneratedOnDesc()
                : reportRepository.findByGeneratedByEmailOrderByGeneratedOnDesc(currentUserEmail());
        return reports.stream()
                .map(ReportResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> findRecent() {
        List<Report> reports = isCurrentUserAdmin()
                ? reportRepository.findTop5ByOrderByGeneratedOnDesc()
                : reportRepository.findTop5ByGeneratedByEmailOrderByGeneratedOnDesc(currentUserEmail());
        return reports.stream()
                .map(ReportResponse::from)
                .toList();
    }

    @Transactional
    public Report createReport(Report report) {
        List<Map<String, String>> rows = validateReport(report);
        applyCreateDefaults(report);
        applyCalculatedValues(report, rows);
        return reportRepository.save(report);
    }

    @Transactional
    public void deleteReport(String id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report was not found"));

        if (!isCurrentUserAdmin() && !currentUserEmail().equals(report.getGeneratedByEmail())) {
            throw new IllegalArgumentException("You can only delete your own reports");
        }

        reportRepository.delete(report);
    }

    @Transactional
    public Report createReportFromCsv(
            String name,
            String reportType,
            String department,
            String format,
            String description,
            LocalDate dateFrom,
            LocalDate dateTo,
            MultipartFile file) {
        List<Map<String, String>> rows = parseCsv(file);
        Report report = new Report();
        report.setName(name);
        report.setReportType(reportType);
        report.setDepartment(department);
        report.setFormat(format);
        report.setDescription(description);
        report.setDateFrom(dateFrom);
        report.setDateTo(dateTo);

        try {
            report.setReportData(objectMapper.writeValueAsString(rows));
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Could not prepare uploaded report data");
        }

        return createReport(report);
    }

    private List<Map<String, String>> validateReport(Report report) {
        if (report.getDateFrom() == null || report.getDateTo() == null) {
            throw new IllegalArgumentException("Date range is required");
        }

        if (report.getDateFrom().isAfter(report.getDateTo())) {
            throw new IllegalArgumentException("Date From cannot be after Date To");
        }

        if (!StringUtils.hasText(report.getDescription())) {
            throw new IllegalArgumentException("Report description is required");
        }

        if (!StringUtils.hasText(report.getReportData())) {
            throw new IllegalArgumentException("Report data is required");
        }

        return validateReportData(report.getReportData());
    }

    private List<Map<String, String>> validateReportData(String reportData) {
        try {
            List<Map<String, String>> rows = objectMapper.readValue(reportData, REPORT_DATA_TYPE);
            if (rows.isEmpty()) {
                throw new IllegalArgumentException("Report data must include at least one item");
            }

            boolean hasFilledRow = rows.stream().anyMatch(row ->
                    StringUtils.hasText(row.get("item"))
                            || StringUtils.hasText(row.get("value"))
            );
            if (!hasFilledRow) {
                throw new IllegalArgumentException("Report data must include at least one filled item");
            }
            return rows;
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Report data must be valid JSON");
        }
    }

    private void applyCreateDefaults(Report report) {
        report.setId(null);
        report.setName(report.getName().trim());
        report.setReportType(report.getReportType().trim());
        report.setDepartment(report.getDepartment().trim());
        report.setFormat(report.getFormat().trim().toUpperCase());
        report.setGeneratedBy(currentUserFullName());
        report.setGeneratedByEmail(currentUserEmail());
        report.setGeneratedOn(LocalDateTime.now());

        if (report.getStatus() == null) {
            report.setStatus(ReportStatus.COMPLETED);
        }

        if (StringUtils.hasText(report.getDescription())) {
            report.setDescription(report.getDescription().trim());
        }

        if (StringUtils.hasText(report.getReportData())) {
            report.setReportData(report.getReportData().trim());
        }
    }

    private void applyCalculatedValues(Report report, List<Map<String, String>> rows) {
        List<Map<String, String>> filledRows = rows.stream()
                .filter(row -> StringUtils.hasText(row.get("item"))
                        || StringUtils.hasText(row.get("value")))
                .toList();

        BigDecimal total = filledRows.stream()
                .map(row -> parseNumber(row.get("value")))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        report.setDataRowCount(filledRows.size());
        report.setTotalValue(total);
        report.setAverageValue(filledRows.isEmpty()
                ? BigDecimal.ZERO
                : total.divide(BigDecimal.valueOf(filledRows.size()), 2, RoundingMode.HALF_UP));
        report.setDepartmentInsights(buildDepartmentInsights(report, filledRows, total));
    }

    private String buildDepartmentInsights(Report report, List<Map<String, String>> rows, BigDecimal total) {
        String department = normalizeDepartment(report.getDepartment());
        List<Map<String, String>> insights = switch (department) {
            case "Finance" -> calculateFinance(rows);
            case "Sales" -> calculateSales(rows);
            case "HR" -> calculateHr(rows);
            case "Operations" -> calculateOperations(rows);
            default -> calculateGeneral(rows, total);
        };

        try {
            return objectMapper.writeValueAsString(insights);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Could not calculate department insights");
        }
    }

    private List<Map<String, String>> calculateFinance(List<Map<String, String>> rows) {
        BigDecimal revenue = BigDecimal.ZERO;
        BigDecimal expenses = BigDecimal.ZERO;

        for (Map<String, String> row : rows) {
            BigDecimal value = parseNumber(row.get("value"));
            String text = rowText(row);

            if (matches(text, "expense", "cost", "loss", "debit", "tax", "salary", "rent", "purchase", "bill")) {
                expenses = expenses.add(value.abs());
            } else if (value.signum() < 0) {
                expenses = expenses.add(value.abs());
            } else {
                revenue = revenue.add(value);
            }
        }

        BigDecimal net = revenue.subtract(expenses);
        BigDecimal profit = net.signum() > 0 ? net : BigDecimal.ZERO;
        BigDecimal loss = net.signum() < 0 ? net.abs() : BigDecimal.ZERO;
        BigDecimal averageTransaction = average(revenue.add(expenses), rows.size());
        BigDecimal profitMargin = revenue.signum() == 0
                ? BigDecimal.ZERO
                : net.multiply(BigDecimal.valueOf(100)).divide(revenue, 2, RoundingMode.HALF_UP);

        return List.of(
                insight("Revenue", formatDecimal(revenue)),
                insight("Expenses", formatDecimal(expenses)),
                insight("Profit", formatDecimal(profit)),
                insight("Loss", formatDecimal(loss)),
                insight("Net Profit/Loss", formatDecimal(net)),
                insight("Average Transaction", formatDecimal(averageTransaction)),
                insight("Profit Margin %", formatDecimal(profitMargin))
        );
    }

    private List<Map<String, String>> calculateSales(List<Map<String, String>> rows) {
        BigDecimal target = sumMatching(rows, "target", "goal", "quota");
        BigDecimal revenue = rows.stream()
                .filter(row -> !matches(rowText(row), "target", "goal", "quota"))
                .map(row -> parseNumber(row.get("value")))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal averageSale = average(revenue, rows.size());
        BigDecimal achievement = target.signum() == 0
                ? BigDecimal.ZERO
                : revenue.multiply(BigDecimal.valueOf(100)).divide(target, 2, RoundingMode.HALF_UP);
        Map<String, String> topSale = maxRow(rows);

        return List.of(
                insight("Sales Revenue", formatDecimal(revenue)),
                insight("Sales Target", formatDecimal(target)),
                insight("Target Achievement %", formatDecimal(achievement)),
                insight("Average Sale", formatDecimal(averageSale)),
                insight("Highest Sale", formatDecimal(parseNumber(topSale.get("value")))),
                insight("Top Sales Item", StringUtils.hasText(topSale.get("item")) ? topSale.get("item") : "No item")
        );
    }

    private List<Map<String, String>> calculateHr(List<Map<String, String>> rows) {
        BigDecimal hired = sumMatching(rows, "hired", "joined", "recruited", "onboarded");
        BigDecimal resigned = sumMatching(rows, "resigned", "terminated", "exit", "left", "attrition");
        BigDecimal payroll = sumMatching(rows, "payroll", "salary", "wage", "compensation");
        BigDecimal attendance = sumMatching(rows, "attendance", "present", "working days");
        BigDecimal netHeadcount = hired.subtract(resigned);
        BigDecimal attritionRate = hired.add(resigned).signum() == 0
                ? BigDecimal.ZERO
                : resigned.multiply(BigDecimal.valueOf(100)).divide(hired.add(resigned), 2, RoundingMode.HALF_UP);

        return List.of(
                insight("Employees Hired", formatDecimal(hired)),
                insight("Employees Resigned", formatDecimal(resigned)),
                insight("Net Headcount Change", formatDecimal(netHeadcount)),
                insight("Attrition Rate %", formatDecimal(attritionRate)),
                insight("Payroll Total", formatDecimal(payroll)),
                insight("Attendance Total", formatDecimal(attendance))
        );
    }

    private List<Map<String, String>> calculateOperations(List<Map<String, String>> rows) {
        BigDecimal completed = sumMatching(rows, "completed", "produced", "delivered", "processed", "output");
        BigDecimal pending = sumMatching(rows, "pending", "delayed", "backlog", "failed", "defect", "issue");
        BigDecimal totalWork = completed.add(pending);
        BigDecimal efficiency = totalWork.signum() == 0
                ? BigDecimal.ZERO
                : completed.multiply(BigDecimal.valueOf(100)).divide(totalWork, 2, RoundingMode.HALF_UP);
        BigDecimal averageOutput = average(completed, rows.size());

        return List.of(
                insight("Completed Output", formatDecimal(completed)),
                insight("Pending/Defect Work", formatDecimal(pending)),
                insight("Total Work", formatDecimal(totalWork)),
                insight("Efficiency %", formatDecimal(efficiency)),
                insight("Average Output", formatDecimal(averageOutput)),
                insight("Completion Gap", formatDecimal(pending))
        );
    }

    private List<Map<String, String>> calculateGeneral(List<Map<String, String>> rows, BigDecimal total) {
        BigDecimal average = average(total, rows.size());
        Map<String, String> topRow = maxRow(rows);

        return List.of(
                insight("Total Value", formatDecimal(total)),
                insight("Average Value", formatDecimal(average)),
                insight("Highest Value", formatDecimal(parseNumber(topRow.get("value")))),
                insight("Highest Value Item", StringUtils.hasText(topRow.get("item")) ? topRow.get("item") : "No item")
        );
    }

    private Map<String, String> insight(String label, String value) {
        return Map.of("label", label, "value", value);
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

    private String formatDecimal(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString();
    }

    private BigDecimal average(BigDecimal total, int count) {
        return count == 0 ? BigDecimal.ZERO : total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal sumMatching(List<Map<String, String>> rows, String... keywords) {
        return rows.stream()
                .filter(row -> matches(rowText(row), keywords))
                .map(row -> parseNumber(row.get("value")).abs())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Map<String, String> maxRow(List<Map<String, String>> rows) {
        return rows.stream()
                .max((first, second) -> parseNumber(first.get("value")).compareTo(parseNumber(second.get("value"))))
                .orElse(Map.of());
    }

    private String rowText(Map<String, String> row) {
        return row.getOrDefault("item", "").toLowerCase();
    }

    private boolean matches(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private BigDecimal parseNumber(String value) {
        if (!StringUtils.hasText(value)) {
            return BigDecimal.ZERO;
        }

        String numericValue = value.replaceAll("[^0-9.-]", "");
        if (!StringUtils.hasText(numericValue) || ".".equals(numericValue) || "-".equals(numericValue)) {
            return BigDecimal.ZERO;
        }

        try {
            return new BigDecimal(numericValue);
        } catch (NumberFormatException exception) {
            return BigDecimal.ZERO;
        }
    }

    private List<Map<String, String>> parseCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("CSV file is required");
        }

        String filename = file.getOriginalFilename();
        if (filename != null && !filename.toLowerCase().endsWith(".csv")) {
            throw new IllegalArgumentException("Only CSV files are supported");
        }

        try {
            String content = new String(file.getBytes(), StandardCharsets.UTF_8);
            List<String> lines = content.lines()
                    .filter(StringUtils::hasText)
                    .toList();

            if (lines.size() < 2) {
                throw new IllegalArgumentException("CSV must include a header and at least one data item");
            }

            List<String> headers = parseCsvLine(lines.get(0)).stream()
                    .map(header -> stripBom(header).trim().toLowerCase())
                    .toList();
            int itemIndex = headers.indexOf("item");
            int valueIndex = headers.indexOf("value");

            if (itemIndex < 0 || valueIndex < 0) {
                throw new IllegalArgumentException("CSV headers must be: Item, Value");
            }

            List<Map<String, String>> rows = new ArrayList<>();
            for (int index = 1; index < lines.size(); index++) {
                List<String> columns = parseCsvLine(lines.get(index));
                Map<String, String> row = new HashMap<>();
                row.put("item", getCsvColumn(columns, itemIndex));
                row.put("value", getCsvColumn(columns, valueIndex));
                rows.add(row);
            }
            return rows;
        } catch (IOException exception) {
            throw new IllegalArgumentException("Could not read CSV file");
        }
    }

    private String getCsvColumn(List<String> columns, int index) {
        return index < columns.size() ? columns.get(index).trim() : "";
    }

    private String stripBom(String value) {
        return value == null ? "" : value.replaceFirst("^\\uFEFF", "");
    }

    private List<String> parseCsvLine(String line) {
        List<String> values = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int index = 0; index < line.length(); index++) {
            char character = line.charAt(index);
            if (character == '"') {
                if (inQuotes && index + 1 < line.length() && line.charAt(index + 1) == '"') {
                    current.append('"');
                    index++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (character == ',' && !inQuotes) {
                values.add(current.toString());
                current.setLength(0);
            } else {
                current.append(character);
            }
        }

        values.add(current.toString());
        return values;
    }

    private String currentUserFullName() {
        String email = currentUserEmail();
        return userRepository.findByEmail(email)
                .map(user -> user.getFullName())
                .filter(StringUtils::hasText)
                .orElseThrow(() -> new IllegalArgumentException("Logged-in user was not found"));
    }

    private String currentUserEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !StringUtils.hasText(authentication.getName())) {
            throw new IllegalArgumentException("Logged-in user is required to create a report");
        }

        return authentication.getName();
    }

    private boolean isCurrentUserAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
