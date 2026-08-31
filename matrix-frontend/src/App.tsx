import React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Box } from "lucide-react"

export default function App() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 relative overflow-hidden dark:bg-zinc-950">
      {/* Background decoration */}
      <div className="absolute top-0 -translate-y-12 right-0 translate-x-1/3 w-[800px] h-[800px] opacity-30 bg-gradient-to-tr from-zinc-200 to-zinc-400 blur-3xl rounded-full dark:from-zinc-800 dark:to-zinc-900 pointer-events-none" />
      <div className="absolute bottom-0 translate-y-1/3 left-0 -translate-x-1/3 w-[600px] h-[600px] opacity-40 bg-gradient-to-bl from-zinc-200 to-zinc-400 blur-3xl rounded-full dark:from-zinc-800 dark:to-zinc-900 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="flex flex-col items-center mb-8 space-y-2">
          <div className="bg-zinc-900 text-white p-3 rounded-2xl shadow-lg ring-1 ring-zinc-900/5 dark:bg-white dark:text-zinc-900">
            <Box size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white mt-4">
            Matrix ERP
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Enterprise Resource Planning System
          </p>
        </div>

        <Card className="shadow-2xl shadow-zinc-200/50 border-zinc-200/60 backdrop-blur-xl bg-white/70 dark:bg-zinc-900/70 dark:border-zinc-800 dark:shadow-none">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold tracking-tight text-center">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center text-zinc-500">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="bg-white dark:bg-zinc-950/50 h-11"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a
                  href="#"
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                className="bg-white dark:bg-zinc-950/50 h-11"
              />
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-6">
            <Button className="w-full h-11 text-base font-medium shadow-md transition-transform active:scale-[0.98]">
              Sign In
            </Button>
          </CardFooter>
        </Card>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-8">
          Need an account?{" "}
          <a
            href="#"
            className="font-medium text-zinc-900 hover:underline dark:text-white"
          >
            Contact your administrator
          </a>
        </p>
      </div>
    </div>
  )
}
