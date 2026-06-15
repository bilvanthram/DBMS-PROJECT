package com.example.reportmanagement.migration;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Read-only access to the legacy PostgreSQL {@code reports} table for the one-time migration.
 * Delete together with {@link LegacyReport} and {@link ReportMigrationRunner} once done.
 */
public interface LegacyReportRepository extends JpaRepository<LegacyReport, Long> {
}
