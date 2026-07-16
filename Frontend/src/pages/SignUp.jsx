import { Link, useNavigate } from "react-router-dom";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../firebase";

export default function SignUp() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    role: "informer",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

try {
  await set(ref(db, `users/${user.uid}`), {
    username: formData.username ?? "Anonymous",
    email: formData.email ?? "",
    role: formData.role ?? "user",
    coins: 0,
    reports: 0,
    joinedAt: Date.now()
  });

} catch (err) {
  console.error("❌ Database write failed");
  console.error(err);
}

      localStorage.setItem("userId", user.uid);
      localStorage.setItem("username", formData.username);

      // ✅ Do NOT navigate here — App.jsx will handle it
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <UserPlusIcon className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Create a CrisisIQ Account
        </h2>
        <p className="text-sm text-center text-gray-500 mb-6 font-medium">
          AI-Powered Government Crisis Management Platform
        </p>

        <div className="mb-4">
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-2.5 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="mb-4">
          <input
            type="text"
            name="username"
            placeholder="Create Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full p-2.5 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            name="password"
            placeholder="Create Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full p-2.5 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="mb-4">
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full p-2.5 border border-gray-300 rounded-lg"
          >
            <option value="informer">Informer</option>
            <option value="admin">Admin</option>
            <option value="officer">Officer (PWD/Municipality)</option>
            <option value="control_center">Emergency Control Center</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold"
        >
          Sign Up
        </button>

        <p className="text-sm text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
