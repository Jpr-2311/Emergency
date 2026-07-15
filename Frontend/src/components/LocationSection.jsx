import { useState } from "react";

export default function LocationSection({ onLocation }) {
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState("");

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        // Fetch address from Nominatim first
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );
        const data = await res.json();
        const addressName = data.display_name;

        // update local UI state
        setLocation({ lat, lon, address: addressName });
        setAddress(addressName);

        // send to parent with address (IMPORTANT)
        onLocation({ lat, lon, address: addressName });
      },
      (err) => {
        console.error("Geolocation error:", err);
      }
    );
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold text-blue-600 mb-4">
        📍 Detect Location Automatically
      </h2>

      <button
        onClick={getLocation}
        className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
      >
        Use My Current Location
      </button>

      {location && (
        <div className="mt-6 space-y-2">
          <p><strong>Latitude:</strong> {location.lat}</p>
          <p><strong>Longitude:</strong> {location.lon}</p>
          <p><strong>Address:</strong> {address}</p>
        </div>
      )}
    </div>
  );
}
