import cv2
import base64
import time
import uvicorn
import os
import numpy as np
import sys
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

# ==========================================
# 🛑 MEDIAPIPE IMPORT (Python 3.14+ Fix)
# ==========================================
try:
    import mediapipe as mp
    if hasattr(mp, 'solutions'):
        mp_face_mesh = mp.solutions.face_mesh
    else:
        import mediapipe.python.solutions.face_mesh as mp_face_mesh
except Exception as e:
    print(f"⚠️ Import Warning: {e}")
    try:
        import mediapipe.solutions.face_mesh as mp_face_mesh
    except:
        print("❌ CRITICAL: Mediapipe is failing due to Python 3.14 architecture.")
        print("💡 FIX FOR COMPEC: Please downgrade to Python 3.11 for stable AI models.")
        sys.exit(1)

# Initialize AI Model safely
try:
    face_mesh = mp_face_mesh.FaceMesh(
        max_num_faces=1, 
        refine_landmarks=True, 
        min_detection_confidence=0.5, 
        min_tracking_confidence=0.5
    )
except Exception as e:
    print(f"❌ Model Init Failed: {e}")
    face_mesh = None

app = FastAPI()

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# AI State Management
class AIState:
    def __init__(self):
        self.current_score = 100.0
        self.last_face_time = time.time()
        self.alpha = 0.2 

state_manager = AIState()

@app.get("/")
def health_check():
    return {"status": "alive"}

@app.websocket("/ws/attention")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🌐 WebSocket Connected to Dashboard!")
    try:
        while True:
            data = await websocket.receive_text()
            
            # Decode Image
            try:
                encoded_data = data.split(',')[1] if ',' in data else data
                nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            except Exception:
                continue

            if frame is None:
                continue

            # Check if model loaded properly
            if face_mesh is None:
                await websocket.send_json({
                    "focus_score": 0, 
                    "student_state": "Python 3.14 Model Error ❌", 
                    "frame": data
                })
                continue

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)
            
            target_score = 0
            current_status = "System Locked"

            if results.multi_face_landmarks:
                state_manager.last_face_time = time.time()
                face = results.multi_face_landmarks[0]
                
                # Extract Landmarks
                nose = face.landmark[1]
                left = face.landmark[234]
                right = face.landmark[454]
                top = face.landmark[10]
                bottom = face.landmark[152]
                
                # Math Logic for Head Pose
                width = right.x - left.x
                center_ratio = (nose.x - left.x) / width if width > 0 else 0.5
                yaw_deviation = abs(0.5 - center_ratio)
                pitch_ratio = bottom.y - top.y
                
                if pitch_ratio < 0.28: 
                    target_score = 15
                    current_status = "Mobile Usage Detected"
                elif yaw_deviation < 0.15: 
                    target_score = 98
                    current_status = "Highly Focused"
                elif yaw_deviation < 0.30: 
                    target_score = 65
                    current_status = "Distracted"
                else: 
                    target_score = 5
                    current_status = "Focus Lost"
            else:
                if time.time() - state_manager.last_face_time > 1.5:
                    target_score = 0
                    current_status = "User Not Detected"
                else:
                    target_score = 45 
                    current_status = "Searching Face..."

            # Apply EMA Smoothing
            state_manager.current_score = (state_manager.alpha * target_score) + ((1 - state_manager.alpha) * state_manager.current_score)
            final_score = int(state_manager.current_score)
            if final_score < 3: final_score = 0

            # Send back to Frontend
            await websocket.send_json({
                "focus_score": final_score, 
                "student_state": current_status, 
                "frame": data 
            })
            
    except Exception as e:
        print(f"Socket Error: {e}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)