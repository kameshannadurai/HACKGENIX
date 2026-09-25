package com.syncfield.service;

import com.syncfield.entity.*;
import com.syncfield.enums.*;
import com.syncfield.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (organizationRepository.count() > 0) {
            log.info("Database already seeded with demo data.");
            return;
        }

        log.info("Seeding SyncField Demo Database with Role-Based Accounts...");

        // 1. Organization
        Organization org = Organization.builder()
                .name("Mojave Solar Array Operations")
                .build();
        org = organizationRepository.save(org);

        // 2. Demo Users for Each Role
        User admin = User.builder()
                .name("Sarah Chen (Admin)")
                .email("admin@syncfield.demo")
                .passwordHash(passwordEncoder.encode("Admin@123"))
                .role(Role.ADMIN)
                .organization(org)
                .build();
        userRepository.save(admin);

        User officer = User.builder()
                .name("Arun Kumar (Worker-04)")
                .email("field@syncfield.demo")
                .passwordHash(passwordEncoder.encode("Field@123"))
                .role(Role.FIELD_WORKER)
                .organization(org)
                .build();
        officer = userRepository.save(officer);

        User supervisor = User.builder()
                .name("Marcus Brody (Supervisor HQ)")
                .email("supervisor@syncfield.demo")
                .passwordHash(passwordEncoder.encode("Supervisor@123"))
                .role(Role.SUPERVISOR)
                .organization(org)
                .build();
        userRepository.save(supervisor);

        // 3. Demo Jobs
        List<Job> jobs = List.of(
                Job.builder()
                        .jobCode("JOB-SOLAR-047")
                        .title("Solar Panel Inspection")
                        .description("Solar Panel Array Inverter Diagnostic & Thermal Runaway Check on Sector 7.")
                        .assetName("Panel #47")
                        .assignedWorker(officer)
                        .status(JobStatus.ASSIGNED)
                        .priority(Priority.HIGH)
                        .build(),
                Job.builder()
                        .jobCode("JOB-TOWER-102")
                        .title("Substation Transformer Check")
                        .description("High-voltage insulator integrity sweep and line tension evaluation.")
                        .assetName("Transformer Bank 3")
                        .assignedWorker(officer)
                        .status(JobStatus.ASSIGNED)
                        .priority(Priority.CRITICAL)
                        .build(),
                Job.builder()
                        .jobCode("JOB-HVAC-305")
                        .title("Telecom 5G Tower Alignment")
                        .description("Antenna tilt calibration and grounding inspection.")
                        .assetName("Mast 5G-09")
                        .assignedWorker(officer)
                        .status(JobStatus.IN_PROGRESS)
                        .priority(Priority.MEDIUM)
                        .build(),
                Job.builder()
                        .jobCode("JOB-IND-881")
                        .title("Wind Turbine Pitch Check")
                        .description("Hydraulic actuator calibration and blade surface acoustic scan.")
                        .assetName("Turbine WT-12")
                        .assignedWorker(officer)
                        .status(JobStatus.ASSIGNED)
                        .priority(Priority.HIGH)
                        .build()
        );

        jobRepository.saveAll(jobs);

        log.info("Demo data seeding completed successfully with demo accounts: admin@syncfield.demo, field@syncfield.demo, supervisor@syncfield.demo");
    }
}
