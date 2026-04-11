import cv2
import asyncio
import base64
import logging
import time
import uvicorn
import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# 🚀 THE "BULLETPROOF" IMPORT LOGIC
try:
    import mediapipe as mp
    # Trying different import paths for solutions
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
    cap = cv2.VideoCapture(0)
    # Clear internal buffer for zero-lag
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1) 
    
    try:
        while True:
            success, frame = cap.read()
            if not success or frame is None:
                await asyncio.sleep(0.01)
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
                
                # 1. Yaw Logic (Horizontal Focus)
                width = right.x - left.x
                center_ratio = (nose.x - left.x) / width if width > 0 else 0.5
                yaw_deviation = abs(0.5 - center_ratio)
                
                # 2. Pitch Logic (Mobile Detection)
                pitch_ratio = bottom.y - top.y
                
                # Logic Engine
                if pitch_ratio < 0.28: # Looking down at phone
                    target_score = 15
                    current_status = "Mobile Usage Detected"
                elif yaw_deviation < 0.15: # Focused straight
                    target_score = 98
                    current_status = "Highly Focused"
                elif yaw_deviation < 0.30: # Distracted
                    target_score = 65
                    current_status = "Distracted"
                else: # Looking away
                    target_score = 5
                    current_status = "Focus Lost"
            else:
                # 🌑 BLACKOUT LOGIC (1.5s Sabar)
                if time.time() - state_manager.last_face_time > 1.5:
                    target_score = 0
                    current_status = "User Not Detected"
                else:
                    target_score = 45 
                    current_status = "Searching Face..."

            # Apply Exponential Moving Average (EMA) Smoothing
            # Formula: $F_{t} = \alpha \cdot F_{target} + (1 - \alpha) \cdot F_{t-1}$
            state_manager.current_score = (state_manager.alpha * target_score) + ((1 - state_manager.alpha) * state_manager.current_score)
            
            final_score = int(state_manager.current_score)
            if final_score < 3: final_score = 0

            # Encode frame for UI Monitor
            thumb = cv2.resize(frame, (160, 120))
            _, buffer = cv2.imencode('.jpg', thumb, [cv2.IMWRITE_JPEG_QUALITY, 35])
            b64_img = base64.b64encode(buffer).decode('utf-8')

            try:
                await websocket.send_json({
                    "focus_score": final_score, 
                    "student_state": current_status, 
                    "frame": b64_img
                })
            except:
                break 

            await asyncio.sleep(0.04) # ~25 FPS delivery
            
    finally:
        cap.release()

@app.websocket("/ws/attention")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("🌐 Connection Established.")
    try:
        await get_ai_feedback(websocket)
    except Exception:
        logger.info("🔌 Socket Disconnected.")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)