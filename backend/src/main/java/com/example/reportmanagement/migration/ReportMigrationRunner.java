package com.example.reportmanagement.migration;

import com.example.reportmanagement.model.Report;
import com.example.reportmanagement.repository.ReportRepository;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * One-time migration of reports from the legacy PostgreSQL {@code reports} table into MongoDB.
 *
 * <p>Runs only when {@code app.migrate-legacy-reports=true}. To stay idempotent it refuses to run
 * if the MongoDB reports collection already contains documents, so flipping the flag a second time
 * won't create duplicates. After a successful run, set the flag back to {@code false} and (optionally)
 * delete this whole {@code migration} package.
 */
@Component
@ConditionalOnProperty(name = "app.migrate-legacy-reports", havingValue = "true")
public class ReportMigrationRunner implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(ReportMigrationRunner.class);

    private final LegacyReportRepository legacyReportRepository;
    private final ReportRepository reportRepository;

    public ReportMigrationRunner(LegacyReportRepository legacyReportRepository, ReportRepository reportRepository) {
        this.legacyReportRepository = legacyReportRepository;
        this.reportRepository = reportRepository;
    }

    @Override
    public void run(String... args) {
        long existingInMongo = reportRepository.count();
        if (existingInMongo > 0) {
            log.warn("Skipping legacy report migration: MongoDB already holds {} report(s). "
                    + "Clear the collection first if you really want to re-import, "
                    + "or set app.migrate-legacy-reports=false.", existingInMongo);
            return;
        }

        List<LegacyReport> legacyReports = legacyReportRepository.findAll();
        if (legacyReports.isEmpty()) {
            log.info("No legacy reports found in PostgreSQL. Nothing to migrate.");
            return;
        }

        int migrated = 0;
        for (LegacyReport legacy : legacyReports) {
            reportRepository.save(toMongoReport(legacy));
            migrated++;
        }

        log.info("Migrated {} report(s) from PostgreSQL -> MongoDB. "
                + "You can now set app.migrate-legacy-reports=false.", migrated);
    }

    private Report toMongoReport(LegacyReport legacy) {
        Report report = new Report();
        report.setId(null); // let MongoDB generate a fresh id
        report.setName(legacy.getName());
        report.setReportType(legacy.getReportType());
        report.setDepartment(legacy.getDepartment());
        report.setFormat(legacy.getFormat());
        report.setDescription(legacy.getDescription());
        report.setReportData(legacy.getReportData());
        report.setDataRowCount(legacy.getDataRowCount());
        report.setTotalValue(legacy.getTotalValue());
        report.setAverageValue(legacy.getAverageValue());
        report.setDepartmentInsights(legacy.getDepartmentInsights());
        report.setDateFrom(legacy.getDateFrom());
        report.setDateTo(legacy.getDateTo());
        report.setGeneratedBy(legacy.getGeneratedBy());
        report.setGeneratedByEmail(legacy.getGeneratedByEmail());
        report.setGeneratedOn(legacy.getGeneratedOn());
        report.setStatus(legacy.getStatus());
        return report;
    }
}
