import cv2, base64, time, uvicorn, os, numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import mediapipe as mp

# AI Setup
try:
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True)
except:
    face_mesh = None

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class AIState:
    def __init__(self):
        self.current_score = 100.0
        self.last_face_time = time.time()
        self.alpha = 0.5 # 🚀 Score ab teizi se upar-niche jaye ga

state_manager = AIState()

@app.get("/")
def health(): return {"status": "AI Engine Online"}

@app.websocket("/ws/attention")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("✅ Dashboard Linked!")
    while True:
        try:
            data = await websocket.receive_text()
            if not data or ',' not in data: continue
            
            # Decode
            raw = base64.b64decode(data.split(',')[1])
            img = cv2.imdecode(np.frombuffer(raw, np.uint8), 1)
            if img is None: continue

            # AI Logic
            res = face_mesh.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
            target_score, status = 0, "User Not Detected"

            if res.multi_face_landmarks:
                state_manager.last_face_time = time.time()
                f = res.multi_face_landmarks[0].landmark
                
                # Landmarks (Nose, Left, Right, Top, Bottom)
                n, l, r, t, b = f[1], f[234], f[454], f[10], f[152]
                
                # Math Logic (Yaw & Pitch)
                yaw = abs(0.5 - ((n.x - l.x) / (r.x - l.x) if (r.x - l.x) > 0 else 0.5))
                pitch = b.y - t.y
                
                # 🛑 SENSITIVE THRESHOLDS
                if pitch < 0.31: # Niche dekhne par teizi se girega
                    target_score, status = 10, "Mobile Usage"
                elif yaw > 0.12: # Side par dekhne par girega
                    target_score, status = 35, "Distracted"
                else:
                    target_score, status = 100, "Highly Focused"
            else:
                if time.time() - state_manager.last_face_time > 1.0:
                    target_score, status = 0, "System Locked"

            # Smoothing
            state_manager.current_score = (state_manager.alpha * target_score) + ((1 - state_manager.alpha) * state_manager.current_score)
            final = int(state_manager.current_score)
            
            # 🚀 Logs mein score check karne ke liye
            print(f"📊 Live Score: {final}% | {status}")

            await websocket.send_json({"focus_score": final, "student_state": status})
            
        except WebSocketDisconnect: break
        except: continue

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), proxy_headers=True, forwarded_allow_ips="*")