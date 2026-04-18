import cv2
import base64
import time
import asyncio
import random
import os
import numpy as np
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import mediapipe as mp

# ─── YOLO MOBILE DETECTION ─────────────────────────────────────────────────
try:
    from ultralytics import YOLO
    print("[INFO] Loading YOLOv8 Nano for Mobile Detection...")
    yolo_model = YOLO("yolov8n.pt")
    print("[INFO] YOLOv8 Loaded OK")
except Exception as e:
    print(f"[WARN] YOLO not available: {e}")
    yolo_model = None

# ─── MEDIAPIPE FACE MESH ───────────────────────────────────────────────────
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    # Yahan Vercel ka live link add kar diya gaya hai
    allow_origins=["https://neurolearn-pro.vercel.app", "*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ─── INCIDENT TRACKER ──────────────────────────────────────────────────────
class IncidentTracker:
    def __init__(self):
        self.logs = []

    def add_log(self, student_id: str, activity: str):
        now = time.time()
        timestamp = time.strftime("%H:%M:%S")
        # Deduplicate: don't repeat same event within 5 seconds
        if self.logs and self.logs[-1]['activity'] == activity and (now - self.logs[-1]['raw_time'] < 5):
            return
        self.logs.append({
            "time": timestamp,
            "student": student_id,
            "activity": activity,
            "raw_time": now
        })

tracker = IncidentTracker()

# ─── SESSION STATE ─────────────────────────────────────────────────────────
class SessionManager:
    def __init__(self):
        self.frame_count       = 0
        self.last_face_time    = time.time()
        self.sleep_timer       = None
        self.current_score     = 100.0
        self.alpha             = 0.85          # EMA smoothing
        self.yolo_running      = False
        self.mobile_alert_time = 0.0           # last mobile detection timestamp
        self.mobile_conf_count = 0             # consecutive mobile detections
        self.mobile_confirmed  = False         # confirmed after N frames

session = SessionManager()
STUDENT_ID = "Rafay Khalil"

# ─── ENHANCED MOBILE DETECTION ─────────────────────────────────────────────
def run_yolo_mobile(img: np.ndarray) -> tuple[bool, float]:
    """
    Returns (detected: bool, confidence: float).
    Detects class 67 = 'cell phone' with multi-scale strategy.
    Optimised for iOS devices (often glossy/white — lower texture).
    """
    if yolo_model is None:
        return False, 0.0

    best_conf = 0.0

    # Pass 1: standard size
    results = yolo_model(img, classes=[67], conf=0.40, verbose=False, imgsz=320)
    for r in results:
        for box in r.boxes:
            c = float(box.conf[0])
            if c > best_conf:
                best_conf = c

    # Pass 2: if borderline, try full-res (catches small/partially occluded phones)
    if best_conf == 0.0:
        h, w = img.shape[:2]
        big = cv2.resize(img, (640, int(640 * h / w))) if w < 600 else img
        results2 = yolo_model(big, classes=[67], conf=0.35, verbose=False, imgsz=640)
        for r in results2:
            for box in r.boxes:
                c = float(box.conf[0])
                if c > best_conf:
                    best_conf = c

    detected = best_conf >= 0.40
    return detected, best_conf


async def check_mobile_async(img: np.ndarray):
    """Run YOLO in thread pool, update session state with confirmation logic."""
    try:
        session.yolo_running = True
        detected, conf = await asyncio.to_thread(run_yolo_mobile, img)

        if detected:
            session.mobile_conf_count += 1
            # Require 2 consecutive detections to confirm (reduces false positives)
            if session.mobile_conf_count >= 2:
                session.mobile_confirmed  = True
                session.mobile_alert_time = time.time()
                tracker.add_log(STUDENT_ID, f"Mobile Phone Detected (conf: {conf:.0%})")
        else:
            session.mobile_conf_count = max(0, session.mobile_conf_count - 1)
            if session.mobile_conf_count == 0:
                session.mobile_confirmed = False
    except Exception as e:
        print(f"[YOLO ERR] {e}")
    finally:
        session.yolo_running = False


# ─── WEBSOCKET ENDPOINT ────────────────────────────────────────────────────
@app.websocket("/ws/attention")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    while True:
        try:
            data = await websocket.receive_text()
            if not data or ',' not in data:
                continue

            # Decode frame
            encoded = data.split(',')[1]
            nparr   = np.frombuffer(base64.b64decode(encoded), np.uint8)
            frame   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if frame is None:
                continue

            session.frame_count += 1
            now = time.time()

            target_score   = 98.0
            current_status = "Highly Focused"
            instant_drop   = False

            # ── 1. MOBILE DETECTION (every 6 frames, async) ─────────────
            if session.frame_count % 6 == 0 and not session.yolo_running:
                asyncio.create_task(check_mobile_async(frame.copy()))

            # Mobile alert active window: 2.5 s after last detection
            is_mobile_active = (now - session.mobile_alert_time) < 2.5

            # ── 2. FACE MESH ─────────────────────────────────────────────
            rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = face_mesh.process(rgb)

            if is_mobile_active:
                current_status = "Mobile Phone Detected"
                target_score   = 10.0
                instant_drop   = True

            elif result.multi_face_landmarks:
                session.last_face_time = now
                face = result.multi_face_landmarks[0]

                # ── EAR (Eye Aspect Ratio) drowsiness check ─────────────
                ear_l = abs(face.landmark[159].y - face.landmark[145].y)
                ear_r = abs(face.landmark[386].y - face.landmark[374].y)
                avg_ear = (ear_l + ear_r) / 2.0

                SLEEP_THRESHOLD = 0.010

                if avg_ear < SLEEP_THRESHOLD:
                    if not session.sleep_timer:
                        session.sleep_timer = now

                    elapsed = now - session.sleep_timer
                    if elapsed > 10:
                        current_status = "Sleeping Detected"
                        target_score   = 5.0
                        instant_drop   = True
                        tracker.add_log(STUDENT_ID, "Student fell asleep")
                    elif elapsed > 2:
                        current_status = "Drowsy / Eyes Closed"
                        target_score   = 35.0
                        instant_drop   = True
                else:
                    session.sleep_timer = None  # reset immediately on open eyes

                    # ── YAW angle via nose-cheek ratio ───────────────────
                    nose        = face.landmark[1]
                    left_cheek  = face.landmark[234]
                    right_cheek = face.landmark[454]
                    face_width  = right_cheek.x - left_cheek.x

                    if face_width > 0:
                        yaw_ratio     = (nose.x - left_cheek.x) / face_width
                        yaw_deviation = abs(0.5 - yaw_ratio)

                        # ── PITCH check (head tilt down = head-down) ─────
                        chin     = face.landmark[152]
                        forehead = face.landmark[10]
                        pitch_dy = chin.y - forehead.y

                        if pitch_dy < 0.10:
                            current_status = "Head Down"
                            target_score   = 50.0
                        elif yaw_deviation <= 0.06:
                            target_score   = random.uniform(97.0, 100.0)
                            current_status = "Highly Focused"
                        elif yaw_deviation > 0.25:
                            target_score   = random.uniform(20.0, 35.0)
                            current_status = "Looking Away"
                            tracker.add_log(STUDENT_ID, "Looking away from screen")
                        else:
                            pct            = (yaw_deviation - 0.06) / 0.19
                            target_score   = 97.0 - (pct * 65.0) + random.uniform(-1.0, 1.0)
                            current_status = "Focused" if target_score > 70 else "Distracted"

            else:
                # No face detected
                if now - session.last_face_time > 1.5:
                    current_status = "User Not Detected"
                    target_score   = 0.0
                    instant_drop   = True
                    tracker.add_log(STUDENT_ID, "Left the screen")

            # ── 3. SCORE FILTER ──────────────────────────────────────────
            if instant_drop:
                session.current_score = target_score
            else:
                session.current_score = (session.alpha * target_score) + ((1 - session.alpha) * session.current_score)

            final_score = int(max(0, min(100, session.current_score)))

            await websocket.send_json({
                "focus_score":   final_score,
                "student_state": current_status,
                "incident_logs": tracker.logs[-5:]
            })

        except WebSocketDisconnect:
            print("[WS] Client disconnected")
            break
        except Exception as ex:
            print(f"[ERR] {ex}")
            continue


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)