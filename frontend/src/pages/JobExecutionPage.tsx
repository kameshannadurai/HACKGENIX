import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/indexedDb';
import { useAuth } from '../contexts/AuthContext';
import { useNetwork } from '../contexts/NetworkContext';
import {
  Camera,
  Video,
  Mic,
  MapPin,
  CheckCircle2,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Trash2,
  Lock,
  Layers,
  Sparkles,
  Fingerprint,
} from 'lucide-react';
import {
  Job,
  FileType,
  EvidenceFileItem,
  InspectionData,
  OperationItem,
  EvidencePackageItem,
} from '../types';
import {
  generateOperationId,
  generateIdempotencyKey,
  computeSHA256ForObject,
} from '../utils/crypto';
import { EvidenceCaptureModal } from '../components/EvidenceCaptureModal';
import { syncEngine } from '../sync/syncEngine';

export const JobExecutionPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOnline } = useNetwork();

  // Load Job from IndexedDB
  const job = useLiveQuery(async () => {
    if (!jobId) return null;
    return await db.jobs.get(jobId);
  }, [jobId]);

  // Inspection Form State
  const [conditionRating, setConditionRating] = useState<'EXCELLENT' | 'GOOD' | 'NEEDS_MAINTENANCE' | 'CRITICAL_FAILURE'>('NEEDS_MAINTENANCE');
  const [temperature, setTemperature] = useState<number>(68.4);
  const [voltage, setVoltage] = useState<number>(37.2);
  const [damageObserved, setDamageObserved] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('Thermal hot-spot detected on Cell 12. Micro-crack visible on photodiode sub-assembly.');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    mountTensionVerified: true,
    groundingCableChecked: true,
    junctionBoxSealed: false,
    bypassDiodeTested: true,
  });

  // GPS State
  const [latitude, setLatitude] = useState<number>(37.774929);
  const [longitude, setLongitude] = useState<number>(-122.419416);
  const [gpsLocked, setGpsLocked] = useState<boolean>(true);

  // Evidence Files
  const [capturedFiles, setCapturedFiles] = useState<EvidenceFileItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<FileType>('PHOTO');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [generatedOpId, setGeneratedOpId] = useState<string>(generateOperationId());

  // Acquire real GPS if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setGpsLocked(true);
        },
        () => {
          // Default mock GPS for field simulation
        }
      );
    }
  }, []);

  const handleCaptureComplete = (file: EvidenceFileItem) => {
    setCapturedFiles((prev) => [...prev, file]);
  };

  const removeFile = (fileId: string) => {
    setCapturedFiles((prev) => prev.filter((f) => f.fileId !== fileId));
  };

  const handleSaveEvidencePackage = async () => {
    if (!job) return;
    setIsSaving(true);

    try {
      const now = new Date().toISOString();
      const idempotencyKey = generateIdempotencyKey();
      const packageId = `PKG-${generatedOpId}`;

      const inspectionData: InspectionData = {
        conditionRating,
        temperatureCelsius: temperature,
        voltageVDC: voltage,
        physicalDamageObserved: damageObserved,
        notes,
        customChecklist: checklist,
      };

      // Compute aggregate SHA-256 for Package Manifest
      const manifestPayload = {
        operationId: generatedOpId,
        jobId: job.id,
        workerId: user?.id || 'worker-01',
        inspectionData,
        fileHashes: capturedFiles.map((f) => f.fileHash),
        clientCreatedAt: now,
      };
      const packageHash = await computeSHA256ForObject(manifestPayload);

      // Create Evidence Package Record
      const evidencePackage: EvidencePackageItem = {
        id: packageId,
        packageId,
        operationId: generatedOpId,
        packageHash,
        status: 'STORED_OFFLINE',
        files: capturedFiles.map((f) => ({
          ...f,
          packageId,
          uploadStatus: 'STORED_OFFLINE',
        })),
        createdAt: now,
      };

      // Create Operation Record
      const operation: OperationItem = {
        id: `op-${Date.now()}`,
        operationId: generatedOpId,
        jobId: job.id,
        jobTitle: job.title,
        assetName: job.assetName,
        workerId: user?.id || 'worker-01',
        workerName: user?.name || 'Worker-01 (Alex Rivera)',
        idempotencyKey,
        version: 1,
        status: 'STORED_OFFLINE',
        deviceId: 'DEVICE-FIELD-TAB-09',
        latitude,
        longitude,
        inspectionData,
        evidencePackage,
        clientCreatedAt: now,
      };

      // Calculate total bytes
      const totalBytes = capturedFiles.reduce((acc, f) => acc + (f.fileSize || 0), 1024 * 10);

      // 1. Save to IndexedDB Stores
      await db.operations.put(operation);
      await db.evidencePackages.put(evidencePackage);
      for (const f of capturedFiles) {
        await db.evidenceFiles.put(f);
      }

      // 2. Add to Sync Queue
      await db.syncQueue.put({
        id: `queue-${Date.now()}`,
        operationId: generatedOpId,
        status: 'STORED_OFFLINE',
        retryCount: 0,
        lastCheckpoint: 0,
        totalBytes,
        uploadedBytes: 0,
        enqueuedAt: now,
      });

      // 3. Update Job status in IndexedDB
      job.status = 'IN_PROGRESS';
      await db.jobs.put(job);

      // 4. Audit Log
      await db.auditLogs.add({
        id: `audit-${Date.now()}`,
        operationId: operation.id,
        operationCode: generatedOpId,
        action: 'EVIDENCE_PACKAGE_CREATED',
        description: `Evidence Package ${packageId} created with ${capturedFiles.length} media files & saved to offline vault`,
        metadata: JSON.stringify({ packageHash, idempotencyKey }),
        timestamp: now,
      });

      setSavedSuccess(true);

      // If online, trigger background sync engine
      if (syncEngine.isOnline()) {
        syncEngine.triggerSync();
      }
    } catch (err: any) {
      console.error('Failed to save evidence package:', err);
      alert('Error saving locally: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!job) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-bold text-slate-300">Job not found</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-sky-400 underline text-xs">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold text-sky-300 bg-sky-950 px-2.5 py-1 rounded border border-sky-800">
            Operation ID: {generatedOpId}
          </span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedSuccess && (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/50 bg-emerald-950/40 glow-emerald space-y-3 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>OFFLINE — EVIDENCE PACKAGE SAFELY STORED IN LOCAL VAULT</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700">
              Queue State: QUEUED
            </span>
          </div>
          <p className="text-xs text-emerald-200/80">
            Operation <strong>{generatedOpId}</strong> is sealed with cryptographic SHA-256 hashes and queued. It will automatically synchronize when network connectivity is established.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => navigate('/sync')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-md"
            >
              Open Sync Center
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700"
            >
              Return to Jobs
            </button>
          </div>
        </div>
      )}

      {/* Job Context Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="font-mono text-xs font-bold text-sky-400">{job.jobCode}</span>
            <h1 className="text-xl font-black text-white">{job.title}</h1>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-slate-400">Target Asset:</p>
            <p className="text-sm font-bold text-cyan-400">{job.assetName}</p>
          </div>
        </div>
        <p className="text-xs text-slate-300">{job.description}</p>
      </div>

      {/* SECTION 1: Field Inspection Form */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          1. Field Inspection Parameters & Measurements
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Condition Rating */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Condition Assessment</label>
            <select
              value={conditionRating}
              onChange={(e: any) => setConditionRating(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            >
              <option value="EXCELLENT">EXCELLENT (Nominal Specs)</option>
              <option value="GOOD">GOOD (Minor Cosmetic Wear)</option>
              <option value="NEEDS_MAINTENANCE">NEEDS_MAINTENANCE (Action Required)</option>
              <option value="CRITICAL_FAILURE">CRITICAL_FAILURE (Immediate Danger)</option>
            </select>
          </div>

          {/* Temperature */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Thermal Reading (°C)</label>
            <input
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Voltage */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Open-Circuit Voltage (VDC)</label>
            <input
              type="number"
              step="0.1"
              value={voltage}
              onChange={(e) => setVoltage(parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Physical Damage Switch */}
          <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs font-semibold text-slate-200">Physical Damage Observed</p>
              <p className="text-[10px] text-slate-400">Cracking, corrosion, or burnt leads</p>
            </div>
            <input
              type="checkbox"
              checked={damageObserved}
              onChange={(e) => setDamageObserved(e.target.checked)}
              className="w-4 h-4 rounded text-sky-500 focus:ring-0"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Technician Diagnostic Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 leading-relaxed"
            placeholder="Document observed anomalies, diode measurements, or corrective actions taken..."
          />
        </div>

        {/* Verification Checklist */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <p className="text-xs font-bold text-slate-300">Operational Checklist</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(checklist).map(([key, val]) => (
              <label
                key={key}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 cursor-pointer hover:bg-slate-900"
              >
                <input
                  type="checkbox"
                  checked={val}
                  onChange={(e) => setChecklist({ ...checklist, [key]: e.target.checked })}
                  className="rounded text-sky-500 focus:ring-0"
                />
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: GPS Geolocation & Timestamp */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          2. GPS Coordinates & Hardware Timestamps
        </h2>

        <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-bold text-slate-200">GPS Locked via Hardware</span>
            </div>
            <p className="text-xs font-mono text-emerald-400">
              Latitude: {latitude.toFixed(6)}° N | Longitude: {longitude.toFixed(6)}° W
            </p>
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            Captured: {new Date().toLocaleTimeString()} (UTC Local)
          </div>
        </div>
      </div>

      {/* SECTION 3: Multimedia Evidence Capture */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-cyan-400" />
              3. Multimedia Evidence Vault & SHA-256 Cryptographic Binding
            </h2>
            <p className="text-xs text-slate-400">
              Photos, Videos, and Voice Notes are cryptographically hashed upon capture
            </p>
          </div>

          {/* Capture Trigger Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setModalType('PHOTO');
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/80 hover:bg-sky-500 text-white font-bold text-xs shadow transition-all"
            >
              <Camera className="w-3.5 h-3.5" /> Photo
            </button>
            <button
              onClick={() => {
                setModalType('VIDEO');
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white font-bold text-xs shadow transition-all"
            >
              <Video className="w-3.5 h-3.5" /> Video
            </button>
            <button
              onClick={() => {
                setModalType('VOICE_NOTE');
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white font-bold text-xs shadow transition-all"
            >
              <Mic className="w-3.5 h-3.5" /> Voice Note
            </button>
          </div>
        </div>

        {/* Evidence List */}
        {capturedFiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {capturedFiles.map((f, idx) => (
              <div
                key={f.fileId}
                className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 space-y-2 relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    {f.fileType === 'PHOTO' && <Camera className="w-3.5 h-3.5 text-sky-400" />}
                    {f.fileType === 'VIDEO' && <Video className="w-3.5 h-3.5 text-rose-400" />}
                    {f.fileType === 'VOICE_NOTE' && <Mic className="w-3.5 h-3.5 text-purple-400" />}
                    {f.fileName}
                  </span>
                  <button
                    onClick={() => removeFile(f.fileId)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Media Preview if available */}
                {f.previewUrl && (
                  <div className="h-28 rounded-lg overflow-hidden bg-black flex items-center justify-center border border-slate-800">
                    {f.fileType === 'PHOTO' && (
                      <img src={f.previewUrl} alt="preview" className="w-full h-full object-cover" />
                    )}
                    {f.fileType === 'VIDEO' && (
                      <video src={f.previewUrl} controls className="w-full h-full object-contain" />
                    )}
                    {f.fileType === 'VOICE_NOTE' && (
                      <audio src={f.previewUrl} controls className="w-full" />
                    )}
                  </div>
                )}

                {/* SHA-256 Badge */}
                <div className="bg-slate-950 p-2 rounded-lg border border-emerald-900/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold truncate">
                    <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                    <span className="font-mono truncate">{f.fileHash}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                    {((f.fileSize || 0) / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-xl space-y-2">
            <Fingerprint className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No media evidence captured yet</p>
            <p className="text-[11px] text-slate-500">
              Capture photos, short videos, or voice memos above to attach to this Evidence Package
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action: Create Evidence Package & Save Offline */}
      <div className="glass-panel p-5 rounded-2xl border border-sky-800/80 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-purple-400" />
            Sealed Evidence Package
          </h3>
          <p className="text-xs text-slate-400">
            Guaranteed offline persistence to IndexedDB with automatic queueing
          </p>
        </div>

        <button
          onClick={handleSaveEvidencePackage}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-sky-600/30 transition-all active:scale-95 disabled:opacity-50"
        >
          <Lock className="w-4 h-4" />
          {isSaving ? 'Sealing & Saving Vault...' : 'Save Evidence Package Offline'}
        </button>
      </div>

      {/* Capture Modal */}
      <EvidenceCaptureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCaptureComplete={handleCaptureComplete}
        targetType={modalType}
      />
    </div>
  );
};
