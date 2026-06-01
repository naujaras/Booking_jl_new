import { useState } from "react";
import { FileSignature, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingData, sendFinalRegistroWebhook } from "@/lib/bookingConfig";
import { DocusealForm } from '@docuseal/react';

interface StepContractSigningProps {
  booking: BookingData;
  onBack: () => void;
  onNext: () => void;
  onReset: () => void;
}

export function StepContractSigning({ booking, onNext }: StepContractSigningProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractState, setContractState] = useState<"opened" | "completed">("opened");

  const contractUrl = booking.contractUrl;
  const contractId = booking.bookingId;

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
          Para finalizar el proceso de manera oficial, es obligatorio firmar el contrato a continuación.
        </p>
      </div>

      <div className="bg-card border-2 border-primary rounded-xl p-2 md:p-6 text-center space-y-6 shadow-sm overflow-hidden">
        {contractState === "opened" ? (
          <div className="w-full flex flex-col items-center">
            {contractUrl ? (
              <div className="w-full min-h-[1300px] h-[120vh] rounded-lg overflow-hidden border border-border shadow-inner bg-white">
                <DocusealForm 
                  src={contractUrl}
                  
                  onComplete={(data) => {
                    console.log("Firma completada de DocuSeal", data);
                    setContractState("completed");
                  }}
                />
              </div>
            ) : (
              <div className="p-8 text-red-500">Error: No se ha podido cargar el enlace del contrato.</div>
            )}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500">
             <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
               <FileSignature className="h-10 w-10 text-green-600 dark:text-green-400" />
             </div>
             <h3 className="text-2xl font-bold text-foreground">¡Contrato firmado con éxito!</h3>
             <p className="text-muted-foreground">Ya puedes finalizar tu reserva.</p>
          </div>
        )}
      </div>

      {contractId && (
        <div className="text-center">
          <p className="text-xs font-mono text-muted-foreground">
            Cod. Reserva: {contractId}
          </p>
        </div>
      )}

      {/* Botones de finalización - Siempre visible en modo desarrollo/fallback o cuando se completa */}
      <div className="space-y-3 pt-6 border-t border-border slide-in-from-bottom-4 animate-in">
        <Button
          disabled={isSubmitting}
          onClick={async () => {
            if (contractState === "completed") {
              setIsSubmitting(true);
              try {
                // Enviar el webhook de Confirmación y Calendario para pagos de Stripe
                await sendFinalRegistroWebhook(booking, false, "stripe");
              } catch (e) {
                console.error("Error al enviar webhook de confirmación final:", e);
              } finally {
                setIsSubmitting(false);
                onNext();
              }
            } else {
              onNext();
            }
          }}
          className={`w-full h-14 text-lg font-bold shadow-lg transition-all duration-300 ${
            contractState === "completed" 
              ? "bg-green-600 hover:bg-green-700 text-white scale-100 opacity-100" 
              : "bg-secondary text-secondary-foreground opacity-50"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              Confirmando...
            </span>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              {contractState === "completed" ? "Finalizar Reserva" : "Ya he firmado (Continuar)"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
