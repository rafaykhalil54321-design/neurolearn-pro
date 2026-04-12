import cv2, base64, time, uvicorn, os, numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import mediapipe as mp

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ─── MediaPipe Setup ───────────────────────────────────────────────
face_mesh = mp.solutions.face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,          # ← iris landmarks bhi milenge
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# ─── Helper Functions ──────────────────────────────────────────────

def get_ear(landmarks, eye_indices):
    """Eye Aspect Ratio - aankhein band hain ya khuli"""
    # Vertical distances
    A = np.linalg.norm(
        np.array([landmarks[eye_indices[1]].x, landmarks[eye_indices[1]].y]) -
        np.array([landmarks[eye_indices[5]].x, landmarks[eye_indices[5]].y])
    )
    B = np.linalg.norm(
        np.array([landmarks[eye_indices[2]].x, landmarks[eye_indices[2]].y]) -
        np.array([landmarks[eye_indices[4]].x, landmarks[eye_indices[4]].y])
    )
    # Horizontal distance
    C = np.linalg.norm(
        np.array([landmarks[eye_indices[0]].x, landmarks[eye_indices[0]].y]) -
        np.array([landmarks[eye_indices[3]].x, landmarks[eye_indices[3]].y])
    )
    if C == 0:
        return 0
    return (A + B) / (2.0 * C)

def get_head_pose(face):
    """
    Estimate head tilt using nose tip and chin.
    Returns: pitch (up/down), yaw (left/right)
    """
    nose_tip   = face[1]       # Naak ka tip
    chin       = face[152]     # Thodi
    forehead   = face[10]      # Maatha
    left_ear   = face[234]     # Bayan kaan
    right_ear  = face[454]     # Seedha kaan

    # Pitch: sar aage/peechhe jhuka hai
    pitch = chin.y - forehead.y          # Normal ~0.35-0.45

    # Yaw: sar left/right ghuma hai
    yaw = left_ear.x - right_ear.x      # Normal ~0.35-0.5

    return pitch, yaw

def calculate_score(pitch, yaw, avg_ear, face_visible):
    """
    Score 0-100 calculate karo different factors se
    """
    if not face_visible:
        return 0, "User Not Detected ❌"

    deductions = 0
    reasons = []

    # ── 1. Eyes Check (EAR) ────────────────────────
    # Normal EAR ~ 0.25+, Blink ke waqt 0.15 se kam
    EAR_THRESHOLD = 0.18
    if avg_ear < EAR_THRESHOLD:
        deductions += 50
        reasons.append("Eyes Closed/Drowsy 😴")

    # ── 2. Pitch Check (Sar niche ya upar) ─────────
    # Normal pitch 0.35 - 0.48
    if pitch < 0.28:
        deductions += 40
        reasons.append("Looking Down (Mobile?) 📱")
    elif pitch > 0.52:
        deductions += 20
        reasons.append("Looking Up 👆")

    # ── 3. Yaw Check (Sar left/right ghuma) ────────
    # Normal yaw 0.30 - 0.55
    if yaw < 0.20:
        deductions += 30
        reasons.append("Looking Right ➡️")
    elif yaw > 0.65:
        deductions += 30
        reasons.append("Looking Left ⬅️")

    score = max(0, 100 - deductions)

    # State determine karo
    if score >= 80:
        state = "Focused ✅"
    elif score >= 50:
        state = "Distracted ⚠️ | " + " | ".join(reasons) if reasons else "Slightly Distracted ⚠️"
    elif score >= 20:
        state = "Unfocused ❗ | " + " | ".join(reasons)
    else:
        state = "Not Paying Attention 🚫 | " + " | ".join(reasons)

    return score, state


# MediaPipe eye landmark indices
LEFT_EYE  = [362, 385, 387, 263, 373, 380]
RIGHT_EYE = [33,  160, 158, 133, 153, 144]

# ─── Routes ────────────────────────────────────────────────────────

@app.get("/")
def health():
    return {"status": "AI Engine is Online ✅"}


@app.websocket("/ws/attention")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🚀 CONNECTION ESTABLISHED - RECEIVING FRAMES...")

    while True:
        try:
            data = await websocket.receive_text()
            if not data or ',' not in data:
                continue

            # ── Decode Image ───────────────────────────────────────
            encoded = data.split(',')[1]
            raw     = base64.b64decode(encoded)
            nparr   = np.frombuffer(raw, np.uint8)
            img     = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                continue

            # ── AI Processing ──────────────────────────────────────
            rgb     = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)

            score = 0
            state = "User Not Detected ❌"

            if results.multi_face_landmarks:
                face = results.multi_face_landmarks[0].landmark

                # Calculations
                pitch, yaw = get_head_pose(face)
                left_ear   = get_ear(face, LEFT_EYE)
                right_ear  = get_ear(face, RIGHT_EYE)
                avg_ear    = (left_ear + right_ear) / 2.0

                score, state = calculate_score(pitch, yaw, avg_ear, face_visible=True)

                print(
                    f"✅ FACE | Score: {score}% | EAR: {avg_ear:.3f} | "
                    f"Pitch: {pitch:.3f} | Yaw: {yaw:.3f} | {state}"
                )
            else:
                print("❌ NO FACE IN FRAME")

            # ── Send Response ──────────────────────────────────────
            await websocket.send_json({
                "focus_score":   score,
                "student_state": state
            })

        except WebSocketDisconnect:
            print("🔌 Connection Closed by User")
            break
        except Exception as e:
            print(f"⚠️ Error: {e}")
            continue


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 8000)),
        proxy_headers=True,
        forwarded_allow_ips="*"
    )