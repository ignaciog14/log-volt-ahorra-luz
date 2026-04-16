import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, LayoutDashboard, Users, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

interface NavbarProps {
  activePage?: "dashboard" | "homes" | "profile";
}

const Navbar = ({ activePage }: NavbarProps) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-3">
          <img src={logo} alt="LogVolt" className="h-8 w-auto" />
        </button>
        <div className="flex gap-3">
          {activePage !== "dashboard" && (
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          )}
          {activePage !== "homes" && (
            <Button variant="outline" onClick={() => navigate("/homes")}>
              <Home className="w-4 h-4 mr-2" />
              Gestionar Hogares
            </Button>
          )}
          {activePage !== "profile" && (
            <Button variant="outline" onClick={() => navigate("/profile")}>
              <Users className="w-4 h-4 mr-2" />
              Mi Perfil
            </Button>
          )}
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
