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
const IBAN = "ES00 0000 0000 0000 0000 0000"; // ← TODO: REEMPLAZAR CON TU IBAN REAL PARA TRANSFERENCIAS
const POLLING_INTERVAL = 60000; // 1 minuto
const MAX_ATTEMPTS = 10; // 10 intentos = 10 minutos

interface StepPaymentProps {
  booking: BookingData;
  onBack: () => void;
  onNext: () => void;
  onReset: () => void;
  onPendingVerification: () => void;
  onSeguroChange: (seguro: boolean) => void;
}

type PaymentMethod = "card" | "bizum" | "transfer" | null;
type PaymentState = "selecting" | "processing" | "waiting" | "timeout" | "completed" | "error";

interface PaymentStatusResponse {
  payment_status?: string;
  payment_link_id?: string;
  paid_at?: string;
}

export function StepPayment({ booking, onBack, onNext, onReset, onPendingVerification, onSeguroChange }: StepPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [expandedMethod, setExpandedMethod] = useState<PaymentMethod>("card");
  const [paymentState, setPaymentState] = useState<PaymentState>("selecting");
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [showInsuranceInfo, setShowInsuranceInfo] = useState(false);

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

  const handleCardPayment = async () => {
    setPaymentState("processing");
    setSelectedMethod("card");
    setAttempts(0); // Reset attempts when starting payment

    try {
      const response = await fetch(N8N_STRIPE_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalPrice,
          email: userEmail,
          name: booking.clientData.arrendadorNombre,
          room: room?.name,
          date: booking.date ? format(booking.date, "yyyy-MM-dd") : null,
          jornada: jornada?.name,
          concept: paymentConcept,
          insurance: booking.seguroCancelacion // Informar si lleva seguro
        })
      });

      const data = await response.json();
      // ... rest of the function


      // Esperamos que n8n devuelva una URL de pago
      const paymentUrl = Array.isArray(data) ? data[0]?.url : data?.url;

      if (paymentUrl) {
        setStripeUrl(paymentUrl);
        setPaymentState("waiting");
        window.open(paymentUrl, '_blank');
      } else {
        throw new Error("No se recibió URL de pago");
      }
    } catch (error) {
      setErrorMessage("Error al generar el enlace de pago. Inténtalo de nuevo.");
      setPaymentState("error");
    }
  };

  const handleBizumSelect = () => {
    setSelectedMethod("bizum");
    setPaymentState("waiting");
  };

  const handleTransferSelect = () => {
    setSelectedMethod("transfer");
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

  // Estado: Pago completado (Tarjeta)
  if (paymentState === "completed" && selectedMethod === "card") {
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

  // Estado: Timeout esperando pago (Tarjeta)
  if (paymentState === "timeout" && selectedMethod === "card") {
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
                Han pasado 10 minutos y no hemos podido verificar automáticamente tu pago.
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

  // Estado: Esperando confirmación (Tarjeta)
  if (paymentState === "waiting" && selectedMethod === "card") {
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

  // Estado: Esperando confirmación (Bizum)
  if (paymentState === "waiting" && selectedMethod === "bizum") {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Pago con Bizum
          </h2>
          <p className="text-muted-foreground">
            Realiza el pago y envía el comprobante por WhatsApp
          </p>
        </div>

        <div className="bg-card border-2 border-primary rounded-xl p-6 space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Importe a pagar</p>
            <p className="text-3xl font-bold text-primary">{totalPrice}€</p>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Teléfono Bizum:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold">{BIZUM_PHONE}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(BIZUM_PHONE.replace(/\s/g, ''), 'phone')}
                >
                  {copied === 'phone' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Concepto:</span>
              <div className="flex items-start gap-2">
                <p className="text-sm font-medium bg-muted p-2 rounded flex-1">{paymentConcept}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => copyToClipboard(paymentConcept, 'concept')}
                >
                  {copied === 'concept' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm text-amber-700 dark:text-amber-300 text-center">
            <strong>⚠️ Atención:</strong> Tu reserva <strong>NO está confirmada</strong> hasta que Juan valide el pago manualmente. 
            Es imprescindible enviar el comprobante por WhatsApp ahora mismo.
          </p>
        </div>

        <Button
          onClick={openWhatsApp}
          className="w-full h-14 text-lg font-medium bg-green-600 hover:bg-green-700"
        >
          <Smartphone className="mr-2 h-5 w-5" />
          Enviar comprobante por WhatsApp
        </Button>

        <Button
          onClick={onPendingVerification}
          variant="outline"
          className="w-full h-12 border-primary text-primary hover:bg-primary/10"
        >
          <Check className="mr-2 h-4 w-4" />
          Ya he enviado el comprobante por WhatsApp
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

  // Estado: Esperando confirmación (Transferencia)
  if (paymentState === "waiting" && selectedMethod === "transfer") {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Transferencia Bancaria
          </h2>
          <p className="text-muted-foreground">
            Realiza la transferencia y envía el comprobante por WhatsApp
          </p>
        </div>

        <div className="bg-card border-2 border-primary rounded-xl p-6 space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Importe a pagar</p>
            <p className="text-3xl font-bold text-primary">{totalPrice}€</p>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">IBAN:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-sm bg-muted p-2 rounded flex-1">{IBAN}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => copyToClipboard(IBAN.replace(/\s/g, ''), 'iban')}
                >
                  {copied === 'iban' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Concepto:</span>
              <div className="flex items-start gap-2">
                <p className="text-sm font-medium bg-muted p-2 rounded flex-1">{paymentConcept}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => copyToClipboard(paymentConcept, 'concept')}
                >
                  {copied === 'concept' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-sm text-amber-700 dark:text-amber-300 text-center">
            <strong>Importante:</strong> Envía el justificante de transferencia por WhatsApp
            para confirmar tu reserva manualmente.
          </p>
        </div>

        <Button
          onClick={openWhatsApp}
          className="w-full h-14 text-lg font-medium bg-green-600 hover:bg-green-700"
        >
          <Smartphone className="mr-2 h-5 w-5" />
          Enviar comprobante por WhatsApp
        </Button>

        <Button
          onClick={onPendingVerification}
          variant="outline"
          className="w-full h-12 border-primary text-primary hover:bg-primary/10"
        >
          <Check className="mr-2 h-4 w-4" />
          Ya he enviado el comprobante por WhatsApp
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

      {/* Seguro de Cancelación - Flujo simplificado para usuarios "cazurritos" */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-base text-foreground leading-relaxed">
                Existe la posibilidad de contratar un seguro de cancelación de la reserva con{" "}
                <button
                  onClick={() => setShowInsuranceInfo(!showInsuranceInfo)}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline decoration-2 underline-offset-4 decoration-indigo-200 dark:decoration-indigo-800 transition-all"
                >
                  EUROP ASSISTANCE
                </button>.
              </p>
              <p className="text-sm text-muted-foreground italic">
                Tenga en cuenta que NAUJARÁS no devuelve el dinero de la reserva, solo permite cambios de fecha.
              </p>
            </div>
          </div>

          {/* Info desplegable con el checkbox al final */}
          {showInsuranceInfo && (
            <div className="mt-4 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-5 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-sm leading-relaxed text-foreground space-y-4">
                <p>
                  Hemos buscado una aseguradora con prestigio y buen servicio para que pueda asegurar la cancelación de su reserva.
                </p>
                <p>
                  Esta aseguradora es <strong>EUROP ASSISTANCE</strong>, aunque si usted quiere puede buscar otra y asegurarla en la que prefiera.
                </p>
                <p>
                  Por un <strong>5% del importe de la estancia</strong> puede asegurar la cancelación por si tiene algún contratiempo imprevisto justificado que le impida asistir.
                </p>
                
                <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                  <p className="text-xs text-muted-foreground leading-normal">
                    <strong>Nota:</strong> El seguro lo contrata usted. Nosotros no somos intermediarios ni cobramos comisión. Solo le informamos de esta opción por su seguridad.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="font-semibold text-indigo-900 dark:text-indigo-300">En caso de tener que cancelar:</p>
                  <ol className="list-decimal list-inside space-y-2 ml-1 text-muted-foreground">
                    <li>Infórmenos a nosotros de la cancelación.</li>
                    <li>Contacte con la aseguradora para reclamar el importe.</li>
                  </ol>
                </div>

                <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 rounded-lg">
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    <strong>⚠️ Importante:</strong> El reembolso depende exclusivamente de la aseguradora. Si esta deniega el caso por no estar en sus condiciones, NAUJARAS no devolverá el importe.
                  </p>
                </div>

                {/* Aviso 72h dinámico */}
                {(() => {
                  const hoursToBooking = booking.date 
                    ? (booking.date.getTime() - new Date().getTime()) / (1000 * 60 * 60)
                    : 100;
                  const isLastMinute = hoursToBooking < 72;

                  return (
                    <div className={cn(
                      "p-4 rounded-lg border space-y-2 transition-colors",
                      isLastMinute 
                        ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 shadow-sm"
                        : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800"
                    )}>
                      <p className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        isLastMinute ? "text-red-700 dark:text-red-400" : "text-gray-700 dark:text-gray-400"
                      )}>
                        {isLastMinute ? "🚨 AVISO URGENTE: Reserva de Última Hora" : "Nota para reservas rápidas"}
                      </p>
                      <p className="text-xs leading-normal">
                        Si faltan menos de 72 horas para su reserva, le recomendamos encarecidamente contratar el seguro <strong>en el mismo momento</strong> de abonar la reserva para evitar los 3 días de carencia del seguro.
                      </p>
                    </div>
                  );
                })()}

                {/* El Checkbox que hace la magia */}
                <div className="pt-6 border-t border-indigo-100 dark:border-indigo-900/50">
                  <label className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer",
                    booking.seguroCancelacion 
                      ? "bg-indigo-600 border-indigo-700 text-white shadow-md ring-4 ring-indigo-100 dark:ring-indigo-900/20" 
                      : "bg-white dark:bg-gray-900 border-indigo-100 dark:border-indigo-900 hover:border-indigo-300"
                  )}>
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={booking.seguroCancelacion}
                        onChange={(e) => onSeguroChange(e.target.checked)}
                        className="h-6 w-6 rounded border-2 border-indigo-300 text-white focus:ring-transparent accent-white cursor-pointer"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="block font-bold text-sm">
                        Sí, deseo contratar el seguro de cancelación
                      </span>
                      <span className={cn(
                        "block text-xs mt-0.5",
                        booking.seguroCancelacion ? "text-indigo-100" : "text-muted-foreground"
                      )}>
                        Se incrementará automáticamente un 5% (+{insurancePrice}€)
                      </span>
                    </div>
                    {booking.seguroCancelacion && <CheckCircle2 className="h-5 w-5 text-indigo-200" />}
                  </label>
                </div>

                <div className="text-center">
                  <a
                    href="https://europ-assistance.es/seguros-de-viaje/cancelacion-estancia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                  >
                    Ver web oficial de Europ Assistance <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
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
                <Button onClick={handleCardPayment} className="w-full h-12">
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
                <p className="text-xs text-muted-foreground">Pago desde tu móvil</p>
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
                  Envía un Bizum al número <strong>{BIZUM_PHONE}</strong> con el concepto indicado y
                  después envía una captura del comprobante por WhatsApp.
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <strong>Confirmación manual:</strong> Tu reserva se confirmará cuando el propietario verifique el pago.
                  </p>
                </div>
                <Button onClick={handleBizumSelect} variant="outline" className="w-full h-12">
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
                <p className="text-xs text-muted-foreground">Transferencia o ingreso en cajero</p>
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
                  Realiza una transferencia bancaria o ingreso en cajero y envía el justificante por WhatsApp.
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <strong>Confirmación manual:</strong> Tu reserva se confirmará cuando el propietario verifique el pago.
                  </p>
                </div>
                <Button onClick={handleTransferSelect} variant="outline" className="w-full h-12">
                  <Building2 className="mr-2 h-4 w-4" />
                  Pagar por transferencia
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
