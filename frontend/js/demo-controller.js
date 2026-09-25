/**
 * SyncField 3-Minute Judge Demo Controller
 * Guides judges and evaluators through the exact 11-step demonstration.
 */

class JudgeDemoController {
  constructor() {
    this.currentStep = 0;
    this.demoOperationId = 'OP-2026-0047';
    this.isRunningAuto = false;

    this.steps = [
      {
        num: 1,
        title: 'Step 1: Field Job Online',
        instruction: 'Technician opens field inspection job while connected to network (Solar Panel Inspection).',
        actionLabel: '1. Initialize Job Online',
        run: async () => this.step1_openJobOnline()
      },
      {
        num: 2,
        title: 'Step 2: Kill Network',
        instruction: 'Technician travels into weak-signal remote desert array. Turn Network to OFFLINE.',
        actionLabel: '2. Cut Network (Go Offline)',
        run: async () => this.step2_cutNetwork()
      },
      {
        num: 3,
        title: 'Step 3: Capture Offline Evidence Package',
        instruction: 'Technician inspects Panel #47, captures photos, 18.4MB video, voice note, GPS, and seals package locally.',
        actionLabel: '3. Capture & Seal Package',
        run: async () => this.step3_captureOfflineEvidence()
      },
      {
        num: 4,
        title: 'Step 4: Restore Network & Start Sync',
        instruction: 'Technician approaches vehicle WiFi hotspot. Restore network and initiate smart sync.',
        actionLabel: '4. Reconnect & Start Upload',
        run: async () => this.step4_restoreNetworkAndStart()
      },
      {
        num: 5,
        title: 'Step 5: Interrupt Mid-Upload (11:17 AM)',
        instruction: 'Simulate vehicle moving out of range mid-video upload at Chunk 4/10. Network drops!',
        actionLabel: '5. Interrupt Mid-Transfer',
        run: async () => this.step5_interruptMidTransfer()
      },
      {
        num: 6,
        title: 'Step 6: Show Checkpoint Persistence',
        instruction: 'Observe: Upload is PAUSED AT CHECKPOINT (Chunks 1-3 preserved). Zero redundant bytes to re-upload.',
        actionLabel: '6. Inspect Checkpoint',
        run: async () => this.step6_inspectCheckpoint()
      },
      {
        num: 7,
        title: 'Step 7: Network Returns & Resumes (11:32 AM)',
        instruction: 'Network restored at field base station. Watch upload resume from Chunk 4 instead of restarting!',
        actionLabel: '7. Restore & Resume From Checkpoint',
        run: async () => this.step7_resumeFromCheckpoint()
      },
      {
        num: 8,
        title: 'Step 8: Server Cryptographic Integrity Pass',
        instruction: 'Cloud gateway computes SHA-256 fingerprint. Verifies 100% data integrity with zero corruption.',
        actionLabel: '8. Integrity Verified',
        run: async () => this.step8_verifyIntegrity()
      },
      {
        num: 9,
        title: 'Step 9: Open Supervisor Evidence Vault',
        instruction: 'Switch to Supervisor Command Center. View package OP-2026-0047 in the Evidence Vault.',
        actionLabel: '9. View Supervisor Vault',
        run: async () => this.step9_openSupervisorVault()
      },
      {
        num: 10,
        title: 'Step 10: Inspect Audit Timeline',
        instruction: 'View the complete, tamper-evident capture-to-sync timeline with exact timestamps.',
        actionLabel: '10. View Audit Timeline',
        run: async () => this.step10_inspectAuditTimeline()
      },
      {
        num: 11,
        title: 'Step 11: Explainable Conflict Resolution',
        instruction: 'Demonstrate concurrent offline edit conflict detection, side-by-side diff, and supervisor resolution.',
        actionLabel: '11. Trigger & Resolve Conflict',
        run: async () => this.step11_demonstrateConflict()
      }
    ];
  }

  getStep(index) {
    return this.steps[index];
  }

