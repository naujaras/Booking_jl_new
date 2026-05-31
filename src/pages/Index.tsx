import { Heart, Wrench } from "lucide-react";
// import { BookingWizard } from "@/components/booking/BookingWizard";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Booking Wizard Oculto por Mantenimiento */}
      <main className="flex-1 flex flex-col items-center justify-center pt-20 px-4 max-w-2xl mx-auto text-center w-full">
        <div className="bg-card border border-border p-8 rounded-2xl shadow-sm space-y-6 w-full">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-10 h-10" />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-serif font-bold text-foreground">
              Sistema en Mantenimiento
            </h1>
            <p className="text-muted-foreground text-lg">
              Estamos implementando mejoras técnicas en el sistema de reservas para ofrecerte una experiencia perfecta.
              <br/><br/>
              La web volverá a estar operativa en breves. Por favor, inténtalo de nuevo más tarde.
            </p>
          </div>
          <div className="pt-6 border-t border-border mt-8 text-sm text-muted-foreground">
            Disculpe las molestias - El equipo de Naujarás
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="font-serif font-semibold text-foreground">Naujaras Sevilla</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2026 Naujaras Sevilla. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
