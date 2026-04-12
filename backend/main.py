import cv2
import asyncio
import base64
import logging
import time
import uvicorn
import os
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# 🚀 THE "BULLETPROOF" IMPORT LOGIC
try:
    import mediapipe as mp
    if hasattr(mp, 'solutions'):
        mp_face_mesh = mp.solutions.face_mesh
    else:
        import mediapipe.python.solutions.face_mesh as mp_face_mesh
except Exception:
    import mediapipe.python.solutions.face_mesh as mp_face_mesh

# Logging Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NeuroLearn_Engine")

app = FastAPI()
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# AI Models Initialization
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1, 
    refine_landmarks=True, 
    min_detection_confidence=0.7, 
    min_tracking_confidence=0.7
)

class AIState:
    def __init__(self):
        self.current_score = 100.0
        self.last_face_time = time.time()
        self.alpha = 0.2  # Smoothing factor for stability

state_manager = AIState()

async def get_ai_feedback(websocket: WebSocket):
    try:
        while True:
            # 1. Receive Image from Frontend
            data = await websocket.receive_text()
            
            # Decode base64 to OpenCV frame
            encoded_data = data.split(',')[1] if ',' in data else data
            nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                continue

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)
            
            target_score = 0 # Default: Blackout
            current_status = "System Locked"

            if results.multi_face_landmarks:
                state_manager.last_face_time = time.time()
                face = results.multi_face_landmarks[0]
                
                # Fetching key landmarks
                nose = face.landmark[1]
                left = face.landmark[234]
                right = face.landmark[454]
                top = face.landmark[10]
                bottom = face.landmark[152]
                
                # Yaw & Pitch Logic
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
                # BLACKOUT LOGIC
                if time.time() - state_manager.last_face_time > 1.5:
                    target_score = 0
                    current_status = "User Not Detected"
                else:
                    target_score = 45 
                    current_status = "Searching Face..."

            # Apply Exponential Moving Average (EMA) Smoothing
            state_manager.current_score = (state_manager.alpha * target_score) + ((1 - state_manager.alpha) * state_manager.current_score)
            
            final_score = int(state_manager.current_score)
            if final_score < 3: final_score = 0

            # Encode frame for UI Monitor
            thumb = cv2.resize(frame, (160, 120))
            _, buffer = cv2.imencode('.jpg', thumb, [cv2.IMWRITE_JPEG_QUALITY, 35])
            b64_img = base64.b64encode(buffer).decode('utf-8')

            # Send data back to Vercel
            await websocket.send_json({
                "focus_score": final_score, 
                "student_state": current_status, 
                "frame": b64_img
            })
            
    except WebSocketDisconnect:
        logger.info("🔌 Client Disconnected.")
    except Exception as e:
        logger.error(f"Error: {e}")

@app.websocket("/ws/attention")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("🌐 Connection Established.")
    try:
        await get_ai_feedback(websocket)
    except Exception:
        logger.info("🔌 Socket Disconnected.")

if __name__ == "__main__":
    # Railway environment variable se PORT uthata hai
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)