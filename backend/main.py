"""
ProctorIQ — Cognitive Attention Backend
FastAPI + MediaPipe + YOLOv8 | Professional Edition
"""

import cv2
import base64
import time
import asyncio
import random
import os
import logging

import numpy as np
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# ─── LOGGING ───────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
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
face_mesh = _mp_face.FaceMesh(
    max_num_faces=1,
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
    """Deduplicates incidents within a cooldown window."""

    COOLDOWN = 5.0  # seconds

    def __init__(self):
        self._logs: list[dict] = []

    def record(self, student: str, activity: str) -> None:
        now = time.time()
        if self._logs:
            last = self._logs[-1]
            if last["activity"] == activity and (now - last["_ts"] < self.COOLDOWN):
                return
        self._logs.append({
            "time":     time.strftime("%H:%M:%S"),
            "student":  student,
            "activity": activity,
            "_ts":      now,
        })
        log.info(f"INCIDENT [{student}] → {activity}")

    def recent(self, n: int = 5) -> list[dict]:
        """Return the last n logs, without private keys."""
        return [
            {k: v for k, v in entry.items() if not k.startswith("_")}
            for entry in self._logs[-n:]
        ]

tracker = IncidentTracker()

# ─── SESSION STATE ─────────────────────────────────────────────────────────
class Session:
    """Per-connection mutable state. One instance per WS client."""

    def __init__(self):
        self.frame_count: int     = 0
        self.last_face_ts: float  = time.time()

        # Sleep tracking
        self.eyes_closed_since: float | None = None

        # Score
        self.score: float = 100.0

        # Mobile detection
        self.yolo_busy: bool      = False
        self.mobile_alert_ts: float = 0.0
        self.mobile_conf_run: int  = 0
        self.mobile_confirmed: bool = False

# ─── MOBILE DETECTION ─────────────────────────────────────────────────────
def _detect_phone(img: np.ndarray) -> tuple[bool, float]:
    """
    Run YOLOv8 with a two-pass strategy for better recall on phones.
    Returns (detected, best_confidence).
    """
    if yolo_model is None:
        return False, 0.0

    best = 0.0

    # Pass 1 — 320 px scan
    for r in yolo_model(img, classes=[67], conf=Thresh.MOBILE_CONF, verbose=False, imgsz=320):
        for box in r.boxes:
            c = float(box.conf[0])
            if c > best:
                best = c

    # Pass 2 — full-res scan only when pass 1 missed (saves compute)
    if best == 0.0:
        h, w = img.shape[:2]
        big = cv2.resize(img, (640, int(640 * h / w))) if w < 600 else img
        for r in yolo_model(big, classes=[67], conf=Thresh.MOBILE_LOW_CONF, verbose=False, imgsz=640):
            for box in r.boxes:
                c = float(box.conf[0])
                if c > best:
                    best = c

    return best >= Thresh.MOBILE_CONF, best


async def _async_phone_check(img: np.ndarray, sess: Session) -> None:
    """Offload YOLO to thread pool; update session state with confirmation logic."""
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
    """Normalised vertical eye aperture for one eye."""
    return abs(face_lm.landmark[top].y - face_lm.landmark[bot].y)


def _yaw_deviation(face_lm) -> float | None:
    """Nose-to-cheek ratio deviation from 0.5 (centre). None if face_width≈0."""
    nose        = face_lm.landmark[1]
    left_cheek  = face_lm.landmark[234]
    right_cheek = face_lm.landmark[454]
    face_w = right_cheek.x - left_cheek.x
    if face_w < 1e-4:
        return None
    return abs(0.5 - (nose.x - left_cheek.x) / face_w)


def _pitch_dy(face_lm) -> float:
    """Vertical chin-to-forehead distance (small = head tilted down)."""
    return face_lm.landmark[152].y - face_lm.landmark[10].y

# ─── WEBSOCKET ENDPOINT ────────────────────────────────────────────────────
@app.websocket("/ws/attention")
async def attention_ws(websocket: WebSocket):
    await websocket.accept()
    sess = Session()
    log.info("Client connected")

    try:
        while True:
            raw = await websocket.receive_text()
            if not raw or "," not in raw:
                continue

            # ── Decode JPEG frame ──────────────────────────────────────────
            try:
                encoded = raw.split(",", 1)[1]
                arr     = np.frombuffer(base64.b64decode(encoded), np.uint8)
                frame   = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            except Exception:
                continue
            if frame is None:
                continue

            sess.frame_count += 1
            now = time.time()

            target_score    = 98.0
            student_state   = "Highly Focused"
            instant_drop    = False

            # ── 1. Mobile detection (async, every N frames) ───────────────
            if sess.frame_count % Thresh.MOBILE_INTERVAL == 0 and not sess.yolo_busy:
                asyncio.create_task(_async_phone_check(frame.copy(), sess))

            mobile_active = (now - sess.mobile_alert_ts) < Thresh.MOBILE_HOLD_SEC

            # ── 2. Face mesh analysis ─────────────────────────────────────
            rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = face_mesh.process(rgb)

            if mobile_active:
                # Mobile takes priority — hard override
                student_state = "Mobile Phone Detected"
                target_score  = 10.0
                instant_drop  = True

            elif result.multi_face_landmarks:
                sess.last_face_ts = now
                face = result.multi_face_landmarks[0]

                # ── Eye Aspect Ratio (EAR) ─────────────────────────────
                avg_ear = (_ear(face, 159, 145) + _ear(face, 386, 374)) / 2.0

                if avg_ear < Thresh.EAR_SLEEP:
                    # Eyes are closed — start / continue timer
                    if sess.eyes_closed_since is None:
                        sess.eyes_closed_since = now
                    elapsed = now - sess.eyes_closed_since

                    if elapsed >= Thresh.EAR_SLEEP_SEC:
                        student_state = "Sleeping"
                        target_score  = 5.0
                        instant_drop  = True
                        tracker.record(STUDENT_ID, "Student fell asleep")

                    elif elapsed >= Thresh.EAR_DROWSY_SEC:
                        student_state = "Drowsy / Eyes Closing"
                        target_score  = 35.0
                        instant_drop  = True

                else:
                    # Eyes open — reset sleep timer
                    sess.eyes_closed_since = None

                    # ── Head pose ──────────────────────────────────────
                    pitch = _pitch_dy(face)
                    yaw   = _yaw_deviation(face)

                    if pitch < Thresh.PITCH_MIN:
                        student_state = "Head Down"
                        target_score  = 50.0

                    elif yaw is None:
                        student_state = "Focused"
                        target_score  = 80.0

                    elif yaw <= Thresh.YAW_FOCUSED:
                        student_state = "Highly Focused"
                        target_score  = random.uniform(97.0, 100.0)

                    elif yaw > Thresh.YAW_DISTRACTED:
                        student_state = "Looking Away"
                        target_score  = random.uniform(20.0, 35.0)
                        tracker.record(STUDENT_ID, "Looking away from screen")

                    else:
                        # Gradual degradation between focused and distracted
                        pct           = (yaw - Thresh.YAW_FOCUSED) / (Thresh.YAW_DISTRACTED - Thresh.YAW_FOCUSED)
                        raw_score     = 97.0 - pct * 65.0 + random.uniform(-1.0, 1.0)
                        target_score  = max(30.0, raw_score)
                        student_state = "Focused" if target_score > 70 else "Distracted"

            else:
                # No face landmarks
                if now - sess.last_face_ts > Thresh.NO_FACE_SEC:
                    student_state = "User Not Detected"
                    target_score  = 0.0
                    instant_drop  = True
                    tracker.record(STUDENT_ID, "Left the screen")

            # ── 3. Score EMA smoothing ────────────────────────────────────
            if instant_drop:
                sess.score = target_score
            else:
                sess.score = (
                    Thresh.EMA_ALPHA * target_score
                    + (1.0 - Thresh.EMA_ALPHA) * sess.score
                )

            final_score = int(max(0, min(100, sess.score)))

            # ── 4. Send response ──────────────────────────────────────────
            await websocket.send_json({
                "focus_score":   final_score,
                "student_state": student_state,
                "incident_logs": tracker.recent(5),
            })

    except WebSocketDisconnect:
        log.info("Client disconnected")
    except Exception as exc:
        log.error(f"Unhandled error: {exc}")


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