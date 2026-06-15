package com.example.reportmanagement.controller;

import com.example.reportmanagement.dto.ReportResponse;
import com.example.reportmanagement.model.Report;
import com.example.reportmanagement.service.ReportService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping
    public List<ReportResponse> all() {
        return reportService.findAll();
    }

    @GetMapping("/recent")
    public List<ReportResponse> recent() {
        return reportService.findRecent();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Report create(@Valid @RequestBody Report report) {
        return reportService.createReport(report);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        reportService.deleteReport(id);
    }

    @PostMapping("/upload")
    @ResponseStatus(HttpStatus.CREATED)
    public Report createFromCsv(
            @RequestParam String name,
            @RequestParam String reportType,
            @RequestParam String department,
            @RequestParam String format,
            @RequestParam String description,
            @RequestParam LocalDate dateFrom,
            @RequestParam LocalDate dateTo,
            @RequestParam MultipartFile file) {
        return reportService.createReportFromCsv(
                name,
                reportType,
                department,
                format,
                description,
                dateFrom,
                dateTo,
                file
        );
    }

    @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class})
    public ResponseEntity<String> handleBadRequest(Exception exception) {
        return ResponseEntity.badRequest().body(exception.getMessage());
    }
}
