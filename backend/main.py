"""
ProctorIQ — Cognitive Attention Backend
FastAPI + MediaPipe + YOLOv8 + SQLAlchemy Database | Professional Edition
"""

import cv2
import base64
import time
import asyncio
import random
import os
import json
import logging
from datetime import datetime

import numpy as np
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# ─── SQLALCHEMY DATABASE SETUP ─────────────────────────────────────────────
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base, relationship

# Live PostgreSQL logic for Railway, Local SQLite for your PC
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./proctoriq.db")
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ─── DATABASE MODELS ───────────────────────────────────────────────────────
class StudentDB(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True)
    name = Column(String)

class ExamSessionDB(Base):
    __tablename__ = "exam_sessions"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    average_score = Column(Float, nullable=True)

class IncidentLogDB(Base):
    __tablename__ = "incident_logs"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("exam_sessions.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    activity = Column(String)

# Create tables in database automatically
Base.metadata.create_all(bind=engine)

# ─── LOGGING ───────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)-8s  %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("ProctorIQ ")

# ─── YOLO MOBILE DETECTION ─────────────────────────────────────────────────
try:
    from ultralytics import YOLO
    log.info("Loading YOLOv8 Nano for mobile detection …")
    yolo_model = YOLO("yolov8n.pt")
    log.info("YOLOv8 loaded ✓")
except Exception as exc:
    log.warning(f"YOLO unavailable: {exc}")
    yolo_model = None

# ─── MEDIAPIPE FACE MESH ───────────────────────────────────────────────────
import mediapipe as mp

_mp_face = mp.solutions.face_mesh
# TASK 1: Changed max_num_faces from 1 to 2 to enable multi-face detection
face_mesh = _mp_face.FaceMesh(
    max_num_faces=2,
    refine_landmarks=True,
    min_detection_confidence=0.60,
    min_tracking_confidence=0.60,
)

# ─── APP ───────────────────────────────────────────────────────────────────
app = FastAPI(title="ProctorIQ  Attention API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://neurolearn-pro.vercel.app", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STUDENT_ID = "Rafay Khalil"
STUDENT_ROLL_NO = "099"

# ─── CONSTANTS ─────────────────────────────────────────────────────────────
class Thresh:
    EAR_SLEEP       = 0.010   # normalised EAR below this → eyes closed
    EAR_DROWSY_SEC  = 2.0     # seconds eyes closed before "Drowsy"
    EAR_SLEEP_SEC   = 10.0    # seconds eyes closed before "Sleeping"

    YAW_FOCUSED     = 0.06    # yaw deviation: fully focused zone
    YAW_DISTRACTED  = 0.25    # yaw deviation: looking away

    PITCH_MIN       = 0.10    # chin-forehead dy below this → head down

    NO_FACE_SEC     = 1.5     # seconds without face → absent

    MOBILE_CONF     = 0.40    # YOLO confidence threshold
    MOBILE_LOW_CONF = 0.35    # low-conf pass for second scan
    MOBILE_HOLD_SEC = 2.5     # how long mobile alert stays active
    MOBILE_CONFIRM  = 2       # consecutive detections needed to confirm
    MOBILE_INTERVAL = 6       # run YOLO every N frames

    EMA_ALPHA       = 0.85    # exponential moving average smoothing

# ─── INCIDENT TRACKER ──────────────────────────────────────────────────────
class IncidentTracker:
    COOLDOWN = 5.0
    def __init__(self):
        self._logs = []

    def record(self, student: str, activity: str) -> None:
        now = time.time()
        if self._logs:
            last = self._logs[-1]
            if last["activity"] == activity and (now - last["_ts"] < self.COOLDOWN):
                return
        self._logs.append({"time": time.strftime("%H:%M:%S"), "student": student, "activity": activity, "_ts": now})
        log.info(f"INCIDENT [{student}] → {activity}")

    def recent(self, n: int = 5) -> list[dict]:
        return [{k: v for k, v in entry.items() if not k.startswith("_")} for entry in self._logs[-n:]]

tracker = IncidentTracker()

# ─── SESSION STATE ─────────────────────────────────────────────────────────
class Session:
    def __init__(self):
        self.frame_count = 0
        self.last_face_ts = time.time()
        self.eyes_closed_since = None
        self.score = 100.0
        self.yolo_busy = False
        self.mobile_alert_ts = 0.0
        self.mobile_conf_run = 0
        self.mobile_confirmed = False

# ─── MOBILE DETECTION ─────────────────────────────────────────────────────
def _detect_phone(img: np.ndarray) -> tuple[bool, float]:
    if yolo_model is None: return False, 0.0
    best = 0.0
    for r in yolo_model(img, classes=[67], conf=Thresh.MOBILE_CONF, verbose=False, imgsz=320):
        for box in r.boxes:
            c = float(box.conf[0])
            if c > best: best = c
    if best == 0.0:
        h, w = img.shape[:2]
        big = cv2.resize(img, (640, int(640 * h / w))) if w < 600 else img
        for r in yolo_model(big, classes=[67], conf=Thresh.MOBILE_LOW_CONF, verbose=False, imgsz=640):
            for box in r.boxes:
                c = float(box.conf[0])
                if c > best: best = c
    return best >= Thresh.MOBILE_CONF, best

async def _async_phone_check(img: np.ndarray, sess: Session) -> None:
    try:
        sess.yolo_busy = True
        detected, conf = await asyncio.to_thread(_detect_phone, img)
        if detected:
            sess.mobile_conf_run += 1
            if sess.mobile_conf_run >= Thresh.MOBILE_CONFIRM:
                sess.mobile_confirmed  = True
                sess.mobile_alert_ts   = time.time()
                tracker.record(STUDENT_ID, f"Mobile Phone Detected (conf: {conf:.0%})")
        else:
            sess.mobile_conf_run = max(0, sess.mobile_conf_run - 1)
            if sess.mobile_conf_run == 0:
                sess.mobile_confirmed = False
    except Exception as exc:
        log.error(f"YOLO error: {exc}")
    finally:
        sess.yolo_busy = False

# ─── LANDMARK HELPERS ─────────────────────────────────────────────────────
def _ear(face_lm, top: int, bot: int) -> float:
    return abs(face_lm.landmark[top].y - face_lm.landmark[bot].y)

def _yaw_deviation(face_lm) -> float | None:
    nose, left_cheek, right_cheek = face_lm.landmark[1], face_lm.landmark[234], face_lm.landmark[454]
    face_w = right_cheek.x - left_cheek.x
    if face_w < 1e-4: return None
    return abs(0.5 - (nose.x - left_cheek.x) / face_w)

def _pitch_dy(face_lm) -> float:
    return face_lm.landmark[152].y - face_lm.landmark[10].y

# ─── WEBSOCKET ENDPOINT ────────────────────────────────────────────────────
@app.websocket("/ws/attention")
async def attention_ws(websocket: WebSocket):
    await websocket.accept()
    sess = Session()
    log.info("Client connected")

    # ─── INITIALIZE DATABASE FOR THIS SESSION ──────────────────────────────
    db = SessionLocal()
    exam_session = None
    total_score = 0.0
    score_samples = 0
    
    try:
        student_record = db.query(StudentDB).filter(StudentDB.student_id == STUDENT_ROLL_NO).first()
        if not student_record:
            student_record = StudentDB(student_id=STUDENT_ROLL_NO, name=STUDENT_ID)
            db.add(student_record)
            db.commit()
            db.refresh(student_record)

        exam_session = ExamSessionDB(student_id=student_record.id, start_time=datetime.utcnow())
        db.add(exam_session)
        db.commit()
        db.refresh(exam_session)
    except Exception as e:
        log.error(f"Database Initialization Error: {e}")
    # ───────────────────────────────────────────────────────────────────────

    try:
        while True:
            prev_log_count = len(tracker._logs)
            raw = await websocket.receive_text()
            if not raw or "," not in raw:
                # TASK 2 (Backend): Check if the incoming message is a JSON audio alert
                try:
                    payload = json.loads(raw)
                    if isinstance(payload, dict) and payload.get("type") == "audio_alert":
                        volume = payload.get("volume", 0)
                        log.info(f"Audio alert received — volume: {volume}")
                        tracker.record(STUDENT_ID, "High Background Noise / Talking")
                        # Save new incident to DB if session exists
                        curr_log_count = len(tracker._logs)
                        if curr_log_count > prev_log_count and exam_session:
                            new_logs = tracker._logs[prev_log_count:curr_log_count]
                            for nl in new_logs:
                                db.add(IncidentLogDB(
                                    session_id=exam_session.id,
                                    activity=nl["activity"],
                                    timestamp=datetime.utcnow()
                                ))
                            db.commit()
                        continue
                except (json.JSONDecodeError, Exception):
                    pass
                continue

            # TASK 2 (Backend): Also check messages that contain a comma — they could be JSON
            # We attempt JSON parse first before treating as base64 image data
            try:
                payload = json.loads(raw)
                if isinstance(payload, dict) and payload.get("type") == "audio_alert":
                    volume = payload.get("volume", 0)
                    log.info(f"Audio alert received — volume: {volume}")
                    tracker.record(STUDENT_ID, "High Background Noise / Talking")
                    # Save new incident to DB if session exists
                    curr_log_count = len(tracker._logs)
                    if curr_log_count > prev_log_count and exam_session:
                        new_logs = tracker._logs[prev_log_count:curr_log_count]
                        for nl in new_logs:
                            db.add(IncidentLogDB(
                                session_id=exam_session.id,
                                activity=nl["activity"],
                                timestamp=datetime.utcnow()
                            ))
                        db.commit()
                    continue
            except (json.JSONDecodeError, Exception):
                # Not JSON — proceed with base64 image decoding as normal
                pass

            try:
                encoded = raw.split(",", 1)[1]
                arr     = np.frombuffer(base64.b64decode(encoded), np.uint8)
                frame   = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            except Exception:
                continue
            if frame is None: continue

            sess.frame_count += 1
            now = time.time()
            target_score, student_state, instant_drop = 98.0, "Highly Focused", False

            if sess.frame_count % Thresh.MOBILE_INTERVAL == 0 and not sess.yolo_busy:
                asyncio.create_task(_async_phone_check(frame.copy(), sess))

            mobile_active = (now - sess.mobile_alert_ts) < Thresh.MOBILE_HOLD_SEC
            rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = face_mesh.process(rgb)

            if mobile_active:
                student_state, target_score, instant_drop = "Mobile Phone Detected", 10.0, True
            elif result.multi_face_landmarks:
                # TASK 1: Multi-face detection — if more than 1 face found, trigger proxy alert
                if len(result.multi_face_landmarks) > 1:
                    student_state = "Multiple Persons Detected (Proxy Alert)"
                    target_score  = 0.0
                    instant_drop  = True
                    tracker.record(STUDENT_ID, "Multiple persons detected in frame")
                else:
                    # Only 1 face — continue with existing EAR and Yaw logic normally
                    sess.last_face_ts = now
                    face = result.multi_face_landmarks[0]
                    avg_ear = (_ear(face, 159, 145) + _ear(face, 386, 374)) / 2.0

                    if avg_ear < Thresh.EAR_SLEEP:
                        if sess.eyes_closed_since is None: sess.eyes_closed_since = now
                        elapsed = now - sess.eyes_closed_since
                        if elapsed >= Thresh.EAR_SLEEP_SEC:
                            student_state, target_score, instant_drop = "Sleeping", 5.0, True
                            tracker.record(STUDENT_ID, "Student fell asleep")
                        elif elapsed >= Thresh.EAR_DROWSY_SEC:
                            student_state, target_score, instant_drop = "Drowsy / Eyes Closing", 35.0, True
                    else:
                        sess.eyes_closed_since = None
                        pitch = _pitch_dy(face)
                        yaw   = _yaw_deviation(face)

                        if pitch < Thresh.PITCH_MIN:
                            student_state, target_score = "Head Down", 50.0
                        elif yaw is None:
                            student_state, target_score = "Focused", 80.0
                        elif yaw <= Thresh.YAW_FOCUSED:
                            student_state, target_score = "Highly Focused", random.uniform(97.0, 100.0)
                        elif yaw > Thresh.YAW_DISTRACTED:
                            student_state, target_score = "Looking Away", random.uniform(20.0, 35.0)
                            tracker.record(STUDENT_ID, "Looking away from screen")
                        else:
                            pct = (yaw - Thresh.YAW_FOCUSED) / (Thresh.YAW_DISTRACTED - Thresh.YAW_FOCUSED)
                            raw_score = 97.0 - pct * 65.0 + random.uniform(-1.0, 1.0)
                            target_score = max(30.0, raw_score)
                            student_state = "Focused" if target_score > 70 else "Distracted"
            else:
                if now - sess.last_face_ts > Thresh.NO_FACE_SEC:
                    student_state, target_score, instant_drop = "User Not Detected", 0.0, True
                    tracker.record(STUDENT_ID, "Left the screen")

            if instant_drop:
                sess.score = target_score
            else:
                sess.score = (Thresh.EMA_ALPHA * target_score + (1.0 - Thresh.EMA_ALPHA) * sess.score)

            final_score = int(max(0, min(100, sess.score)))

            # ─── SAVE LOGS TO DATABASE ────────────────────────────────────
            total_score += final_score
            score_samples += 1

            curr_log_count = len(tracker._logs)
            if curr_log_count > prev_log_count and exam_session:
                new_logs = tracker._logs[prev_log_count:curr_log_count]
                for nl in new_logs:
                    db.add(IncidentLogDB(
                        session_id=exam_session.id,
                        activity=nl["activity"],
                        timestamp=datetime.utcnow()
                    ))
                db.commit()
            # ──────────────────────────────────────────────────────────────

            await websocket.send_json({
                "focus_score":   final_score,
                "student_state": student_state,
                "incident_logs": tracker.recent(5),
            })

    except WebSocketDisconnect:
        log.info("Client disconnected")
    except Exception as exc:
        log.error(f"Unhandled error: {exc}")
    finally:
        # ─── FINALIZE EXAM SESSION IN DATABASE ─────────────────────────────
        if exam_session:
            if score_samples > 0:
                exam_session.average_score = total_score / score_samples
            exam_session.end_time = datetime.utcnow()
            db.commit()
        db.close()
        # ───────────────────────────────────────────────────────────────────

# ─── HEALTH CHECK ─────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status":    "ok",
        "yolo":      yolo_model is not None,
        "mediapipe": True,
    }

# ─── ENTRY POINT ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    log.info(f"Starting ProctorIQ  backend on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)