import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../context/authContext"

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("") // Clear previous errors

    if (!email || !password) {
      setError("Email and password are required")
      return
    }

    try {
      setLoading(true)
      // Use the login method from auth context (it handles everything)
      await login({ email, password })
      
      console.log("✅ Login successful, navigating to home...")
      navigate("/") // Redirect after successful login
    } catch (err) {
      console.error("❌ Login error:", err)
      setError(err?.response?.data?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-slate-900">
      <div className="max-w-md w-full p-6 rounded-lg bg-gradient-to-br from-gray-950 via-slate-600 to-black shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        
        {error && (
          <div className="alert alert-error mb-4 bg-red-500/20 border border-red-500 text-red-200 rounded p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="input input-bordered w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            className="input input-bordered w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="btn btn-primary w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
          
          <div className="text-center">
            <p className="text-sm text-gray-100">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-500 hover:underline">
                Register
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}