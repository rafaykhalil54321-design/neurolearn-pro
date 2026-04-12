import cv2
import base64
import time
import uvicorn
import os
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# ==========================================
# 🛑 ULTRA-SAFE MEDIAPIPE IMPORT
# ==========================================
try:
    import mediapipe as mp
    mp_face_mesh = mp.solutions.face_mesh
except Exception as e:
    print(f"⚠️ Import Warning: {e}")

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

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"]
)

class AIState:
    def __init__(self):
        self.current_score = 100.0
        self.last_face_time = time.time()
        self.alpha = 0.2 

state_manager = AIState()

@app.get("/")
def health_check():
    return {"status": "AI Engine is Online on Railway ✅"}

@app.websocket("/ws/attention")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🌐 Vercel Connected to Railway AI Engine!")
    
    while True:
        try:
            # 1. Receive Image Frame
            data = await websocket.receive_text()
            
            # 2. Decode Base64 Image safely
            if not data or ',' not in data:
                continue # 🛑 KHARAB FRAME KO IGNORE KARO, CONNECTION MAT TORO
                
            encoded_data = data.split(',')[1]
            nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                continue # 🛑 FRAME KHALI HAI TOH IGNORE KARO

            if face_mesh is None:
                continue

            # 3. Process with AI Model
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)
            
            target_score = 0
            current_status = "System Locked"

            if results.multi_face_landmarks:
                state_manager.last_face_time = time.time()
                face = results.multi_face_landmarks[0]
                
                nose = face.landmark[1]
                left = face.landmark[234]
                right = face.landmark[454]
                top = face.landmark[10]
                bottom = face.landmark[152]
                
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

            # 4. Smoothing Logic
            state_manager.current_score = (state_manager.alpha * target_score) + ((1 - state_manager.alpha) * state_manager.current_score)
            final_score = int(state_manager.current_score)
            if final_score < 3: final_score = 0

            # 5. Send Results Back
            await websocket.send_json({
                "focus_score": final_score, 
                "student_state": current_status, 
                "frame": data 
            })
            
        except WebSocketDisconnect:
            print("🔌 Vercel Disconnected (Tab Closed)")
            break # 🛑 SIRF TAB BAND HONE PAR CONNECTION CLOSE KARO
        except Exception as e:
            print(f"⚠️ Chota sa Error (Ignoring): {e}")
            continue # 🛑 KISI BHI ERROR PAR AGLA FRAME CHECK KARO, CONNECTION MAT TORO

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, proxy_headers=True, forwarded_allow_ips="*")