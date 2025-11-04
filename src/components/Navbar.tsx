import { Link, useNavigate } from "react-router-dom";
import { Home, LogOut, Users, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import logo from "@/assets/logo.png";

interface NavbarProps {
  showAuthButtons?: boolean;
}

export const Navbar = ({ showAuthButtons = true }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to={user ? "/dashboard" : "/"}>
            <img src={logo} alt="LogVolt" className="h-8 w-auto" />
          </Link>
          {user && (
            <div className="hidden md:flex gap-2">
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/homes">
                  <Home className="w-4 h-4 mr-2" />
                  Hogares
                </Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/profile">
                  <Users className="w-4 h-4 mr-2" />
                  Perfil
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {showAuthButtons && user && (
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          )}

          {!user && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link to="/auth">Iniciar Sesión</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Comenzar Gratis</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