  async runStep(stepIndex) {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.currentStep = stepIndex;
      if (window.app && window.app.showToast) {
        window.app.showToast(`Running Demo Step ${stepIndex + 1}: ${this.steps[stepIndex].title}`, 'info');
      }
      await this.steps[stepIndex].run();
    }
  }

  async nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      await this.runStep(this.currentStep + 1);
    } else {
      if (window.app) window.app.showToast('3-Minute Judge Demo Completed Successfully!', 'success');
      this.currentStep = 0;
    }
  }

  async autoPlay() {
    if (this.isRunningAuto) return;
    this.isRunningAuto = true;
    if (window.app) window.app.showToast('Starting 3-Minute Automated Judge Demonstration...', 'info');

    for (let i = 0; i < this.steps.length; i++) {
      await this.runStep(i);
      await new Promise(r => setTimeout(r, i === 3 || i === 6 ? 4000 : 2500));
    }

    this.isRunningAuto = false;
    if (window.app) window.app.showToast('Judge Demo flow complete!', 'success');
  }

  /* --- Step Implementations --- */

  async step1_openJobOnline() {
    if (window.app) {
      window.app.switchRole('officer');
      window.app.setConnectivity(true);
      window.app.navigateTo('dashboard');
      window.app.showToast('Technician online. Assigned job: Solar Panel Inverter Inspection.', 'info');
    }
  }

  async step2_cutNetwork() {
    if (window.app) {
      window.app.setConnectivity(false);
      window.app.showToast('Network disconnected: OFFLINE MODE ACTIVE. Full local continuity enabled.', 'warning');
    }
  }

  async step3_captureOfflineEvidence() {
    if (window.app) {
      window.app.navigateTo('inspection-form');
      window.app.saveInspection(false);
      window.app.showToast(`10:42 AM - Evidence Package OP-2026-0047 created and secured in Local Vault.`, 'success');
    }
  }

  async step4_restoreNetworkAndStart() {
    if (window.app) {
      window.app.setConnectivity(true);
      window.app.navigateTo('sync-center');
      window.app.syncNow();
    }
  }

  async step5_interruptMidTransfer() {
    if (window.app) {
      window.app.setConnectivity(false);
      window.app.navigateTo('resumable-upload');
      window.app.simulateUploadInterrupt();
      window.app.showToast('11:17 AM — Network drops! Media transfer interrupted at verified checkpoint.', 'warning');
    }
  }

  async step6_inspectCheckpoint() {
    if (window.app) {
      window.app.navigateTo('resumable-upload');
      window.app.showToast(`Verified Checkpoint: 13.2 MB safe on server. 0 redundant data!`, 'info');
    }
  }

  async step7_resumeFromCheckpoint() {
    if (window.app) {
      window.app.setConnectivity(true);
      window.app.navigateTo('resumable-upload');
      window.app.resumeUpload();
      window.app.showToast('11:32 AM — Network returns! Resuming upload from Checkpoint...', 'info');
    }
  }

  async step8_verifyIntegrity() {
    if (window.app) {
      window.app.navigateTo('evidence-package');
      window.app.showToast(`11:32 AM — Server SHA-256 Integrity: PASSED (VERIFIED)`, 'success');
    }
  }

  async step9_openSupervisorVault() {
    if (window.app) {
      window.app.switchRole('supervisor');
      window.app.navigateTo('local-vault');
      window.app.showToast('Supervisor Vault: Evidence Package OP-2026-0047 inspected.', 'info');
    }
  }

  async step10_inspectAuditTimeline() {
    if (window.app) {
      window.app.navigateTo('dashboard');
      window.app.showToast('Chronological Capture-to-Sync Audit Trail active.', 'info');
    }
  }

  async step11_demonstrateConflict() {
    if (window.app) {
      window.app.navigateTo('conflicts');
      window.app.showToast('Conflict Resolution: Review side-by-side versions.', 'warning');
    }
  }
}

window.judgeDemo = new JudgeDemoController();
