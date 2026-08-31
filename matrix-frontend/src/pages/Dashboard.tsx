import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { logout } from "@/api/auth"

export default function Dashboard() {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-zinc-500 mt-1">Welcome to Matrix ERP System.</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            Sign Out
          </Button>
        </header>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Placeholder dashboard cards */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Metric {i}</h3>
              <p className="text-3xl font-bold mt-2">1,234</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
