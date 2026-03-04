import { useState, useEffect, useCallback } from "react";
import { Loader2, FileSignature, ExternalLink, XCircle, Clock, AlertTriangle, CheckCircle2, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookingData, createBooking, getEffectiveEmail } from "@/lib/bookingConfig";

// Webhook de n8n para consultar estado de firma
const N8N_CONTRACT_STATUS_WEBHOOK = "https://n8n-n8n.npfusf.easypanel.host/webhook/estado-contrato";
const POLLING_INTERVAL = 60000; // 1 minuto
const MAX_ATTEMPTS = 10; // 10 intentos = 10 minutos

interface StepContractSigningProps {
  booking: BookingData;
  onBack: () => void;
  onNext: () => void;
  onReset: () => void;
}

type ContractState = "loading" | "ready" | "opened" | "checking" | "signed" | "timeout" | "error";

interface ContractStatusResponse {
  // Formato n8n
  Arrendador?: string;
  pdf?: string;
  // Formato alternativo
  Status?: string;
  URL?: string;
}

export function StepContractSigning({ booking, onBack, onNext, onReset }: StepContractSigningProps) {
  const [contractState, setContractState] = useState<ContractState>("loading");
  const [contractUrl, setContractUrl] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [signedPdfUrl, setSignedPdfUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isManualChecking, setIsManualChecking] = useState(false);

  const userEmail = getEffectiveEmail(booking.clientData.email);

  // Función para consultar el estado del contrato en n8n
  const checkContractStatus = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsManualChecking(true);
    }

    try {
      const response = await fetch(N8N_CONTRACT_STATUS_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });
      const rawData = await response.json();

      // n8n devuelve un array, tomamos el último elemento (el más reciente)
      const data: ContractStatusResponse = Array.isArray(rawData) && rawData.length > 0
        ? rawData[rawData.length - 1]
        : rawData;

      // Verificar si hay datos de contrato firmado
      // n8n devuelve { Arrendador: email, pdf: url } si está firmado
      // O puede devolver array vacío [] si no está firmado
      if (data && data.pdf) {
        setSignedPdfUrl(data.pdf);
        setContractState("signed");
        return true;
      }

      // Formato alternativo: { Status: "completed", URL: "..." }
      if (data && data.Status === "completed" && data.URL) {
        setSignedPdfUrl(data.URL);
        setContractState("signed");
        return true;
      }

      // No firmado aún
      if (!isManual) {
        setAttempts(prev => {
          const newAttempts = prev + 1;
          if (newAttempts >= MAX_ATTEMPTS) {
            setContractState("timeout");
          }
          return newAttempts;
        });
      }
      return false;
    } catch (error) {
      console.log("Error checking contract status:", error);
      return false;
    } finally {
      if (isManual) {
        setIsManualChecking(false);
      }
    }
  }, [userEmail]);

  // Llamar al webhook de creación cuando se monta el componente
  useEffect(() => {
    const generateContract = async () => {
      try {
        const response = await createBooking(booking);

        if (response.success && response.contractUrl) {
          setContractUrl(response.contractUrl);
          setContractId(response.bookingId || `NJ-${Date.now()}`);
          setContractState("ready");
        } else {
          setErrorMessage(response.message || "Error al generar el contrato");
          setContractState("error");
        }
      } catch (error) {
        setErrorMessage("Error de conexión. Por favor, inténtalo de nuevo.");
        setContractState("error");
      }
    };

    generateContract();
  }, [booking]);

  // Polling cada 1 minuto para verificar si el contrato fue firmado
  useEffect(() => {
    // Solo hacer polling si estamos en estado "opened" y no hemos llegado al timeout
    if (contractState !== "opened" || attempts >= MAX_ATTEMPTS) return;

    // Primera comprobación inmediata
    const immediateCheck = setTimeout(() => {
      checkContractStatus();
    }, 5000); // Esperar 5 segundos antes de la primera comprobación

    // Polling cada minuto
    const interval = setInterval(() => {
      if (attempts < MAX_ATTEMPTS) {
        checkContractStatus();
      }
    }, POLLING_INTERVAL);

    return () => {
      clearTimeout(immediateCheck);
      clearInterval(interval);
    };
  }, [contractState, attempts, checkContractStatus]);

  const handleOpenContract = () => {
    setShowOpenDialog(true);
  };

  const confirmOpenContract = () => {
    if (contractUrl) {
      window.open(contractUrl, '_blank');
      setContractState("opened");
      setAttempts(0); // Reset attempts when opening contract
    }
    setShowOpenDialog(false);
  };

  const handleManualCheck = async () => {
    const signed = await checkContractStatus(true);
    if (!signed) {
      // Mostrar mensaje de que no se encontró la firma
      setErrorMessage("No se ha detectado la firma del contrato. Por favor, asegúrate de haber completado la firma.");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // Estado: Cargando contrato
  if (contractState === "loading") {
    return (
      <div className="space-y-8 text-center py-12">
        <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center bg-primary/10">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Generando contrato...
          </h2>
          <p className="text-muted-foreground">
            Por favor, espera mientras preparamos tu contrato de arrendamiento
          </p>
        </div>

        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Esto puede tardar unos segundos</span>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Error
  if (contractState === "error") {
    return (
      <div className="space-y-8 text-center py-12">
        <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center bg-destructive/10">
          <XCircle className="h-12 w-12 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Error al generar el contrato
          </h2>
          <p className="text-muted-foreground">{errorMessage}</p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={onBack} className="h-12 px-6">
            Volver atrás
          </Button>
          <Button onClick={onReset} className="h-12 px-6">
            Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  // Estado: Contrato firmado
  if (contractState === "signed") {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Firma del Contrato
          </h2>
          <p className="text-muted-foreground">
            El contrato ha sido firmado correctamente
          </p>
        </div>

        {contractId && (
          <div className="text-center">
            <p className="text-sm font-mono bg-muted px-4 py-2 rounded-lg inline-block">
              N° Contrato: {contractId}
            </p>
          </div>
        )}

        {/* Estado de firma completado */}
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 dark:text-green-400">
                Contrato firmado
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                El contrato ha sido firmado correctamente
              </p>
            </div>
            {signedPdfUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(signedPdfUrl, '_blank')}
                className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
            )}
          </div>
        </div>

        {/* Botón continuar habilitado */}
        <Button
          onClick={onNext}
          className="w-full h-14 text-lg font-medium"
        >
          Continuar al pago
        </Button>
      </div>
    );
  }

  // Estado: Timeout (10 minutos sin respuesta)
  if (contractState === "timeout") {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Firma del Contrato
          </h2>
          <p className="text-muted-foreground">
            No hemos detectado tu firma automáticamente
          </p>
        </div>

        {contractId && (
          <div className="text-center">
            <p className="text-sm font-mono bg-muted px-4 py-2 rounded-lg inline-block">
              N° Contrato: {contractId}
            </p>
          </div>
        )}

        {/* Mensaje de timeout */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-amber-800 dark:text-amber-400">
                Tiempo de espera agotado
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Han pasado 10 minutos y no hemos podido verificar automáticamente tu firma.
                Si ya has firmado el contrato, pulsa el botón de abajo para verificar manualmente.
              </p>
            </div>
          </div>
        </div>

        {/* Mensaje de error temporal */}
        {errorMessage && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <p className="text-sm text-destructive text-center">{errorMessage}</p>
          </div>
        )}

        {/* Botones */}
        <div className="space-y-3">
          <Button
            onClick={() => contractUrl && window.open(contractUrl, '_blank')}
            variant="outline"
            className="w-full h-12"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Volver a abrir contrato
          </Button>

          <Button
            onClick={handleManualCheck}
            disabled={isManualChecking}
            className="w-full h-14 text-lg font-medium"
          >
            {isManualChecking ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                Ya he firmado, verificar
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Estado: Contrato listo o abierto (pendiente de firma)
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif font-semibold text-foreground">
          Firma del Contrato
        </h2>
        <p className="text-muted-foreground">
          El contrato ha sido generado. Debes firmarlo para continuar.
        </p>
      </div>

      {contractId && (
        <div className="text-center">
          <p className="text-sm font-mono bg-muted px-4 py-2 rounded-lg inline-block">
            N° Contrato: {contractId}
          </p>
        </div>
      )}

      {/* Botón para abrir contrato */}
      <div className="bg-card border-2 border-primary rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-center gap-3">
          <FileSignature className="h-8 w-8 text-primary" />
          <span className="text-lg font-medium text-foreground">
            Contrato de Arrendamiento
          </span>
        </div>

        <Button
          onClick={handleOpenContract}
          className="w-full h-14 text-lg font-medium"
        >
          <ExternalLink className="mr-2 h-5 w-5" />
          {contractState === "opened" ? "Volver a abrir contrato" : "Abrir contrato para firmar"}
        </Button>

        {contractState === "opened" && (
          <p className="text-sm text-muted-foreground text-center">
            El contrato se ha abierto en una nueva pestaña
          </p>
        )}
      </div>

      {/* Estado de firma pendiente */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900">
            {contractState === "opened" ? (
              <Loader2 className="h-5 w-5 text-amber-600 dark:text-amber-500 animate-spin" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-400">
              Contrato pendiente de firma
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {contractState === "opened"
                ? `Verificando firma automáticamente... (${attempts}/${MAX_ATTEMPTS})`
                : "Una vez firmado el contrato, podrás continuar con el proceso de pago"
              }
            </p>
          </div>
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-2 py-1 rounded">
            Pendiente
          </span>
        </div>
      </div>

      {/* Botón continuar deshabilitado */}
      <div className="space-y-2">
        <Button
          disabled
          className="w-full h-14 text-lg font-medium opacity-50 cursor-not-allowed"
        >
          Continuar al pago
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Debes firmar el contrato antes de continuar
        </p>
      </div>

      {/* Dialog de confirmación */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir contrato</DialogTitle>
            <DialogDescription>
              Se abrirá una nueva pestaña con el contrato de arrendamiento para que puedas firmarlo digitalmente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowOpenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmOpenContract}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
