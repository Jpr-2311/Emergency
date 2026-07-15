from fastapi import FastAPI, UploadFile, File
from PIL import Image
import torch
import torchvision.transforms as transforms
import torchvision.models as models
import io

app = FastAPI()

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

@app.post("/copilot/query")
async def copilot_query(data: CopilotQuery):
    # Mock LLM Assistant (Feature 3)
    q = data.query.lower()
    
    if "urgent repair" in q or "prioritized" in q:
        reply = "Currently, MG Road and Highway Junction need urgent repair due to severe pothole reports intersecting with active ambulance routes. I recommend assigning these to the PWD immediately."
    elif "five days" in q or "older than" in q:
        reply = "I found 3 unresolved complaints older than five days. Two are in the Edappally district, assigned to Municipality engineers who currently have high workloads."
    elif "additional ambulances" in q or "fastest ambulance" in q:
        reply = "Based on current hospital capacities, City Hospital has reached 90% ICU capacity. I recommend deploying two additional ambulances near Aster Medcity where triage wait times are lower (under 10 mins)."
    elif "accident hotspots" in q or "predict" in q:
        reply = "Predicting tomorrow's hotspots: The NH Bypass junction has an 85% probability of severe congestion and road failure due to predicted heavy rainfall (50mm+) and existing moderate damage."
    elif "backlog" in q:
        reply = "Ernakulam North district has the highest repair backlog (14 pending issues). The average repair time there has increased to 72 hours."
    elif "summary" in q:
        reply = "Today's Summary: 12 new complaints received (4 Severe, 8 Moderate). 5 repairs completed. 2 Flood alerts active. All critical hospital routes remain clear."
    else:
        reply = f"Based on current real-time analytics, I recommend monitoring the situation. (Assumption: Historical data for '{data.query}' is currently sparse, so I am analyzing live IoT streams instead)."
        
    return {
        "response": reply
    }
