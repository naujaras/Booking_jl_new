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
          ¡Tu pago está verificado!
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          La reserva está <strong className="text-foreground">100% confirmada</strong>.
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
        <div className="text-center space-y-3">
           <h3 className="font-semibold text-amber-800 dark:text-amber-400 text-lg">
             Último paso sugerido: El Contrato
           </h3>
           <p className="text-sm text-amber-700 dark:text-amber-300">
             Para evitar trámites en recepción y agilizar tu entrada al alojamiento, te recomendamos encarecidamente firmar tu contrato de forma digital ahora mismo.
           </p>
           <p className="text-xs text-amber-700/80 dark:text-amber-300/80 pb-2">
             Si decides no hacerlo, explícanoslo y deberás firmarlo obligatoriamente en papel a tu llegada.
           </p>
        </div>

        <div className="bg-card border-2 border-primary rounded-xl p-5 mt-4 space-y-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <FileSignature className="h-8 w-8 text-primary" />
            <span className="text-lg font-medium text-foreground">
              Contrato de Arrendamiento
            </span>
          </div>

          <Button
            onClick={handleOpenContract}
            className="w-full h-14 text-lg font-medium shadow-md hover:scale-[1.02] transition-transform"
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            {contractState === "opened" ? "Volver a abrir contrato" : "Firmar Contrato Digital"}
          </Button>
          
          {contractState === "opened" && (
            <p className="text-xs text-muted-foreground animate-pulse">
              Se ha abierto el contrato en otra pestaña. Vuelve aquí cuando termines.
            </p>
          )}
        </div>
      </div>

      {contractId && (
        <div className="text-center">
          <p className="text-xs font-mono text-muted-foreground">
            Cod. Reserva: {contractId}
          </p>
        </div>
      )}

      {/* Botones de finalización */}
      <div className="space-y-3 pt-6 border-t border-border">
        {contractState === "opened" ? (
           <Button
             onClick={onNext}
             className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white"
           >
             <CheckCircle2 className="mr-2 h-5 w-5" />
             ¡Listo, ya he firmado! Finalizar
           </Button>
        ) : (
           <Button
             onClick={onNext}
             variant="outline"
             className="w-full h-12"
           >
             Prefiero firmar al llegar, finalizar reserva
           </Button>
        )}
      </div>

      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent>
          <DialogHeader>
             <DialogTitle>Abrir contrato digital</DialogTitle>
             <DialogDescription>
               Se abrirá una nueva pestaña segura en DocuSeal para rellenar tus datos y firmar el contrato. No cierres esta ventana.
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
