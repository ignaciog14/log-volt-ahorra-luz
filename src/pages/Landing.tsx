import { Link } from "react-router-dom";
import { Zap, TrendingDown, Home, Lightbulb, BarChart3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logo from "@/assets/logo.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="LogVolt" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link to="/auth">
              <Button>Comenzar Gratis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Controla tu consumo,{" "}
            <span className="text-primary">reduce tu cuenta</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            LogVolt te ayuda a entender tu consumo eléctrico y tomar decisiones inteligentes para ahorrar en tu cuenta de luz
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8">
                Comenzar Ahora
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Todo lo que necesitas para ahorrar
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Herramientas simples pero poderosas para entender y reducir tu consumo eléctrico
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Gestiona tu Hogar</h3>
                <p className="text-muted-foreground">
                  Organiza tu casa por habitaciones y registra todos tus electrodomésticos de forma simple
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-success/10 w-12 h-12 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Visualiza tu Consumo</h3>
                <p className="text-muted-foreground">
                  Dashboard claro con gráficos que muestran qué electrodomésticos consumen más energía
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-warning/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Lightbulb className="w-6 h-6 text-warning" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Recomendaciones Inteligentes</h3>
                <p className="text-muted-foreground">
                  Recibe sugerencias personalizadas para reducir tu consumo y ahorrar dinero
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-destructive/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Alertas en Tiempo Real</h3>
                <p className="text-muted-foreground">
                  Recibe notificaciones cuando tu consumo supere los límites esperados
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Establece Metas</h3>
                <p className="text-muted-foreground">
                  Define objetivos de ahorro mensuales y monitorea tu progreso
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className="rounded-lg bg-success/10 w-12 h-12 flex items-center justify-center mb-4">
                  <TrendingDown className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Reduce tu Cuenta</h3>
                <p className="text-muted-foreground">
                  Ahorra hasta un 30% en tu cuenta de luz con acciones basadas en datos reales
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold">
            Comienza a ahorrar hoy
          </h2>
          <p className="text-xl text-muted-foreground">
            Únete a las familias chilenas que están tomando control de su consumo eléctrico
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8">
              Crear Cuenta Gratis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="LogVolt" className="h-8 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 LogVolt. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
