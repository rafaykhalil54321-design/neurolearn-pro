import cv2, base64, uvicorn, os, numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import mediapipe as mp

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ✅ Better FaceMesh Config
mp_face = mp.solutions.face_mesh
face_mesh = mp_face.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,   # 🔥 IMPORTANT
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
)

# 🔥 smoothing variable
prev_score = 100

@app.get("/")
def health():
    return {"status": "AI Engine is Online ✅"}

@app.websocket("/ws/attention")
async def websocket_endpoint(websocket: WebSocket):
    global prev_score
    
    await websocket.accept()
    print("🚀 CONNECTION ESTABLISHED")

    while True:
        try:
            data = await websocket.receive_text()
            if ',' not in data:
                continue

            # Decode Image
            encoded = data.split(',')[1]
            img_bytes = base64.b64decode(encoded)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            if img is None:
                continue

            # Resize for performance
            img = cv2.resize(img, (320, 240))

            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb)

            score = 0
            state = "No Face"

            if results.multi_face_landmarks:
                face = results.multi_face_landmarks[0].landmark

                # 🔥 BETTER HEAD POSE (EYE VS NOSE)
                nose_y = face[1].y
                left_eye_y = face[33].y
                right_eye_y = face[263].y
                eye_avg = (left_eye_y + right_eye_y) / 2

                diff = nose_y - eye_avg

                if diff > 0.08:
                    score = 20
                    state = "Looking Down 📱"
                else:
                    score = 100
                    state = "Focused 🎯"

                # 🔥 SMOOTHING (important)
                score = int((prev_score * 0.7) + (score * 0.3))
                prev_score = score

                print(f"✅ FACE | Score: {score}% | {state}")

            else:
                score = 0
                state = "No Face ❌"
                prev_score = score

            await websocket.send_json({
                "focus_score": score,
                "student_state": state
            })

        except WebSocketDisconnect:
            print("🔌 Disconnected")
            break

        except Exception as e:
            print(f"⚠️ Error: {e}")