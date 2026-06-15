package com.example.reportmanagement.repository;

import com.example.reportmanagement.model.Report;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReportRepository extends MongoRepository<Report, String> {
    List<Report> findByGeneratedByEmailOrderByGeneratedOnDesc(String generatedByEmail);
    List<Report> findTop5ByGeneratedByEmailOrderByGeneratedOnDesc(String generatedByEmail);
    long countByGeneratedByEmail(String generatedByEmail);
    long countByGeneratedByEmailAndGeneratedOnAfter(String generatedByEmail, LocalDateTime generatedOn);

    List<Report> findAllByOrderByGeneratedOnDesc();
    List<Report> findTop5ByOrderByGeneratedOnDesc();
    long countByGeneratedOnAfter(LocalDateTime generatedOn);
}
