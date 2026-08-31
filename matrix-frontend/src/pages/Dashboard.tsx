import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Download,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Wallet,
  AlertCircle,
  Package,
  FileText,
  UserPlus,
  BarChart3,
  Clock,
  ArrowUpRight,
} from "lucide-react"

const revenueData = [
  { month: "Apr", revenue: 1800000, profit: 540000 },
  { month: "May", revenue: 2100000, profit: 630000 },
  { month: "Jun", revenue: 1950000, profit: 585000 },
  { month: "Jul", revenue: 2350000, profit: 705000 },
  { month: "Aug", revenue: 2560000, profit: 768000 },
  { month: "Sep", revenue: 2456800, profit: 622600 },
]

const salesPerformance = [
  { label: "Products", value: 68, color: "bg-blue-500" },
  { label: "Services", value: 22, color: "bg-emerald-500" },
  { label: "Other", value: 10, color: "bg-violet-500" },
]

const categoryData = [
  { label: "Electronics", value: 38, color: "bg-blue-500" },
  { label: "Clothing", value: 24, color: "bg-violet-500" },
  { label: "Groceries", value: 18, color: "bg-emerald-500" },
  { label: "Furniture", value: 12, color: "bg-amber-500" },
  { label: "Others", value: 8, color: "bg-slate-400" },
]

const transactions = [
  { id: "INV-2024-0847", customer: "Priya Enterprises", date: "Sep 15", amount: 124500, status: "Completed" },
  { id: "INV-2024-0846", customer: "Sharma Traders", date: "Sep 14", amount: 87200, status: "Pending" },
  { id: "INV-2024-0845", customer: "Mehta & Co.", date: "Sep 13", amount: 215800, status: "Completed" },
  { id: "INV-2024-0844", customer: "Patel Industries", date: "Sep 12", amount: 56400, status: "Overdue" },
  { id: "INV-2024-0843", customer: "Gupta Brothers", date: "Sep 11", amount: 189300, status: "Completed" },
  { id: "INV-2024-0842", customer: "Verma Exports", date: "Sep 10", amount: 73600, status: "Processing" },
]

const topCustomers = [
  { name: "Rajesh Kumar", company: "Kumar Industries", spent: "₹12.4L", initials: "RK" },
  { name: "Priya Sharma", company: "Sharma Electronics", spent: "₹9.8L", initials: "PS" },
  { name: "Amit Patel", company: "Patel Trading Co.", spent: "₹8.2L", initials: "AP" },
  { name: "Sunita Mehta", company: "Mehta Enterprises", spent: "₹7.5L", initials: "SM" },
  { name: "Vikram Singh", company: "Singh Exports", spent: "₹6.1L", initials: "VS" },
]

const inventoryAlerts = [
  { item: "Widget Pro X1", sku: "WPX-001", stock: 12, status: "low" },
  { item: "Smart Sensor S2", sku: "SS2-045", stock: 8, status: "critical" },
  { item: "Power Unit P3", sku: "PUP-023", stock: 23, status: "low" },
  { item: "Display Module D4", sku: "DMD-067", stock: 5, status: "critical" },
  { item: "Controller Board C5", sku: "CBC-089", stock: 18, status: "low" },
]

