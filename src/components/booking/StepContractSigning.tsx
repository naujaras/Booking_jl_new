import { useState } from "react";
import { FileSignature, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookingData } from "@/lib/bookingConfig";

interface StepContractSigningProps {
  booking: BookingData;
  onBack: () => void;
  onNext: () => void;
  onReset: () => void;
}

export function StepContractSigning({ booking, onNext }: StepContractSigningProps) {
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [contractState, setContractState] = useState<"ready" | "opened">("ready");

  const contractUrl = booking.contractUrl;
  const contractId = booking.bookingId;

  const handleOpenContract = () => {
    setShowOpenDialog(true);
  };

  const confirmOpenContract = () => {
    if (contractUrl) {
      window.open(contractUrl, '_blank');
      setContractState("opened");
    }
    setShowOpenDialog(false);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-foreground">
          ¡Pago verificado!
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Para finalizar el proceso de manera oficial, es obligatorio digitalizar el contrato de arrendamiento.
        </p>
      </div>

      <div className="bg-card border-2 border-primary rounded-xl p-6 text-center space-y-6 shadow-sm">
        <div className="flex flex-col items-center justify-center gap-3">
          <FileSignature className="h-10 w-10 text-primary" />
          <h3 className="text-xl font-bold text-foreground">
            Firma del Contrato
          </h3>
          <p className="text-sm text-muted-foreground px-4">
            Abre el siguiente enlace y completa la firma de tu reserva de alojamiento. Una vez firmado, finaliza el proceso aquí.
          </p>
        </div>

        <Button
          onClick={handleOpenContract}
          className="w-full h-14 text-lg font-medium shadow-md hover:scale-[1.02] transition-transform"
        >
          <ExternalLink className="mr-2 h-5 w-5" />
          {contractState === "opened" ? "Volver a abrir contrato" : "Abrir y Firmar Contrato"}
        </Button>
        
        {contractState === "opened" && (
          <p className="text-sm text-amber-600 dark:text-amber-400 font-medium animate-pulse">
            El contrato se ha abierto en otra pestaña. Vuelve aquí para finalizar cuando hayas terminado.
          </p>
        )}
      </div>

      {contractId && (
        <div className="text-center">
          <p className="text-xs font-mono text-muted-foreground">
            Cod. Reserva: {contractId}
          </p>
        </div>
      )}

      {/* Botones de finalización */}
      {contractState === "opened" && (
        <div className="space-y-3 pt-6 border-t border-border slide-in-from-bottom-4 animate-in">
          <Button
            onClick={onNext}
            className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg"
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Ya he firmado, Finalizar
          </Button>
        </div>
      )}

      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent>
          <DialogHeader>
             <DialogTitle>Abrir contrato digital</DialogTitle>
             <DialogDescription>
               Se abrirá una nueva pestaña segura en DocuSeal para rellenar tus datos y firmar el contrato. Por favor, no cierres esta ventana.
             </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
             <Button variant="outline" onClick={() => setShowOpenDialog(false)}>
               Cancelar
             </Button>
             <Button onClick={confirmOpenContract}>
               <ExternalLink className="mr-2 h-4 w-4" />
               Aceptar y Firmar
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
