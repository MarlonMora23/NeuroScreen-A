import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Activity, Users, UserPlus, Upload, BarChart3, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { useProcessing } from "@/contexts/processing-context";
import PatientsTab from "@/components/dashboard/PatientsTab";
import UsersTab from "@/components/dashboard/UsersTab";
import UploadEEGTab from "@/components/dashboard/UploadEEGTab";
import ClassificationsTab from "@/components/dashboard/ClassificationsTab";
import ProcessingNotification from "@/components/ProcessingNotification";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, dismissNotification } = useProcessing();
  const [activeTab, setActiveTab] = useState("patients");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Processing Notifications */}
      <ProcessingNotification
        items={notifications}
        onDismissItem={dismissNotification}
        onViewResult={(id) => {
          // Navigate to classifications tab to view the result
          setActiveTab("classifications");
        }}
      />
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="w-7 h-7 text-primary" />
              <Activity className="w-3 h-3 text-accent absolute -top-0.5 -right-1 animate-pulse-glow" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Neuro<span className="text-primary">Screen-A</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{user.email}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary capitalize">
                  {user.role}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-3 h-auto p-1 bg-secondary/50 rounded-xl mb-8">
            <TabsTrigger
              value="patients"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Pacientes</span>
            </TabsTrigger>
            {user?.role === "ADMIN" && (
              <TabsTrigger
                value="users"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Usuarios</span>
              </TabsTrigger>
            )}
            <TabsTrigger
              value="upload"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Cargar EEG</span>
            </TabsTrigger>
            <TabsTrigger
              value="classifications"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Clasificaciones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients">
            <PatientsTab />
          </TabsContent>
          {user?.role === "ADMIN" && (
            <TabsContent value="users">
              <UsersTab />
            </TabsContent>
          )}
          <TabsContent value="upload">
            <UploadEEGTab />
          </TabsContent>
          <TabsContent value="classifications">
            <ClassificationsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
