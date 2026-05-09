import { useState, useEffect, useCallback, useRef } from "react";
import { CreditCard, Smartphone, Building2, ChevronDown, ChevronUp, ExternalLink, Loader2, Copy, Check, AlertCircle, RefreshCw, CheckCircle2, AlertTriangle, Shield, Info, Wallet, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BookingData,
  calculateTotalPrice,
  calculateInsurancePrice,
  getRoomById,
  getJornadaForRoom,
  getEffectiveEmail,
  createBooking,
  sendFinalRegistroWebhook
} from "@/lib/bookingConfig";

const N8N_STRIPE_WEBHOOK = "https://n8n-n8n.npfusf.easypanel.host/webhook/6712f3f0-db51-4e53-8f97-7f9ce46d3119";
const N8N_PAYMENT_STATUS_WEBHOOK = "https://n8n-n8n.npfusf.easypanel.host/webhook/6218e434-d177-4bf9-8699-f03bddaa7983";
const BIZUM_PHONE = "679 96 82 09";
const WHATSAPP_PHONE = "34677222166";
const IBAN = "ES59 0182 6795 3702 0165 5693";
const TITULAR_CUENTA = "PORTIALDI SOCIEDAD LTDA.";
const POLLING_INTERVAL = 60000; // 1 minuto
const MAX_ATTEMPTS = 10; // 10 intentos = 10 minutos

interface StepPaymentProps {
  booking: BookingData;
  onBack: () => void;
  onNext: () => void;
  onReset: () => void;
  onPendingVerification: () => void;
  onBookingCreated?: (paymentUrl?: string, contractUrl?: string, bookingId?: string) => void;
}

type PaymentMethod = "card" | "bizum" | "transfer" | "cajero" | null;
type PaymentState = "selecting" | "processing" | "waiting" | "timeout" | "completed" | "error";

interface PaymentStatusResponse {
  payment_status?: string;
  payment_link_id?: string;
  paid_at?: string;
}

