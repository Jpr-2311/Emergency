import { useState } from "react";
import { ref, push, update, get } from "firebase/database";
import { db, auth } from "../firebase";
import LocationSection from "./LocationSection";
import UploadBanner from "./UploadBanner";

export default function ReportPothole() {
  const [location, setLocation] = useState(null);
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const submitReport = async () => {
    if (!location || !image) {
      alert("Location and image required");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("User not logged in");
      return;
    }

    const userId = user.uid;

    try {
      setLoading(true);

      // 1️⃣ Send to AI
      const formData = new FormData();
      formData.append("images", image);
      formData.append("lat", location.lat);
      formData.append("lng", location.lon);

      const res = await fetch("http://localhost:5001/report-pothole", {
        method: "POST",
        body: formData,
      });

      const aiData = await res.json();
      console.log("AI Response:", aiData);

      // 2️⃣ Calculate coins
      const confidence = parseFloat(aiData.confidence) || 0;
      const severityBonus = aiData.severity === "severe" ? 50 : aiData.severity === "moderate" ? 30 : 10;
      const coinsAwarded = Math.round(50 + (confidence * 100) + severityBonus);

      // 3️⃣ Get user from Firebase
      const userSnap = await get(ref(db, `users/${userId}`));
      if (!userSnap.exists()) {
        alert("User record not found.");
        return;
      }
      const userData = userSnap.val();

      // 3.5️⃣ Generate Automated Complaint Route (Feature 1 & 7)
      const complaintRes = await fetch("http://localhost:5001/generate-complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            lat: location.lat, 
            lng: location.lon, 
            severity: aiData.severity, 
            confidence: aiData.confidence,
            reporterId: userId
        })
      });
      const complaintData = await complaintRes.json();
      setResult({ ...aiData, ...complaintData });

      // 4️⃣ Save report
      const newReportRef = push(ref(db, "reports"));
      await update(newReportRef, {
        reportId: newReportRef.key ?? "",
        complaintId: complaintData.complaintId ?? `CMP-${Date.now()}`,
        department: complaintData.department ?? "Municipality",
        priority: complaintData.priority ?? "Low",
        ai_priority_score: complaintData.ai_priority_score ?? 0,
        repairETA: complaintData.repairETA ?? "Unknown",
        timeline: complaintData.timeline ?? [],
        explanation: aiData.explanation ?? [],
        userId: userId ?? "Unknown",
        username: userData.username ?? "Unknown",
        location: location.address?.trim() || "Unknown Location",
        latitude: location.lat ?? 0,
        longitude: location.lon ?? 0,
        severity: aiData.severity ?? "Unknown",
        confidence: aiData.confidence ?? "N/A",
        status: "Assigned",
        coinsAwarded: coinsAwarded ?? 0,
        createdAt: Date.now(),
      });

      // 5️⃣ Update user stats
      await update(ref(db, `users/${userId}`), {
        coins: (userData.coins || 0) + (coinsAwarded || 0),
        reports: (userData.reports || 0) + 1,
      });

      alert(`Report submitted successfully! +${coinsAwarded} Coins 🎉`);
      setImage(null);

    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <LocationSection onLocation={setLocation} />
      <UploadBanner onFile={setImage} />

      <button
        onClick={submitReport}
        disabled={loading}
        className="bg-red-600 text-white px-6 py-3 rounded-xl disabled:opacity-50 hover:bg-red-700 transition"
      >
        {loading ? "Submitting..." : "Submit Report"}
      </button>

      {result && (
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100 space-y-3">
          <h3 className="font-bold text-lg text-blue-900 border-b pb-2">AI Analysis Report</h3>
          <div className="flex justify-between">
            <span className="text-gray-600">Severity:</span>
            <span className="font-semibold text-red-600 uppercase">{result.severity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Confidence:</span>
            <span className="font-semibold">{(parseFloat(result.confidence) * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">AI Priority Score:</span>
            <span className="font-bold text-orange-600">{result.ai_priority_score} / 100</span>
          </div>
          <div className="mt-4 bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
            <p className="font-bold mb-2">Decision Explanation:</p>
            <ul className="list-disc pl-5 space-y-1">
              {result.explanation?.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}