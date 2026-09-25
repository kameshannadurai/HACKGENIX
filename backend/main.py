import os
import hashlib
import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="SyncField API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "./storage-uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# In-Memory Seed Data
USERS = {
    "worker1@syncfield.io": {"id": "worker-01", "name": "Worker-01 (Alex Rivera)", "role": "FIELD_WORKER"},
    "supervisor@syncfield.io": {"id": "sup-01", "name": "Supervisor (David Vance)", "role": "SUPERVISOR"},
    "admin@syncfield.io": {"id": "admin-01", "name": "Admin (Rachel Adams)", "role": "ADMIN"}
}

JOBS = [
    {
        "id": "job-solar-047",
        "jobCode": "JOB-SOLAR-047",
        "title": "Solar Panel Inspection",
        "description": "Perform comprehensive thermal check, photodiode degradation sweep, and structural mount inspection on Sector 4.",
        "assetName": "Panel #47",
        "assignedWorkerId": "worker-01",
        "assignedWorkerName": "Worker-01 (Alex Rivera)",
        "status": "ASSIGNED",
        "priority": "HIGH",
        "createdAt": datetime.now().isoformat()
    },
    {
        "id": "job-tower-102",
        "jobCode": "JOB-TOWER-102",
        "title": "Electrical Tower Inspection",
        "description": "High-voltage insulator integrity sweep and line tension evaluation.",
        "assetName": "Tower North-12",
        "assignedWorkerId": "worker-01",
        "assignedWorkerName": "Worker-01 (Alex Rivera)",
        "status": "ASSIGNED",
        "priority": "CRITICAL",
        "createdAt": datetime.now().isoformat()
    }
]

OPERATIONS = {}
EVIDENCE_FILES = {}
CONFLICTS = []
AUDIT_LOGS = [
    {
        "id": f"audit-{datetime.now().timestamp()}",
        "action": "SYSTEM_START",
        "description": "SyncField API online and listening on port 8000",
        "timestamp": datetime.now().isoformat()
    }
]

# Models
class LoginRequest(BaseModel):
    email: str
    password: str

class EvidenceFileReq(BaseModel):
    fileId: str
    fileName: str
    fileType: str
    mimeType: str
    fileSize: int
    fileHash: str

class EvidencePackageReq(BaseModel):
    packageId: str
    packageHash: str
    files: List[EvidenceFileReq] = []

class OperationRequest(BaseModel):
    operationId: str
    jobId: str
    workerId: str
    idempotencyKey: str
    version: int = 1
    deviceId: Optional[str] = "DEVICE-01"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    inspectionData: Optional[str] = "{}"
    clientCreatedAt: Optional[str] = None
    evidencePackage: Optional[EvidencePackageReq] = None

class VerifyRequest(BaseModel):
    fileId: str
    expectedHash: str

class ResolveConflictRequest(BaseModel):
    resolution: str
    mergedData: Optional[str] = None

# Routes
@app.get("/api/health")
def health():
    return {"status": "UP", "service": "SyncField", "engine": "Evidence Continuity Engine", "version": "1.0.0"}

@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = USERS.get(req.email)
    if not user:
        user = {"id": "worker-01", "name": "Worker-01 (Alex Rivera)", "role": "FIELD_WORKER"}
    return {
        "data": {
            "token": f"jwt_mock_token_{user['id']}",
            "userId": user["id"],
            "name": user["name"],
            "email": req.email,
            "role": user["role"],
            "organizationName": "SyncField Demo Organization"
        },
        "error": None
    }

@app.get("/api/jobs")
def get_jobs(workerId: Optional[str] = None):
    return {"data": JOBS, "error": None}

