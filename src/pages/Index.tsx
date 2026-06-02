import { Heart } from "lucide-react";
import { BookingWizard } from "@/components/booking/BookingWizard";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6 bg-card p-8 rounded-2xl shadow-lg border border-border">
        <Heart className="h-12 w-12 text-primary mx-auto animate-pulse" />
        <h1 className="text-3xl font-serif font-semibold text-foreground">
          Naujaras Sevilla
        </h1>
        <div className="space-y-2">
          <h2 className="text-xl font-medium text-foreground">
            Estamos mejorando nuestra web
          </h2>
          <p className="text-muted-foreground">
            El sistema de reservas se encuentra temporalmente en mantenimiento. 
            Estaremos de vuelta en unos minutos.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
