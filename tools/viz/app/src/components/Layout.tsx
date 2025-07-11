import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  BarChart3,
  GitBranch,
  Users,
  UserCheck,
  Languages,
  Database,
  Menu,
  PanelLeft,
  PanelLeftClose,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/lib/auth/auth'
import { UserMenu } from '@/components/auth/UserMenu'
import { useRefresh } from '@/lib/contexts/RefreshContext'

const navigationItems = [
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
  { icon: GitBranch, label: 'Workflow Visualizer', path: '/workflow' },
  { icon: Users, label: 'Role Action Visualizer', path: '/role-action' },
  { icon: UserCheck, label: 'Employee Management', path: '/employees' },
  { icon: Languages, label: 'Localization Visualizer', path: '/localization' },
  { icon: Database, label: 'Data Explorer', path: '/data-explorer' },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user } = useAuth()
  const { triggerRefresh, isRefreshing } = useRefresh()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">DIGIT Viz</h1>
            <p className="text-xs text-muted-foreground">Data Visualization Suite</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <Separator className="mb-4" />
        <div className="text-xs text-muted-foreground">
          <p className="mb-1">DIGIT eGov Platform</p>
          <p>v2.0 Visualization Tools</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className={`hidden md:flex flex-col border-r bg-muted/40 transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
      }`}>
        <NavContent />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4 lg:px-6">
            <div className="flex items-center gap-2">
              {/* Sidebar Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden md:inline-flex"
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <NavContent />
                </SheetContent>
              </Sheet>

              <h2 className="text-lg font-semibold ml-2">
                {navigationItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>

            <div className="ml-auto flex items-center space-x-4">
              <Button 
                onClick={() => {
                  try {
                    triggerRefresh();
                  } catch (error) {
                    console.error('Refresh error:', error);
                  }
                }} 
                disabled={isRefreshing} 
                variant="outline" 
                size="sm"
              >
                {isRefreshing ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
              {user && <UserMenu />}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
} 