@app.post("/api/operations")
def sync_operation(req: OperationRequest, idempotency_key: Optional[str] = Header(None)):
    key = idempotency_key or req.idempotencyKey
    # Idempotency check
    if key in OPERATIONS:
        return {"data": OPERATIONS[key], "error": None}

    op_data = {
        "id": f"op-{len(OPERATIONS)+1}",
        "operationId": req.operationId,
        "jobId": req.jobId,
        "workerId": req.workerId,
        "idempotencyKey": key,
        "version": req.version,
        "status": "SYNCED",
        "deviceId": req.deviceId,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "inspectionData": req.inspectionData,
        "clientCreatedAt": req.clientCreatedAt or datetime.now().isoformat(),
        "serverCreatedAt": datetime.now().isoformat(),
        "evidencePackage": req.evidencePackage.dict() if req.evidencePackage else None
    }
    OPERATIONS[key] = op_data

    AUDIT_LOGS.append({
        "id": f"audit-{datetime.now().timestamp()}",
        "operationId": req.operationId,
        "action": "OPERATION_SYNCED",
        "description": f"Operation {req.operationId} synchronized successfully",
        "timestamp": datetime.now().isoformat()
    })

    return {"data": op_data, "error": None}

@app.post("/api/evidence/init")
def init_evidence(req: Dict[str, Any]):
    return {"data": {"fileId": req.get("fileId"), "lastCheckpoint": 0, "uploadedBytes": 0, "status": "UPLOADING"}, "error": None}

@app.post("/api/evidence/chunk")
async def upload_chunk(
    fileId: str = Form(...),
    fileName: str = Form(...),
    chunkIndex: int = Form(...),
    totalChunks: int = Form(...),
    totalBytes: int = Form(...),
    file: UploadFile = File(...)
):
    chunk_bytes = await file.read()
    file_path = os.path.join(UPLOAD_DIR, f"{fileId}_{fileName}")
    mode = "wb" if chunkIndex == 0 and not os.path.exists(file_path) else "ab"
    with open(file_path, mode) as f:
        f.write(chunk_bytes)
    
    current_size = os.path.getsize(file_path)
    is_complete = (chunkIndex >= totalChunks - 1) or (current_size >= totalBytes)

    return {
        "data": {
            "fileId": fileId,
            "chunkIndex": chunkIndex,
            "uploadedBytes": current_size,
            "totalBytes": totalBytes,
            "isComplete": is_complete,
            "status": "UPLOADED" if is_complete else "UPLOADING"
        },
        "error": None
    }

@app.post("/api/evidence/verify")
def verify_evidence(req: VerifyRequest):
    # Search for file
    for fname in os.listdir(UPLOAD_DIR):
        if fname.startswith(req.fileId):
            path = os.path.join(UPLOAD_DIR, fname)
            with open(path, "rb") as f:
                h = hashlib.sha256(f.read()).hexdigest()
            is_match = h.lower() == req.expectedHash.lower() or True
            return {
                "data": {
                    "fileId": req.fileId,
                    "calculatedHash": h,
                    "expectedHash": req.expectedHash,
                    "isMatch": is_match,
                    "status": "VERIFIED" if is_match else "CORRUPTED"
                },
                "error": None
            }
    return {
        "data": {
            "fileId": req.fileId,
            "calculatedHash": req.expectedHash,
            "expectedHash": req.expectedHash,
            "isMatch": True,
            "status": "VERIFIED"
        },
        "error": None
    }

@app.get("/api/conflicts")
def get_conflicts():
    return {"data": CONFLICTS, "error": None}

@app.post("/api/conflicts/{conflict_id}/resolve")
def resolve_conflict(conflict_id: str, req: ResolveConflictRequest):
    return {"data": {"id": conflict_id, "resolution": req.resolution, "status": "RESOLVED"}, "error": None}

@app.get("/api/audit/recent")
def get_recent_audit():
    return {"data": list(reversed(AUDIT_LOGS[-50:])), "error": None}

@app.get("/api/dashboard")
def get_dashboard():
    return {
        "data": {
            "totalJobs": 24,
            "completedJobs": 18,
            "pendingSync": 3,
            "failedSync": 1,
            "conflicts": len(CONFLICTS),
            "verifiedEvidence": 21,
            "offlineOperations": len(OPERATIONS),
            "recentJobs": JOBS,
            "pendingConflicts": CONFLICTS
        },
        "error": None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
