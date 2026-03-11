import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Activity,
  Users,
  UserPlus,
  Upload,
  BarChart3,
  UserCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { Sun, Moon } from "lucide-react";
import { useProcessing } from "@/contexts/processing-context";
import PatientsTab from "@/components/dashboard/PatientsTab";
import UsersTab from "@/components/dashboard/UsersTab";
import UploadEEGTab from "@/components/dashboard/UploadEEGTab";
import ClassificationsTab from "@/components/dashboard/ClassificationsTab";
import ProcessingNotification from "@/components/notifications/ProcessingNotification";
import FooterDashboard from "@/components/layout/FooterDashboard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, dismissNotification } = useProcessing();
  const [activeTab, setActiveTab] = useState("patients");
  // incrementing counter used to signal child components to refresh data
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const isAdmin = user?.role === "admin";
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Processing Notifications */}
      <ProcessingNotification
        items={notifications}
        onDismissItem={dismissNotification}
        onViewResult={(id) => {
          // Navigate to classifications tab to view the result
          setActiveTab("classifications");
        }}
        onProcessed={() => {
          // whenever a prediction finishes processing we bump the counter
          // which will be observed by ClassificationsTab to reload data
          setRefreshTrigger((prev) => prev + 1);
        }}
      />
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="w-7 h-7 text-primary" />
              <Activity className="w-3 h-3 text-landingaccent absolute -top-0.5 -right-1 animate-pulse-glow" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Neuro<span className="text-primary">Screen-A</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-md hover:bg-muted/10 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/50 transition"
            >
              <UserCircle className="w-5 h-5 text-primary" />
              <span className="hidden sm:inline-block w-[80px] text-sm">
                Cuenta
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className={`w-full max-w-2xl mx-auto grid ${isAdmin ? "grid-cols-4" : "grid-cols-3"} h-auto p-1 bg-secondary/50 rounded-xl mb-8`}
          >
            <TabsTrigger
              value="patients"
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-3 px-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Pacientes</span>
            </TabsTrigger>
            {isAdmin && (
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
          {isAdmin && (
            <TabsContent value="users">
              <UsersTab />
            </TabsContent>
          )}
          <TabsContent value="upload">
            <UploadEEGTab />
          </TabsContent>
          <TabsContent value="classifications">
            <ClassificationsTab
              onNavigateToUpload={() => setActiveTab("upload")}
              refreshSignal={refreshTrigger}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <FooterDashboard />
    </div>
  );
};

export default Dashboard;
