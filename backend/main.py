import cv2
import base64
import time
import uvicorn
import os
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

try:
    import mediapipe as mp
    import mediapipe.python.solutions.face_mesh as mp_face_mesh
    face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)
except Exception as e:
    print(f"Model Init Error: {e}")
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
        self.alpha = 0.5 

state_manager = AIState()

@app.get("/")
def health_check():
    return {"status": "AI Engine is Online ✅"}

@app.websocket("/ws/attention")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    while True:
        try:
            data = await websocket.receive_text()
            if not data or ',' not in data: continue
            if face_mesh is None: continue
                
            encoded_data = data.split(',')[1]
            nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None: continue

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
                
                # 🚀 SCALE-INVARIANT MATH (Faslay ka asar khatam - UNTOUCHED)
                face_width = right.x - left.x
                face_height = bottom.y - top.y
                
                if face_width > 0 and face_height > 0:
                    yaw_ratio = (nose.x - left.x) / face_width
                    pitch_ratio = (nose.y - top.y) / face_height
                    
                    yaw_deviation = abs(0.5 - yaw_ratio)
                    
                    if pitch_ratio > 0.65: 
                        target_score = 15
                        current_status = "Mobile Usage Detected"
                    elif yaw_deviation > 0.18: 
                        target_score = 45
                        current_status = "Distracted"
                    else: 
                        target_score = 98
                        current_status = "Highly Focused"
                else:
                    target_score = 98
                    current_status = "Highly Focused"

            else:
                if time.time() - state_manager.last_face_time > 1.5:
                    target_score = 0
                    current_status = "User Not Detected"
                else:
                    target_score = 45 
                    current_status = "Searching Face..."

            # Smoothing
            state_manager.current_score = (state_manager.alpha * target_score) + ((1 - state_manager.alpha) * state_manager.current_score)
            final_score = int(state_manager.current_score)

            # 🚀 SIRF YEH LINE ADD HAI CAMERA KE LIYE 
            await websocket.send_json({
                "focus_score": final_score, 
                "student_state": current_status,
                "frame": data
            })
            
        except WebSocketDisconnect:
            break
        except Exception:
            continue

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, proxy_headers=True, forwarded_allow_ips="*")