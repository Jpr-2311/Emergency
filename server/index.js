const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
    // console.log("Hello world");
    res.send("Hello world");
})
const MERGE_DISTANCE_METERS = 50;
const potholes = [];

let syncData = null;


app.post("/report-pothole", upload.array("images", 3), async (req, res) => {
    try {
        const { lat, lng } = req.body;

        const form = new FormData();
        req.files.forEach(file => {
            form.append("images", fs.createReadStream(file.path));
        });

        const aiRes = await axios.post(
            "http://127.0.0.1:8000/predict",
            form,
            { headers: form.getHeaders() }
        );

        const pothole = {
            lat: lat ?? 0,
            lng: lng ?? 0,
            severity: aiRes.data.severity ?? "Unknown",
            confidence: aiRes.data.confidence ?? 0,
            explanation: aiRes.data.explanation || [],
            timestamp: Date.now()
        };

        // potholes.push(pothole);
        const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
            const R = 6371000;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1 * Math.PI / 180) *
                Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) ** 2;
            return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        const severityRank = {
            mild: 1,
            moderate: 2,
            severe: 3
        };

        const existing = potholes.find(p =>
            getDistanceInMeters(
                parseFloat(p.lat),
                parseFloat(p.lng),
                parseFloat(lat),
                parseFloat(lng)
            ) < MERGE_DISTANCE_METERS
        );

        if (existing) {
            // escalate risk
            if (severityRank[aiRes.data.severity] > severityRank[existing.severity]) {
                existing.severity = aiRes.data.severity;
            }
            existing.confidence = Math.max(existing.confidence, aiRes.data.confidence);
            existing.timestamp = Date.now();
        } else {
            potholes.push({
                lat,
                lng,
                severity: aiRes.data.severity,
                confidence: aiRes.data.confidence,
                timestamp: Date.now()
            });
        }

        res.json(pothole);


    } catch (err) {
        res.status(500).json({ error: "AI service failed" });
    }
});

app.get("/potholes", (req, res) => {
    res.json(potholes);
});
app.delete("/potholes", (req, res) => {
    potholes.length = 0; // clears array in-place
    res.json({ success: true, message: "All potholes cleared" });
});
app.post("/sync", (req, res) => {
  syncData = req.body;
  res.json({ status: "saved" });
});

// Follower reads data here
app.get("/sync", (req, res) => {
  res.json(syncData);
});

// --- NEW: Hospital Intelligence (Feature 6 & 12) ---
let hospitalsData = [
  { id: "H1", name: "Lisie Hospital", availableBeds: 120, icuBeds: 15, doctors: 45, emergencyQueue: 5, triageWaitTimeMins: 10, bloodAvailability: { "O+": 20, "A+": 15 }, traumaCenter: true },
  { id: "H3", name: "Aster Medcity", availableBeds: 80, icuBeds: 25, doctors: 80, emergencyQueue: 12, triageWaitTimeMins: 25, bloodAvailability: { "O+": 5, "B+": 10 }, traumaCenter: true },
  { id: "H5", name: "Renai Medicity", availableBeds: 45, icuBeds: 5, doctors: 20, emergencyQueue: 2, triageWaitTimeMins: 5, bloodAvailability: { "AB+": 12, "O-": 2 }, traumaCenter: false },
];

app.get("/hospitals", (req, res) => {
    res.json(hospitalsData);
});

app.post("/hospitals/update", (req, res) => {
    const { id, updates } = req.body;
    hospitalsData = hospitalsData.map(h => h.id === id ? { ...h, ...updates } : h);
    res.json({ success: true, hospitalsData });
});

// --- NEW: Government Complaint Routing (Feature 1 & 7) ---
app.post("/generate-complaint", (req, res) => {
    const { lat, lng, severity, confidence, reporterId } = req.body;
    
    // Auto-determine department based on severity (Mock logic)
    let department = "Municipality";
    let priority = "Low";
    let repairETA = "7 Days";
    let ai_priority_score = 45;
    
    if (severity === "severe") {
        department = "PWD";
        priority = "High";
        repairETA = "48 Hours";
        ai_priority_score = Math.floor(80 + (parseFloat(confidence) * 20)); // 80-100
    } else if (severity === "moderate") {
        department = "Municipality";
        priority = "Medium";
        repairETA = "5 Days";
        ai_priority_score = Math.floor(50 + (parseFloat(confidence) * 29)); // 50-79
    }

    const complaint = {
        complaintId: "CMP-" + Date.now().toString().slice(-6),
        department: department ?? "Municipality",
        priority: priority ?? "Low",
        ai_priority_score: ai_priority_score ?? 0,
        repairETA: repairETA ?? "Unknown",
        status: "Assigned",
        assignedOfficer: null, // To be picked up by an officer
        timeline: [
            { status: "Citizen submits pothole/emergency report.", timestamp: Date.now() },
            { status: "AI Vision analyzes uploaded images.", timestamp: Date.now() + 8000 },
            { status: "AI predicts severity, confidence, and AI Priority Score.", timestamp: Date.now() + 10000 },
            { status: "Government complaint is automatically generated.", timestamp: Date.now() + 12000 },
            { status: "Assigned to " + department + ".", timestamp: Date.now() + 15000 }
        ]
    };

    res.json(complaint);
});

// --- NEW: Notification Engine (Feature 5) ---
let notifications = [];

app.post("/notifications/send", (req, res) => {
    const { targetRole, message, type } = req.body;
    const newNotif = {
        id: Date.now().toString(),
        targetRole,
        message,
        type,
        timestamp: Date.now(),
        read: False
    };
    notifications.push(newNotif);
    res.json({ success: True, notification: newNotif });
});

app.get("/notifications", (req, res) => {
    const { role } = req.query;
    if (role) {
        res.json(notifications.filter(n => n.targetRole === role || n.targetRole === "all"));
    } else {
        res.json(notifications);
    }
});

// --- NEW: Smart Recommendation Engine (Feature 7) ---
app.get("/recommendations", (req, res) => {
    res.json([
        { id: 1, text: "Deploy one additional ambulance near City Hospital." },
        { id: 2, text: "Repair MG Road before expected rainfall." },
        { id: 3, text: "Assign Engineer Rahul because he has the lowest workload." },
        { id: 4, text: "Hospital A will reach ICU capacity in two hours." }
    ]);
});

// --- NEW: IoT & Future AI Placeholders (Feature 13) ---
app.get("/iot/traffic", (req, res) => {
    // Mock IoT traffic camera data
    res.json([
        { location: [9.995, 76.292], status: "Congested", reason: "Accident" },
        { location: [9.988, 76.288], status: "Clear" }
    ]);
});

app.get("/iot/sensors", (req, res) => {
    // Mock IoT road sensors (e.g., floods)
    res.json([
        { type: "Flood", location: [10.006, 76.304], waterLevel: "High", risk: "CRITICAL" }
    ]);
});

app.listen(5001, () => {
    console.log("Node server running on http://localhost:5001");
});
// setInterval(() => {
//   console.log("backend alive");
// }, 5000);
