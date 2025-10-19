import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import logo from "@/assets/logo.png";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es requerido").max(100, "Nombre demasiado largo"),
  apellido: z.string().trim().min(1, "El apellido es requerido").max(100, "Apellido demasiado largo"),
  telefono: z.string().max(20, "Teléfono demasiado largo").optional(),
});

const emailSchema = z.object({
  email: z.string().email("Email inválido").max(255, "Email demasiado largo"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Contraseña actual requerida"),
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").max(100, "Contraseña demasiado larga"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("nombre, apellido, telefono, email")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      
      setProfile({
        nombre: data.nombre || "",
        apellido: data.apellido || "",
        telefono: data.telefono || "",
        email: data.email || "",
      });
    } catch (error: any) {
      toast.error("Error al cargar el perfil");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const telefono = formData.get("telefono") as string;

    try {
      const validated = profileSchema.parse({
        nombre,
        apellido,
        telefono: telefono || undefined,
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          nombre: validated.nombre,
          apellido: validated.apellido,
          telefono: validated.telefono,
        })
        .eq("id", user?.id);

      if (error) throw error;

      setProfile((prev) => ({
        ...prev,
        nombre: validated.nombre,
        apellido: validated.apellido,
        telefono: validated.telefono || "",
      }));

      toast.success("Perfil actualizado exitosamente");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Error al actualizar el perfil");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const newEmail = formData.get("email") as string;

    try {
      const validated = emailSchema.parse({ email: newEmail });

      const { error } = await supabase.auth.updateUser({
        email: validated.email,
      });

      if (error) throw error;

      toast.success("Se ha enviado un correo de confirmación al nuevo email");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Error al actualizar el email");
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    try {
      const validated = passwordSchema.parse({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      // Verify current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: validated.currentPassword,
      });

      if (signInError) {
        toast.error("Contraseña actual incorrecta");
        setSaving(false);
        return;
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: validated.newPassword,
      });

      if (error) throw error;

      toast.success("Contraseña actualizada exitosamente");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Error al actualizar la contraseña");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard">
              <img src={logo} alt="LogVolt" className="h-8 w-auto" />
            </Link>
            <div className="flex gap-4">
              <Button variant="ghost" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/homes">Gestionar Hogares</Link>
              </Button>
            </div>
          </div>
          <Button variant="outline" onClick={signOut}>
            Cerrar Sesión
          </Button>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y configuración</p>
        </div>

        <div className="space-y-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualiza tu nombre, apellido y teléfono</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      defaultValue={profile.nombre}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      name="apellido"
                      defaultValue={profile.apellido}
                      required
                      maxLength={100}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono (opcional)</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    defaultValue={profile.telefono}
                    placeholder="+56 9 1234 5678"
                    maxLength={20}
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Email Update */}
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Email</CardTitle>
              <CardDescription>
                Tu email actual: {profile.email}. Recibirás un correo de confirmación.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Nuevo Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nuevo@email.com"
                    required
                    maxLength={255}
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Enviando..." : "Cambiar Email"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Separator />

          {/* Password Update */}
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña Actual</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    maxLength={100}
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Actualizando..." : "Cambiar Contraseña"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
