import { Heart } from "lucide-react";
import { BookingWizard } from "@/components/booking/BookingWizard";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Booking Wizard */}
      <main className="flex-1 pt-4 sm:pt-8 w-full">
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
