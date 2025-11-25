"use client"; 
// This makes the component a client-side component.
// It allows us to use useState, useRouter, and other browser APIs.

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black text-white px-6">
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
              className="w-full rounded-lg px-3 py-2 bg-white/90 text-black outline-none"
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
              className="w-full rounded-lg px-3 py-2 bg-white/90 text-black outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // update state
              required
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading} // disabled while loading
            className="w-full rounded-lg bg-yellow-400 text-black font-semibold py-2 hover:bg-yellow-300 disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Login"} 
            {/* dynamic text */}
          </button>
        </form>
      </div>
    </main>
  );
}
