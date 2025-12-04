"use client"; 
// This makes the component a client-side component.
// It allows us to use useState, useRouter, and other browser APIs.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter(); 
  // Next.js navigation hook — lets us redirect the user after login.

  // ---------------------------
  // COMPONENT STATE
  // ---------------------------
  const [email, setEmail] = useState("");          // stores the email input
  const [password, setPassword] = useState("");    // stores password input
  const [loading, setLoading] = useState(false);   // disables button while submitting
  const [error, setError] = useState("");          // shows login errors

  // ---------------------------
  // FORM SUBMIT HANDLER
  // ---------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();   // prevent page reload
    setError("");         // clear any previous errors
    setLoading(true);     // disable button + show spinner text

    try {
      // Send login request to backend API
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }) // send the credentials
      });

      // Parse JSON response
      const data = await res.json();

      // If backend returns non-200 status, show error message
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // ---------------------------
      // LOGIN SUCCESS
      // ---------------------------
      // Backend already set the JWT cookie — now redirect to dashboard
      router.push("/rooms"); 
    } catch (err: any) {
      // If fetch failed or server crashed
      setError("Unexpected error. Try again.");
      setLoading(false);
    }
  }

  // ---------------------------
  // RENDER UI
  // ---------------------------
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-white bg-gradient-to-b from-black via-indigo-900 to-purple-900">
      <div className="w-full max-w-sm bg-gray-800/70 border border-gray-700 rounded-xl p-6 shadow-xl">

        {/* PAGE TITLE */}
        <h1 className="text-2xl font-bold mb-4 text-center">Admin Login</h1>

        {/* ERROR MESSAGE BOX */}
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded px-3 py-2">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* EMAIL INPUT */}
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"

/*
<button class="bg-gray-800 text-white px-3 py-2 rounded-lg transition-colors duration-200 hover:bg-cyan-500">
  Click Me
</button>


*/

         //    className="flex-1 rounded-lg w-full px-8 py-3 bg-white/90 text-black outline-none border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
             className="w-full rounded-lg px-3 py-2 bg-gray-800 text-white placeholder-gray-500 outline-none border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transform transition-transform duration-200 hover:scale-105"
              value={email}
              onChange={(e) => setEmail(e.target.value)} // update state
              required
            
            />
          </div>

          {/* PASSWORD INPUT */}
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full rounded-lg px-3 py-2 bg-gray-800 text-white placeholder-gray-500 outline-none border border-gray-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transform transition-transform duration-200 hover:scale-105"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // update state
              required
            />
          </div>

          {/* SUBMIT BUTTON */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className={`
              w-full 
              rounded-lg 
              bg-pink-600 
              text-white 
              font-semibold 
              py-3 
              font-mono 
              hover:bg-pink-500 
              shadow-lg 
              shadow-[0_0_12px_rgba(219,39,119,0.6)]
              disabled:opacity-50 
              disabled:cursor-not-allowed
            `}
          >
  {loading ? "Logging in…" : "Login"}
</motion.button>
        </form>
      </div>
    </main>
  );
}
      