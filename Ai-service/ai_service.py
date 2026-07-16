from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from PIL import Image
import torch
import torchvision.transforms as transforms
import torchvision.models as models
import io
import os
import time
from google import genai
from dotenv import load_dotenv

# Force reload the environment variable from .env to override any stale shell variables
load_dotenv(override=True)

# Read the API key securely from the environment
gemini_api_key = os.environ.get("GEMINI_API_KEY", "")
if gemini_api_key:
    # Initialize the modern SDK client
    client = genai.Client(api_key=gemini_api_key)
else:
    client = None

app = FastAPI()

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "AI Service"}

model = models.mobilenet_v2(pretrained=True)
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
])

def classify(conf):
    if conf > 0.5:
        return "severe"
    elif conf > 0.75:
        return "moderate"
    else:
        return "mild"

from fastapi import FastAPI, UploadFile, File, Form
from typing import Optional

@app.post("/predict")
async def predict(
    images: list[UploadFile] = File(...),
    damage_type: Optional[str] = Form("pothole")
):
    max_conf = 0

    for img in images:
        img_bytes = await img.read()
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        tensor = transform(image).unsqueeze(0)

        with torch.no_grad():
            out = model(tensor)
            prob = torch.softmax(out, dim=1)
            conf = prob.max().item()

        max_conf = max(max_conf, conf)

    severity = classify(max_conf)
    
    # Feature 1: AI Explainable Decision Engine
    reasons = []
    if severity == "severe":
        reasons = [
            "Heavy Traffic Density detected in area",
            "Multiple Previous Complaints within 100m",
            "Located on Active Ambulance Route",
            "Near Government Hospital"
        ]
    elif severity == "moderate":
        reasons = [
            "Moderate Traffic Volume",
            "Road Age exceeds maintenance threshold",
            "Rainfall Forecast High for next 48h"
        ]
    else:
        reasons = [
            "Minor surface wear",
            "Low accident frequency zone"
        ]

    return {
        "severity": severity,
        "confidence": round(max_conf, 2),
        "damage_type": damage_type,
        "explanation": reasons
    }

from pydantic import BaseModel
class HealthData(BaseModel):
    age: int
    heart_rate: int
    bp_sys: int
    bp_dia: int
    symptoms: str

@app.post("/predict_health")
async def predict_health(data: HealthData):
    # Mock AI Triage Logic (Feature 12)
    score = 0
    if data.heart_rate > 100 or data.heart_rate < 50:
        score += 3
    if data.bp_sys > 160 or data.bp_sys < 90:
        score += 3
    
    triage_level = "Routine"
    if score >= 5:
        triage_level = "Critical"
    elif score >= 3:
        triage_level = "Urgent"

    return {
        "patient_severity_score": score,
        "triage_level": triage_level,
        "recommended_action": "Dispatch Ambulance immediately" if triage_level == "Critical" else "Advise nearest hospital visit"
    }

class RoadData(BaseModel):
    pothole_history_count: int
    avg_traffic_volume: int
    rainfall_mm: float

@app.post("/predict_risk")
async def predict_risk(data: RoadData):
    # Mock AI Predictive Risk for Road Failure (Feature 9 & 4)
    risk = "Low"
    probability = 0.1
    road_health = 92
    repair_window = "Within 6 Months"
    reasons = ["Low traffic", "Recent maintenance"]
    
    if data.pothole_history_count > 10 and data.rainfall_mm > 50:
        risk = "High"
        probability = 0.85
        road_health = 45
        repair_window = "Within 48 Hours"
        reasons = ["Heavy Rain Forecast", "Repeated Complaints", "High Accident Probability"]
    elif data.pothole_history_count > 5 or data.avg_traffic_volume > 10000:
        risk = "Medium"
        probability = 0.45
        road_health = 70
        repair_window = "Within 10 Days"
        reasons = ["Heavy Vehicle Usage", "Old Road Surface"]
        
    return {
        "failure_risk": risk,
        "probability": probability,
        "road_health_percentage": road_health,
        "expected_repair_window": repair_window,
        "recommendation": "Preventive Maintenance Required" if risk == "High" else "Monitor",
        "reasons": reasons
    }

class CopilotQuery(BaseModel):
    query: str
    context: Optional[dict] = None

@app.post("/copilot/query")
async def copilot_query(data: CopilotQuery):
    q = data.query.strip()
    
    # Graceful fallback if API key is missing
    if not client:
        return {
            "response": "⚠️ **System Notice:** The AI Emergency Copilot requires a valid `GEMINI_API_KEY` to process live queries. Please add your key to the backend environment variables to enable real-time analytical capabilities. (Current behavior: LLM Disabled)."
        }
    
    try:
        # We define a strict System Prompt for the LLM to understand its role
        system_prompt = (
            "You are the AI Emergency Copilot for the Government Crisis Management Platform.\n"
            "Answer ONLY using the provided LIVE PROJECT DATA. Do not invent entities.\n"
            "If no active incidents exist, output EXACTLY: 'No critical incidents require immediate intervention today.'\n\n"
            "FORMATTING RULES:\n"
            "1. Use clear Markdown sections with these EXACT emojis and headings (do not use ##, just output the text as H2):\n"
            "   ## 🚨 Emergency Operations Summary\n"
            "   ## 🛣️ Active Road Repairs\n"
            "   ## 👷 Officer Assignments\n"
            "   ## 🏥 Hospital Status\n"
            "   ## 🚑 Ambulance Status\n"
            "   ## 🤖 AI Recommendation\n"
            "2. Keep responses highly concise, scannable, and professional. Avoid long paragraphs.\n"
            "3. MUST use Markdown Tables when listing multiple roads, complaints, or officers.\n"
            "4. Priority levels MUST be written exactly as [High], [Medium], or [Low] so the UI can colorize them.\n"
            "5. Briefly explain AI Priority Scores (e.g., traffic, severity, proximity) inside the tables or summary.\n"
            "6. Always end your response with the '## 🤖 AI Recommendation' section suggesting the next best action."
        )
        
        # Inject context if provided
        context_str = ""
        if data.context:
            import json
            context_str = "\n\n=== LIVE PROJECT DATA ===\n" + json.dumps(data.context, indent=2) + "\n=========================\n\n"
        
        full_prompt = f"{context_str}User Query: {q}"
        
        # Using Gemini Flash Lite with retry mechanism
        response = None
        for attempt in range(3):
            try:
                response = client.models.generate_content(
                    model="gemini-2.5-flash-lite",
                    contents=full_prompt,
                    config=genai.types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.7
                    )
                )
                break
            except Exception as e:
                error_str = str(e).upper()
                if attempt < 2 and ("503" in error_str or "UNAVAILABLE" in error_str or "529" in error_str):
                    time.sleep(2)
                else:
                    raise e
        
        reply = response.text
        
        return {
            "response": reply
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Copilot Error: {e}")
        return {
            "response": "An error occurred while connecting to the AI Copilot reasoning engine. Please try again later or check your API key validity."
        }

@app.get("/api/test-gemini")
async def test_gemini():
    """Independent health-check endpoint to verify Gemini API integration"""
    if not client:
        return {"status": "error", "message": "API key not configured."}
    
    try:
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents="Say 'Integration successful!' and list 3 random emergency vehicles."
        )
        return {"status": "success", "response": response.text}
    except Exception as e:
        return {"status": "error", "message": str(e)}