const recentActivity = [
  { text: "New order #847 placed by Priya Enterprises", time: "2 hours ago", color: "bg-blue-500" },
  { text: "Payment received from Sharma Traders", time: "4 hours ago", color: "bg-emerald-500" },
  { text: "Inventory restocked: Widget Pro X1", time: "6 hours ago", color: "bg-violet-500" },
  { text: "Invoice #845 sent to Mehta & Co.", time: "8 hours ago", color: "bg-amber-500" },
  { text: "New customer registered: Verma Exports", time: "12 hours ago", color: "bg-rose-500" },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function formatINR(amount: number) {
  return "₹" + amount.toLocaleString("en-IN")
}

const kpis = [
  { label: "Revenue", value: "₹24,56,800", change: "+12.5%", up: true, icon: IndianRupee, color: "bg-blue-50 text-blue-600" },
  { label: "Sales", value: "₹18,34,200", change: "+8.3%", up: true, icon: ShoppingCart, color: "bg-green-50 text-green-600" },
  { label: "Profit", value: "₹6,22,600", change: "+15.2%", up: true, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
  { label: "Expenses", value: "₹12,12,200", change: "-3.1%", up: false, icon: Wallet, color: "bg-amber-50 text-amber-600" },
  { label: "Outstanding", value: "₹4,58,900", change: "+2.8%", up: false, icon: AlertCircle, color: "bg-rose-50 text-rose-600" },
  { label: "Inventory", value: "₹32,45,000", change: "-1.2%", up: false, icon: Package, color: "bg-violet-50 text-violet-600" },
]

const quickActions = [
  { label: "Create Invoice", icon: FileText },
  { label: "Add Product", icon: Package },
  { label: "New Customer", icon: UserPlus },
  { label: "Generate Report", icon: BarChart3 },
]

const statusStyles: Record<string, string> = {
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Overdue: "bg-rose-50 text-rose-700 border-rose-200",
  Processing: "bg-blue-50 text-blue-700 border-blue-200",
}

const maxRevenue = Math.max(...revenueData.map((d) => d.revenue))

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {getGreeting()}, Rajesh
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Here's what's happening with your business today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm font-normal">
            <Calendar className="h-3.5 w-3.5" />
            Sep 1 - Sep 30, 2026
          </Badge>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", kpi.color)}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500 truncate">{kpi.label}</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{kpi.value}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                {kpi.up ? (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-rose-600" />
                )}
                <span className={cn("text-xs font-medium", kpi.up ? "text-emerald-600" : "text-rose-600")}>
                  {kpi.change}
                </span>
                <span className="text-xs text-zinc-400 ml-1">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sales Performance</CardTitle>
            <p className="text-xs text-zinc-500">This quarter</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="relative h-40 w-40">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  {salesPerformance.reduce(
                    (acc, item) => {
                      const circumference = 2 * Math.PI * 40
                      const strokeDash = (item.value / 100) * circumference
                      const elements = [
                        ...acc.elements,
                        <circle
                          key={item.label}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={
                            item.color === "bg-blue-500"
                              ? "#3b82f6"
                              : item.color === "bg-emerald-500"
                                ? "#10b981"
                                : "#8b5cf6"
                          }
                          strokeWidth="8"
                          strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                          strokeDashoffset={-acc.offset}
                          strokeLinecap="round"
                        />,
                      ]
                      return { elements, offset: acc.offset + strokeDash }
                    },
                    { elements: [] as React.ReactElement[], offset: 0 }
                  ).elements}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">₹54.7L</p>
                  <p className="text-xs text-zinc-500">Total</p>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {salesPerformance.map((item) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
                    <span className="text-zinc-600 dark:text-zinc-400">{item.label}</span>
                  </div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue by Category</CardTitle>
            <p className="text-xs text-zinc-500">Distribution breakdown</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">{item.label}</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={cn("h-full rounded-full", item.color)}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-1 border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Recent Transactions</CardTitle>
              <p className="text-xs text-zinc-500">Latest invoices</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              View All
              <ArrowUpRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="pb-2 text-left font-medium text-zinc-500">Invoice</th>
                    <th className="pb-2 text-left font-medium text-zinc-500">Customer</th>
                    <th className="pb-2 text-left font-medium text-zinc-500">Date</th>
                    <th className="pb-2 text-right font-medium text-zinc-500">Amount</th>
                    <th className="pb-2 text-right font-medium text-zinc-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="py-2.5 font-medium text-zinc-900 dark:text-zinc-100">{t.id}</td>
                      <td className="py-2.5 text-zinc-600 dark:text-zinc-400">{t.customer}</td>
                      <td className="py-2.5 text-zinc-500">{t.date}</td>
                      <td className="py-2.5 text-right font-medium text-zinc-900 dark:text-zinc-100">{formatINR(t.amount)}</td>
                      <td className="py-2.5 text-right">
                        <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", statusStyles[t.status])}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenue & Profit Analytics</CardTitle>
          <p className="text-xs text-zinc-500">Monthly comparison</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-xs text-zinc-500">Revenue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-zinc-500">Profit</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-48">
            {revenueData.map((d) => (
              <div key={d.month} className="flex flex-1 items-end gap-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-blue-500 rounded-t-sm"
                    style={{ height: `${(d.revenue / maxRevenue) * 160}px` }}
                  />
                  <span className="text-xs text-zinc-500 mt-2">{d.month}</span>
                </div>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-emerald-500 rounded-t-sm"
                    style={{ height: `${(d.profit / maxRevenue) * 160}px` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topCustomers.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {c.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{c.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{c.company}</p>
                  </div>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{c.spent}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inventory Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventoryAlerts.map((item) => (
                <div key={item.sku} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{item.item}</p>
                    <p className="text-xs text-zinc-500">{item.sku}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">{item.stock} units</span>
                    <span className={cn(
                      "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                      item.status === "critical"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {item.status === "critical" ? "Critical" : "Low"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="relative flex flex-col items-center">
                    <div className={cn("h-2.5 w-2.5 rounded-full mt-1", a.color)} />
                    {i < recentActivity.length - 1 && <div className="w-px flex-1 bg-zinc-200 dark:bg-zinc-800 mt-1" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{a.text}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3 text-zinc-400" />
                      <span className="text-xs text-zinc-500">{a.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {quickActions.map((action) => (
          <Card
            key={action.label}
            className="border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <action.icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{action.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
