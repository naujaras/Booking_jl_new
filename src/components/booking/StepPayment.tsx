import { useState, useEffect, useCallback } from "react";
import { CreditCard, Smartphone, Building2, ChevronDown, ChevronUp, ExternalLink, Loader2, Copy, Check, AlertCircle, RefreshCw, CheckCircle2, AlertTriangle, Shield, Info } from "lucide-react";
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
  getEffectiveEmail
} from "@/lib/bookingConfig";

const N8N_STRIPE_WEBHOOK = "https://n8n-n8n.1owldl.easypanel.host/webhook/6712f3f0-db51-4e53-8f97-7f9ce46d3119";
const N8N_PAYMENT_STATUS_WEBHOOK = "https://n8n-n8n.1owldl.easypanel.host/webhook/6218e434-d177-4bf9-8699-f03bddaa7983";
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
}

type PaymentMethod = "card" | "bizum" | "transfer" | "cajero" | null;
type PaymentState = "selecting" | "processing" | "waiting" | "timeout" | "completed" | "error";

interface PaymentStatusResponse {
  payment_status?: string;
  payment_link_id?: string;
  paid_at?: string;
}

export function StepPayment({ booking, onBack, onNext, onReset, onPendingVerification }: StepPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [expandedMethod, setExpandedMethod] = useState<PaymentMethod>("card");
  const [paymentState, setPaymentState] = useState<PaymentState>("selecting");
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isManualChecking, setIsManualChecking] = useState(false);

  const userEmail = getEffectiveEmail(booking.clientData.email);
  const totalPrice = calculateTotalPrice(booking);
  const insurancePrice = calculateInsurancePrice(booking);
  const room = booking.room ? getRoomById(booking.room) : null;
  const jornada = booking.room && booking.jornada ? getJornadaForRoom(booking.room, booking.jornada) : null;

  // Generar concepto para Bizum/Transferencia
  const paymentConcept = `${room?.name || ''} - ${booking.date ? format(booking.date, "dd/MM/yyyy", { locale: es }) : ''} - ${jornada?.name || ''} - ${booking.clientData.arrendadorNombre}`;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  // Función para consultar el estado del pago en n8n
  const checkPaymentStatus = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsManualChecking(true);
    }

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

      // n8n devuelve un array, tomamos el primer elemento
      const data: PaymentStatusResponse = Array.isArray(rawData) ? rawData[0] : rawData;

      // Verificar si el pago está completado
      if (data?.payment_status === "completed") {
        setPaymentState("completed");
        return true;
      }

      // No pagado aún
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
      if (isManual) {
        setIsManualChecking(false);
      }
    }
  }, [userEmail, booking, room, jornada, paymentConcept]);

  // Polling cada 1 minuto para verificar si el pago fue completado
  useEffect(() => {
    // Solo hacer polling si estamos esperando pago con tarjeta y no hemos llegado al timeout
    if (paymentState !== "waiting" || selectedMethod !== "card" || attempts >= MAX_ATTEMPTS) return;

    // Primera comprobación después de 5 segundos
    const immediateCheck = setTimeout(() => {
      checkPaymentStatus();
    }, 5000);

    // Polling cada minuto
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

  const handleStripePayment = async (method: "card" | "bizum") => {
    setPaymentState("processing");
    setSelectedMethod(method);
    setAttempts(0); // Reset attempts when starting payment

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

  const handleManualMethodSelect = (method: "cajero" | "transfer") => {
    setSelectedMethod(method);
    setPaymentState("waiting");
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Hola, he realizado el pago de mi reserva:\n\n` +
      `Concepto: ${paymentConcept}\n` +
      `Importe: ${totalPrice}€\n\n` +
      `Adjunto comprobante de pago.`
    );
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${message}`, '_blank');
  };

  const toggleMethod = (method: PaymentMethod) => {
    setExpandedMethod(expandedMethod === method ? null : method);
  };

  // Estado: Procesando pago con tarjeta
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

  // Estado: Error
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

  // Estado: Pago completado (Stripe)
  if (paymentState === "completed" && (selectedMethod === "card" || selectedMethod === "bizum")) {
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
          className="w-full h-14 text-lg font-medium"
        >
          Ver confirmación de reserva
        </Button>
      </div>
    );
  }

  // Estado: Timeout esperando pago (Stripe)
  if (paymentState === "timeout" && (selectedMethod === "card" || selectedMethod === "bizum")) {
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

        {/* Mensaje de timeout */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-amber-800 dark:text-amber-400">
                Tiempo de espera agotado
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Han pasado 10 minutos y no hemos podido verificado automáticamente tu pago.
                Si ya has completado el pago, pulsa el botón de abajo para verificar manualmente.
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

  // Estado: Esperando confirmación (Stripe methods)
  if (paymentState === "waiting" && (selectedMethod === "card" || selectedMethod === "bizum")) {
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

  // Estado: Esperando confirmación (Cajero / Transferencia Manual)
  if (paymentState === "waiting" && (selectedMethod === "cajero" || selectedMethod === "transfer")) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            {selectedMethod === "cajero" ? "Ingreso en Cajero" : "Transferencia Bancaria"}
          </h2>
          <p className="text-muted-foreground">
            {selectedMethod === "cajero" 
              ? "Acude a un cajero y realiza un ingreso en efectivo"
              : "Realiza la transferencia desde la app de tu banco habitual"}
          </p>
        </div>

        <div className="bg-card border-2 border-primary rounded-xl p-6 space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Importe a pagar</p>
            <p className="text-3xl font-bold text-primary">{totalPrice}€</p>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Titular de la cuenta:</span>
              <p className="font-medium text-sm text-foreground">{TITULAR_CUENTA}</p>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">IBAN / Cuenta (BBVA):</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-sm bg-muted p-2 rounded flex-1">{IBAN}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => copyToClipboard(IBAN.replace(/\s/g, ''), 'iban')}>
                  {copied === 'iban' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Concepto:</span>
              <div className="flex items-start gap-2">
                <p className="text-sm font-medium bg-muted p-2 rounded flex-1">{paymentConcept}</p>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => copyToClipboard(paymentConcept, 'concept')}>
                  {copied === 'concept' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-4">
          <p className="text-sm text-amber-700 dark:text-amber-300 text-center font-medium">
            ¡Atención! Para validar tu reserva es obligatorio enviarnos una foto o PDF del justificante bancario.
          </p>
          <Button 
            variant="outline" 
            className="w-full h-11 bg-white dark:bg-transparent border-amber-300 hover:bg-amber-100 text-amber-800 dark:text-amber-400 transition-colors"
            onClick={() => window.open(`mailto:naujaras@proton.me?subject=Justificante de pago - Reserva ${encodeURIComponent(paymentConcept)}&body=Hola,%0D%0A%0D%0AAdjunto el justificante de pago para mi reserva:%0D%0A${encodeURIComponent(paymentConcept)}%0D%0A%0D%0AUn saludo.`, '_blank')}
          >
            ✉️ Enviar correo a naujaras@proton.me
          </Button>
        </div>

        <Button
          onClick={onPendingVerification}
          className="w-full h-14 text-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Check className="mr-2 h-5 w-5" />
          Ya he realizado el {selectedMethod === "cajero" ? "ingreso" : "pago"} y enviado el justificante
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
    );
  }

  // Estado: Selección de método de pago
  return (
    <div className="space-y-8">
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
        {booking.seguroCancelacion && (
          <p className="text-xs opacity-75 mt-1">(incluye {insurancePrice}€ de seguro de cancelación)</p>
        )}
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
                <h3 className="font-medium text-foreground">Tarjeta de Crédito/Débito</h3>
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
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    <strong>Confirmación inmediata:</strong> Tu reserva quedará confirmada al instante.
                  </p>
                </div>
                <Button onClick={() => handleStripePayment("card")} className="w-full h-12">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pagar {totalPrice}€ con tarjeta
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
                <p className="text-xs text-muted-foreground">Pago por Stripe con tu móvil</p>
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
                  Pago seguro a través de la pasarela oficial de Stripe. Selecciona Bizum tras redireccionarte para completar tu reserva.
                </p>
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    <strong>Confirmación automática:</strong> Tu reserva quedará confirmada al instante tras procesar el Bizum en Stripe.
                  </p>
                </div>
                <Button onClick={() => handleStripePayment("bizum")} variant="outline" className="w-full h-12">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Pagar con Bizum
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Transferencia Bancaria */}
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
                <p className="text-xs text-muted-foreground">Pago manual a través de tu banco</p>
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
                  Realiza una transferencia manual a nuestra cuenta bancaria. 
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <strong>Requiere Justificante:</strong> Tendrás que enviarnos una foto o PDF del recibo al correo electrónico para validar la reserva.
                  </p>
                </div>
                <Button onClick={() => handleManualMethodSelect("transfer")} variant="outline" className="w-full h-12">
                  <Building2 className="mr-2 h-4 w-4" />
                  Ver cuenta para Transferencia
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Ingreso en Cajero */}
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
                <h3 className="font-medium text-foreground">Ingreso en Cajero</h3>
                <p className="text-xs text-muted-foreground">Ingreso directo de efectivo</p>
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
                  Realiza el ingreso en efectivo directamente en un cajero de nuestra entidad. Se reflejará al instante.
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <strong>Confirmación manual:</strong> Tu reserva se confirmará cuando el propietario verifique el ingreso.
                  </p>
                </div>
                <Button onClick={() => handleManualMethodSelect("cajero")} variant="outline" className="w-full h-12">
                  <Building2 className="mr-2 h-4 w-4" />
                  Ver número de cuenta bancaria
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
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
