import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenerateInsightsButtonProps {
  onComplete: () => void;
}

export const GenerateInsightsButton = ({ onComplete }: GenerateInsightsButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      
      // Generate recommendations
      const { error: recError } = await supabase.functions.invoke('generate-recommendations');
      if (recError) throw recError;
      
      // Generate alerts
      const { error: alertError } = await supabase.functions.invoke('generate-alerts');
      if (alertError) throw alertError;
      
      toast.success("Recomendaciones y alertas generadas");
      onComplete();
    } catch (error: any) {
      toast.error("Error al generar insights: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="h-auto py-6 flex flex-col gap-2"
      onClick={handleGenerate}
      disabled={loading}
    >
      <Sparkles className="w-6 h-6" />
      <span>{loading ? "Generando..." : "Generar Insights"}</span>
    </Button>
  );
};