export function StepPayment({ booking, onBack, onNext, onReset, onPendingVerification, onBookingCreated }: StepPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [initStage, setInitStage] = useState<"loading" | "ready" | "error">("loading");
  const requestSentRef = useRef(false);
  const [expandedMethod, setExpandedMethod] = useState<PaymentMethod>("card");
  const [paymentState, setPaymentState] = useState<PaymentState>("selecting");
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isManualChecking, setIsManualChecking] = useState(false);

  // Nuevo estado para el modal de advertencia de Stripe
  const [showStripeWarning, setShowStripeWarning] = useState(false);
  const [pendingStripeMethod, setPendingStripeMethod] = useState<"card" | "bizum" | "transfer" | null>(null);

  const [cajeroDni, setCajeroDni] = useState("");
  const [cajeroError, setCajeroError] = useState("");

  const userEmail = getEffectiveEmail(booking.clientData.email);
  const totalPrice = calculateTotalPrice(booking);
  const room = booking.room ? getRoomById(booking.room) : null;
  const jornada = booking.room && booking.jornada ? getJornadaForRoom(booking.room, booking.jornada) : null;

  const paymentConcept = `${room?.name || ''} - ${booking.date ? format(booking.date, "dd/MM/yyyy", { locale: es }) : ''} - ${jornada?.name || ''} - ${booking.clientData.arrendadorNombre}`;

  const webhookSentRef = useRef(false);

  // Asegurarnos de enviar el webhook a n8n en el momento que se confirme el pago
  useEffect(() => {
    if (paymentState === "completed" && !webhookSentRef.current) {
      webhookSentRef.current = true;
      sendFinalRegistroWebhook(booking, false);
    }
  }, [paymentState, booking]);

  // --- INICIO CREADO DE RESERVA ---
  useEffect(() => {
    // Si ya tenemos paymentUrl en booking, no la creamos de nuevo
    if (booking.paymentUrl) {
      setInitStage("ready");
      return;
    }

    if (requestSentRef.current) return;
    requestSentRef.current = true;

    const generateBooking = async () => {
      try {
        const response = await createBooking(booking);

        if (response.success) {
          if (onBookingCreated) {
            onBookingCreated(response.paymentUrl, response.contractUrl, response.bookingId);
          }
          setInitStage("ready");
        } else {
          setErrorMessage(response.message || "Error al solicitar el enlace de pago");
          setInitStage("error");
          setPaymentState("error");
        }
      } catch (error) {
        setErrorMessage("Error de conexión. Por favor, inténtalo de nuevo.");
        setInitStage("error");
        setPaymentState("error");
      }
    };

    generateBooking();
  }, [booking, onBookingCreated]);
  // --- FIN CREADO DE RESERVA ---

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Error copiando al portapapeles:", err);
    }
  };

  const checkPaymentStatus = useCallback(async (isManual = false) => {
    if (isManual) setIsManualChecking(true);

    try {
      const response = await fetch(N8N_PAYMENT_STATUS_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          name: booking.clientData.arrendadorNombre,
          room: room?.name,
          date: booking.date ? format(booking.date, "yyyy-MM-dd") : null,
          jornada: jornada?.name,
          concept: paymentConcept
        }),
      });
      const rawData = await response.json();
      const data: PaymentStatusResponse = Array.isArray(rawData) ? rawData[0] : rawData;

      if (data?.payment_status === "completed") {
        setPaymentState("completed");
        return true;
      }

      if (!isManual) {
        setAttempts(prev => {
          const newAttempts = prev + 1;
          if (newAttempts >= MAX_ATTEMPTS) {
            setPaymentState("timeout");
          }
          return newAttempts;
        });
      }
      return false;
    } catch (error) {
      console.log("Error checking payment status:", error);
      return false;
    } finally {
      if (isManual) setIsManualChecking(false);
    }
  }, [userEmail, booking, room, jornada, paymentConcept]);

  useEffect(() => {
    if (paymentState !== "waiting" || (selectedMethod !== "card" && selectedMethod !== "bizum" && selectedMethod !== "transfer") || attempts >= MAX_ATTEMPTS) return;

    const immediateCheck = setTimeout(() => {
      checkPaymentStatus();
    }, 5000);

    const interval = setInterval(() => {
      if (attempts < MAX_ATTEMPTS) {
        checkPaymentStatus();
      }
    }, POLLING_INTERVAL);

    return () => {
      clearTimeout(immediateCheck);
      clearInterval(interval);
    };
  }, [paymentState, selectedMethod, attempts, checkPaymentStatus]);

  const handleManualCheck = async () => {
    const paid = await checkPaymentStatus(true);
    if (!paid) {
      setErrorMessage("No se ha detectado el pago. Por favor, asegúrate de haber completado el pago.");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const initiateStripePayment = (method: "card" | "bizum" | "transfer") => {
    setPendingStripeMethod(method);
    setShowStripeWarning(true);
  };

  const executeStripePayment = async () => {
    if (!pendingStripeMethod) return;
    
    setShowStripeWarning(false);
    setPaymentState("processing");
    setSelectedMethod(pendingStripeMethod);
    setAttempts(0);

    try {
      const paymentUrl = booking.paymentUrl;

      if (paymentUrl && paymentUrl !== "undefined") {
        setStripeUrl(paymentUrl);
        setPaymentState("waiting");
        window.open(paymentUrl, '_blank');
      } else {
        throw new Error("No se recibió URL de pago desde la reserva principal.");
      }
    } catch (error) {
      setErrorMessage("Error al cargar el enlace de pago seguro.");
      setPaymentState("error");
    }
  };

  const handleManualMethodSelect = (method: "cajero") => {
    setSelectedMethod(method);
    setPaymentState("waiting");
  };

  const toggleMethod = (method: PaymentMethod) => {
    setExpandedMethod(expandedMethod === method ? null : method);
  };

  if (initStage === "loading") {
    return (
      <div className="space-y-8 text-center py-12">
        <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center bg-primary/10">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Preparando opciones de pago...
          </h2>
          <p className="text-muted-foreground">
            Buscando y activando tu pasarela de pago seguro.
          </p>
        </div>
      </div>
    );
  }

  if (paymentState === "processing") {
    return (
      <div className="space-y-8 text-center py-12">
        <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center bg-primary/10">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Generando enlace de pago...
          </h2>
          <p className="text-muted-foreground">
            Por favor, espera mientras preparamos tu pago seguro
          </p>
        </div>
      </div>
    );
  }

  if (paymentState === "error") {
    return (
      <div className="space-y-8 text-center py-12">
        <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center bg-destructive/10">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Error en el pago
          </h2>
          <p className="text-muted-foreground">{errorMessage}</p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={onBack} className="h-12 px-6">
            Volver atrás
          </Button>
          <Button onClick={() => setPaymentState("selecting")} className="h-12 px-6">
            Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  if (paymentState === "completed") {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            ¡Pago verificado!
          </h2>
          <p className="text-muted-foreground">
            Tu pago ha sido verificado correctamente
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 dark:text-green-400">
                Pago confirmado
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                El pago de {totalPrice}€ se ha procesado correctamente.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={onNext}
          className="w-full h-14 text-lg font-medium bg-green-600 hover:bg-green-700 text-white border-none shadow-md"
        >
          Siguiente: Confirmar y Opción de Contrato
        </Button>
      </div>
    );
  }

  if (paymentState === "timeout" && (selectedMethod === "card" || selectedMethod === "bizum" || selectedMethod === "transfer")) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Completa tu pago
          </h2>
          <p className="text-muted-foreground">
            No hemos detectado tu pago automáticamente
          </p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-amber-800 dark:text-amber-400">
                Tiempo de espera agotado
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Han pasado 10 minutos y no hemos podido verificar automáticamente tu pago.
                Si ya has completado el pago en la otra pestaña, pulsa el botón de abajo para verificar manualmente.
              </p>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
            <p className="text-sm text-destructive text-center">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-3">
          {stripeUrl && (
            <Button
              onClick={() => window.open(stripeUrl, '_blank')}
              variant="outline"
              className="w-full h-12"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Volver a abrir pasarela de pago
            </Button>
          )}

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
                Ya he pagado, verificar
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setPaymentState("selecting");
              setSelectedMethod(null);
            }}
            className="w-full h-10 text-sm"
          >
            Elegir otro método de pago
          </Button>
        </div>
      </div>
    );
  }

  if (paymentState === "waiting" && (selectedMethod === "card" || selectedMethod === "bizum" || selectedMethod === "transfer")) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Completa tu pago
          </h2>
          <p className="text-muted-foreground">
            Se ha abierto la pasarela de pago en una nueva pestaña
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-800 dark:text-blue-400">
                Verificando pago automáticamente...
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Completa el pago en la ventana que se ha abierto. Estamos verificando
                automáticamente el estado de tu pago ({attempts}/{MAX_ATTEMPTS}).
              </p>
            </div>
          </div>
        </div>

        {/* ALERTA CRÍTICA: NO CERRAR PESTAÑA */}
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl p-6">
           <div className="flex items-start gap-4">
             <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
             <div>
               <h3 className="font-bold text-red-800 dark:text-red-400">
                 ¡ATENCIÓN! No cierres esta pestaña
               </h3>
               <p className="text-sm text-red-700 dark:text-red-300">
                 Cuando termines de pagar en la otra pestaña, <strong>vuelve aquí</strong>. Si cierras esta pantalla antes de que verifiquemos el pago, tu reserva podría quedarse en un estado incompleto.
               </p>
             </div>
           </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
          <p className="text-2xl font-bold text-primary">{totalPrice}€</p>
          {stripeUrl && (
            <Button
              onClick={() => window.open(stripeUrl, '_blank')}
              className="w-full h-12"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Volver a abrir pasarela de pago
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setPaymentState("selecting");
            setSelectedMethod(null);
          }}
          className="w-full h-12"
        >
          Elegir otro método de pago
        </Button>
      </div>
    );
  }

  // Estado: Esperando confirmación (Cajero Manual)
  if (paymentState === "waiting" && selectedMethod === "cajero") {
    
    const validarSaldoCajero = async () => {
      setCajeroError("");
      const dni = cajeroDni.trim().toUpperCase();
      
      if (!dni) {
        setCajeroError("El DNI es necesario para consultar su saldo.");
        return;
      }
      
      const regex = /^[0-9]{8}[A-Z]$/;
      if (!regex.test(dni)) {
        setCajeroError("El formato del DNI es incorrecto. Ejemplo: 12345678X");
        return;
      }

      setPaymentState("processing");

      try {
        // --- WEBHOOK DE n8n PARA DESCONTAR SALDO ---
        // Se espera que n8n verifique el saldo, lo reste, y devuelva { "success": true }
        const resp = await fetch("https://n8n-n8n.npfusf.easypanel.host/webhook/pagar-cajero", { // Cambiado a NPfusf
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            dni: dni,
            totalPrice: totalPrice,
            email: userEmail,
            room: room?.name,
            roomId: booking.room,
            jornada: jornada?.name,
            date: booking.date ? format(booking.date, "yyyy-MM-dd") : null,
            bookingId: booking.bookingId,
            arrendadorNombre: booking.clientData.arrendadorNombre,
            arrendadorDNI: booking.clientData.arrendadorDni,
            acompananteNombre: booking.clientData.acompananteNombre,
            telefono: booking.clientData.telefono,
            decoracion: booking.extras.decoracion,
            personasExtra: booking.extras.personasExtra,
            comentarios: booking.comments
          })
        });

        if (!resp.ok) {
          throw new Error("No se pudo contactar con el sistema de saldo.");
        }

        const data = await resp.json();

        if (data.success) {
          // TIENE SALDO Y SE HA DESCONTADO -> LA RESERVA SE CONSIDERA PAGADA
          setPaymentState("completed");
        } else {
          // NO TIENE SALDO O HUBO UN ERROR EN N8N
          setPaymentState("waiting");
          setCajeroError(data.message || "Saldo insuficiente para completar la reserva.");
        }
      } catch (err) {
        setPaymentState("waiting");
        setCajeroError("Error al contactar con el sistema de saldo. Por favor, asegúrese de que el webhook 'pagar-cajero' está activo.");
      }
    };

    return (
      <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/40 rounded-full">
              <Landmark className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Ingreso en Cajero
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Para validar la reserva mediante ingreso en efectivo, verifique primero su saldo monedero.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="text-center bg-muted/30 py-4 rounded-lg">
            <p className="text-sm font-medium text-foreground mb-1">Total Reserva</p>
            <p className="text-3xl font-bold text-primary">{totalPrice}€</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-green-600" />
              Recuerde consultar aquí su saldo
            </label>
            <input 
              type="text"
              value={cajeroDni}
              onChange={(e) => setCajeroDni(e.target.value.toUpperCase())}
              placeholder="Ej: 12345678X"
              className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 uppercase"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Introduzca el DNI con letras mayúsculas y sin espacios.
            </p>
            
            {cajeroError && (
              <p className="text-sm font-semibold text-destructive mt-3 bg-red-50 dark:bg-red-950 p-3 rounded-md border border-red-200 dark:border-red-900">
                {cajeroError}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={validarSaldoCajero}
            disabled={!cajeroDni.trim()}
            className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-md transition-all"
          >
            <Wallet className="mr-2 h-5 w-5" />
            Consultar Saldo y Pagar
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setPaymentState("selecting");
              setSelectedMethod(null);
            }}
            className="w-full h-12"
          >
            ← Elegir otro método de pago
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* MODAL DE ADVERTENCIA REDIRECCIÓN STRIPE */}
      {showStripeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background rounded-xl shadow-xl max-w-sm w-full p-6 space-y-6 slide-in-from-bottom-4 animate-in duration-300">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">Pago Seguro</h3>
              <p className="text-muted-foreground text-sm">
                A continuación se abrirá la pasarela de pago segura de Stripe en una nueva pestaña.
              </p>
              
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-4 w-full text-left">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  IMPORTANTE
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  <strong>NO cierres esta página.</strong> Cuando termines de pagar, debes volver a esta misma pestaña para confirmar tu reserva.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={executeStripePayment} className="w-full h-12 text-base">
                Entendido, ir a pagar
              </Button>
              <Button variant="ghost" onClick={() => setShowStripeWarning(false)} className="w-full h-10">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif font-semibold text-foreground">
          Método de Pago
        </h2>
        <p className="text-muted-foreground">
          Selecciona cómo deseas realizar el pago de tu reserva
        </p>
      </div>

      {/* Total a pagar */}
      <div className="bg-primary text-primary-foreground rounded-xl p-6 text-center">
        <p className="text-sm opacity-90">Total a pagar</p>
        <p className="text-4xl font-bold">{totalPrice}€</p>
      </div>

      {/* Opciones de pago */}
      <div className="space-y-4">
        {/* Tarjeta de Crédito/Débito */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleMethod("card")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Tarjeta de Crédito o Débito</h3>
                <p className="text-xs text-muted-foreground">Pago inmediato y seguro</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded">
                Recomendado
              </span>
              {expandedMethod === "card" ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </button>

          {expandedMethod === "card" && (
            <div className="p-4 pt-0 border-t border-border">
              <div className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pago seguro a través de pasarela de pago. Tu reserva se confirmará automáticamente al completar el pago.
                </p>
                <Button onClick={() => initiateStripePayment("card")} className="w-full h-12">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pagar {totalPrice}€ con Tarjeta
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bizum */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleMethod("bizum")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Bizum</h3>
                <p className="text-xs text-muted-foreground">Pago por pasarela oficial segura</p>
              </div>
            </div>
            {expandedMethod === "bizum" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {expandedMethod === "bizum" && (
            <div className="p-4 pt-0 border-t border-border">
              <div className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Al redirigirte a Stripe, escoge la opción de Bizum e introduce tu número para confirmar al instante.
                </p>
                <Button onClick={() => initiateStripePayment("bizum")} variant="outline" className="w-full h-12">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Pagar {totalPrice}€ con Bizum
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Transferencia Bancaria por Stripe */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleMethod("transfer")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Transferencia Bancaria</h3>
                <p className="text-xs text-muted-foreground">A través de nuestra pasarela Stripe</p>
              </div>
            </div>
            {expandedMethod === "transfer" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {expandedMethod === "transfer" && (
            <div className="p-4 pt-0 border-t border-border">
              <div className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Serás redirigido a Stripe, donde se te facilitarán los datos para tu transferencia bancaria automática.
                </p>
                <Button onClick={() => initiateStripePayment("transfer")} variant="outline" className="w-full h-12">
                  <Building2 className="mr-2 h-4 w-4" />
                  Ir a realizar Transferencia
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Ingreso en Cajero (Único flujo manual real) */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => toggleMethod("cajero")}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Cajero Automático</h3>
                <p className="text-xs text-muted-foreground">Pago contra ingreso previo</p>
              </div>
            </div>
            {expandedMethod === "cajero" ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {expandedMethod === "cajero" && (
            <div className="p-4 pt-0 border-t border-border">
              <div className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Opción <strong>únicamente válida</strong> si tienes recargado tu saldo previamente en nuestros sistemas a través de un ingreso en cajero.
                </p>
                <Button onClick={() => handleManualMethodSelect("cajero")} variant="outline" className="w-full h-12">
                   Utilizar Saldo de Ingreso
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Button
        variant="outline"
        onClick={onBack}
        className="w-full h-12"
      >
        Volver atrás
      </Button>
    </div>
  );
}
