import { Heart } from "lucide-react";
import { BookingWizard } from "@/components/booking/BookingWizard";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-semibold text-foreground">
                  Naujaras Sevilla
                </h1>
                <p className="text-xs text-muted-foreground">
                  Experiencias románticas para parejas
                </p>
              </div>
            </div>
            <a 
              href="tel:+34600000000" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ¿Dudas? Llámanos
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 to-background py-12 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            Alojamientos Premium en Sevilla
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            Tu escapada romántica perfecta
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Espacios íntimos y exclusivos diseñados para crear momentos inolvidables. 
            Reserva tu experiencia en pocos pasos.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-accent/5 rounded-full blur-2xl" />
        </div>
      </section>

      {/* Booking Wizard */}
      <main>
        <BookingWizard />
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
