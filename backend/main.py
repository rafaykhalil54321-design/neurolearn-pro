import cv2, base64, time, uvicorn, os, numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import mediapipe as mp

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# AI Model - Minimal Setup for Speed
face_mesh = mp.solutions.face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    min_detection_confidence=0.5
)

@app.get("/")
def health(): return {"status": "AI Engine is Online ✅"}

@app.websocket("/ws/attention")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("🚀 CONNECTION ESTABLISHED - RECEIVING FRAMES...")
    
    while True:
        try:
            data = await websocket.receive_text()
            if not data or ',' not in data: continue
            
            # Decode Image
            encoded = data.split(',')[1]
            raw = base64.b64decode(encoded)
            nparr = np.frombuffer(raw, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None: continue

            # AI Processing
            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)
            
            # Default Values
            score = 0
            state = "User Not Detected"

            if results.multi_face_landmarks:
                # Agar face mil gaya, toh logic check karo
                face = results.multi_face_landmarks[0].landmark
                
                # Simple Detection: Pitch (Sar niche hai ya nahi)
                # landmark 10 (top) and 152 (bottom)
                pitch = face[152].y - face[10].y
                
                if pitch < 0.30: 
                    score = 10
                    state = "Mobile Usage (Looking Down)"
                else:
                    score = 100
                    state = "Focused"
                
                # 📢 RAILWAY LOGS MEIN YE NAZAR AAYEGA
                print(f"✅ FACE SEEN | Score: {score}% | Status: {state}")
            else:
                print("❌ NO FACE IN FRAME")

            # Send back to Frontend (NO SMOOTHING - INSTANT)
            await websocket.send_json({
                "focus_score": score, 
                "student_state": state
            })
            
        except WebSocketDisconnect:
            print("🔌 Connection Closed by User")
            break
        except Exception as e:
            print(f"⚠️ Error: {e}")
            continue

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), proxy_headers=True, forwarded_allow_ips="*")