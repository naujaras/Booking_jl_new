import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, PartyPopper, Calendar, Clock, MapPin, User, Mail, Phone, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  BookingData,
  calculateTotalPrice,
  getRoomById,
  getJornadaForRoom,
  getEffectiveEmail
} from "@/lib/bookingConfig";

const N8N_FINAL_CONFIRMATION_WEBHOOK = "https://n8n-n8n.1owldl.easypanel.host/webhook/f4fe011f-919b-46bf-b5a0-18df06a8573b";
const N8N_PENDING_VALIDATION_WEBHOOK = "https://n8n-n8n.1owldl.easypanel.host/webhook/6e8a005b-9396-4adc-9770-4e41cb8b47c2";
const N8N_BOOKING_REGISTRO_WEBHOOK = "https://n8n-n8n.1owldl.easypanel.host/webhook/c1000a02-ce51-4e58-8ce9-e9db283b9d1a";

// Función auxiliar para formatear fecha y hora en ISO 8601 con timezone España
function formatDateTimeISO(date: Date, time: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  // time viene como "HH:mm", añadimos segundos y milisegundos
  return `${year}-${month}-${day}T${time}:00.000+01:00`;
}

interface StepFinalConfirmationProps {
  booking: BookingData;
  onReset: () => void;
  pendingVerification?: boolean;
}

type ConfirmationState = "sending" | "confirmed" | "error";

export function StepFinalConfirmation({ booking, onReset, pendingVerification = false }: StepFinalConfirmationProps) {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>("sending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalPrice = calculateTotalPrice(booking);
  const room = booking.room ? getRoomById(booking.room) : null;
  const jornada = booking.room && booking.jornada ? getJornadaForRoom(booking.room, booking.jornada) : null;
  const emailToSend = getEffectiveEmail(booking.clientData.email);

  // Enviar datos al webhook cuando se monta el componente
  useEffect(() => {
    const sendConfirmation = async () => {
      // Calcular fecha de entrada y salida en formato ISO 8601
      let dateStart: string | null = null;
      let dateEnd: string | null = null;

      if (booking.date && jornada) {
        const entryDate = new Date(booking.date);
        dateStart = formatDateTimeISO(entryDate, jornada.timeSlot.start);

        // Si la jornada termina al día siguiente
        const exitDate = new Date(booking.date);
        if (jornada.timeSlot.nextDay) {
          exitDate.setDate(exitDate.getDate() + 1);
        }
        dateEnd = formatDateTimeISO(exitDate, jornada.timeSlot.end);
      }

      // Datos comunes para ambos webhooks
      const bookingData = {
        // Datos de la reserva
        room: room?.name,
        roomId: booking.room,
        date: booking.date ? format(booking.date, "yyyy-MM-dd") : null,
        dateFormatted: booking.date ? format(booking.date, "dd/MM/yyyy", { locale: es }) : null,
        jornada: jornada?.name,
        jornadaId: booking.jornada,
        horario: jornada ? `${jornada.timeSlot.start} - ${jornada.timeSlot.end}` : null,
        date_start: dateStart,
        date_end: dateEnd,

        // Datos del cliente
        arrendadorNombre: booking.clientData.arrendadorNombre,
        arrendadorDNI: booking.clientData.arrendadorDni,
        acompananteNombre: booking.clientData.acompananteNombre,
        acompananteDNI: booking.clientData.acompananteDni,
        email: emailToSend,
        telefono: booking.clientData.telefono,

        // Extras
        decoracion: booking.extras.decoracion,
        decoracionDetails: booking.extras.decoracionDetails,
        pack: booking.extras.pack,
        personasExtra: booking.extras.personasExtra,
        comentarios: booking.comments ?? "",

        // Precio
        totalPrice: totalPrice,

        // Metadata
        confirmedAt: new Date().toISOString(),
      };

      try {
        // Siempre llamar al webhook de confirmación final
        const response = await fetch(N8N_FINAL_CONFIRMATION_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        });

        // Si es pago pendiente de verificación (Bizum/Transferencia), también llamar al webhook de validación pendiente
        if (pendingVerification) {
          await fetch(N8N_PENDING_VALIDATION_WEBHOOK, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...bookingData,
              estado: "pendiente_validar",
              metodoPago: "bizum_transferencia",
            }),
          });
        }

        // Siempre llamar al webhook de registro de reserva con método de pago y estado
        await fetch(N8N_BOOKING_REGISTRO_WEBHOOK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...bookingData,
            metodoPago: pendingVerification ? "bizum_transferencia" : "stripe",
            estado: pendingVerification ? "pendiente_confirmacion" : "verificado",
          }),
        });

        if (response.ok) {
          setConfirmationState("confirmed");
        } else {
          throw new Error("Error en la respuesta del servidor");
        }
      } catch (error) {
        console.error("Error sending confirmation:", error);
        setErrorMessage("Error al confirmar la reserva. Por favor, contacta con nosotros.");
        setConfirmationState("error");
      }
    };

    sendConfirmation();
  }, [booking, room, jornada, totalPrice, pendingVerification]);

  // Estado: Verificación pendiente de pago (Bizum/Transferencia)
  if (pendingVerification) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Reserva en verificación
          </h2>
          <p className="text-muted-foreground">
            Hemos recibido tu solicitud de reserva
          </p>
        </div>

        {/* Icono de reloj */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="h-12 w-12 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Mensaje principal */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-amber-800 dark:text-amber-400">
                Pendiente de verificación de pago
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Tu reserva será comprobada para verificar que se ha recibido el pago correctamente.
              </p>
            </div>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-foreground text-center">
            ¿Qué pasará ahora?
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Verificaremos que el pago se ha recibido correctamente
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Te enviaremos un email de confirmación a <strong>{booking.clientData.email}</strong>
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Phone className="h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                También podemos contactarte por teléfono al <strong>{booking.clientData.telefono}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Resumen de la reserva */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-medium text-center text-foreground">Resumen de tu reserva</p>
          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p><strong>{room?.name}</strong></p>
            <p>{booking.date ? format(booking.date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }) : ''}</p>
            <p>{jornada?.name}</p>
            <p className="text-lg font-bold text-primary mt-2">{totalPrice}€</p>
          </div>
        </div>

        {/* Mensaje final */}
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="text-sm text-green-700 dark:text-green-300 text-center">
            <strong>Naujaras Sevilla</strong> se pondrá en contacto contigo vía email o teléfono
            para confirmar tu reserva en cuanto verifiquemos el pago.
          </p>
        </div>

        {/* Botón para volver al inicio */}
        <Button
          onClick={onReset}
          className="w-full h-14 text-lg font-medium"
        >
          Entendido, volver al inicio
        </Button>
      </div>
    );
  }

  // Estado: Enviando confirmación
  if (confirmationState === "sending") {
    return (
      <div className="space-y-8 text-center py-12">
        <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center bg-primary/10">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Confirmando tu reserva...
          </h2>
          <p className="text-muted-foreground">
            Estamos finalizando los detalles de tu reserva
          </p>
        </div>
      </div>
    );
  }

  // Estado: Error
  if (confirmationState === "error") {
    return (
      <div className="space-y-8 text-center py-12">
        <div className="mx-auto w-24 h-24 rounded-full flex items-center justify-center bg-destructive/10">
          <CheckCircle2 className="h-12 w-12 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            Error al confirmar
          </h2>
          <p className="text-muted-foreground">{errorMessage}</p>
        </div>
        <Button onClick={onReset} className="h-12 px-6">
          Volver al inicio
        </Button>
      </div>
    );
  }

  // Estado: Confirmado
  return (
    <div className="space-y-8">
      {/* Cabecera de éxito */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900">
          <PartyPopper className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            ¡Reserva confirmada!
          </h2>
          <p className="text-muted-foreground">
            Tu experiencia romántica está lista. Recibirás un email con todos los detalles.
          </p>
        </div>
      </div>

      {/* Resumen de la reserva */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="bg-primary/5 border-b border-border p-4">
          <h3 className="font-semibold text-foreground text-center">Resumen de tu reserva</h3>
        </div>

        <div className="p-6 space-y-4">
          {/* Sala */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alojamiento</p>
              <p className="font-medium">{room?.name}</p>
            </div>
          </div>

          {/* Fecha */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium">
                {booking.date ? format(booking.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) : "-"}
              </p>
            </div>
          </div>

          {/* Horario */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Horario</p>
              <p className="font-medium">
                {jornada?.name} ({jornada?.timeSlot.start} - {jornada?.timeSlot.end})
              </p>
            </div>
          </div>

          {/* Cliente */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">A nombre de</p>
              <p className="font-medium">{booking.clientData.arrendadorNombre}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{booking.clientData.email}</p>
            </div>
          </div>

          {/* Teléfono */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium">{booking.clientData.telefono}</p>
            </div>
          </div>
        </div>

        {/* Total pagado */}
        <div className="bg-green-50 dark:bg-green-950/30 border-t border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-green-800 dark:text-green-400">Total pagado</span>
            </div>
            <span className="text-xl font-bold text-green-800 dark:text-green-400">{totalPrice}€</span>
          </div>
        </div>
      </div>

      {/* Mensaje final */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center space-y-2">
        <p className="text-foreground font-medium">
          ¡Gracias por confiar en Naujaras!
        </p>
        <p className="text-sm text-muted-foreground">
          Te esperamos para una experiencia inolvidable. Si tienes alguna pregunta,
          no dudes en contactarnos.
        </p>
      </div>

      {/* Botón para nueva reserva */}
      <Button
        onClick={onReset}
        variant="outline"
        className="w-full h-12"
      >
        Realizar otra reserva
      </Button>
    </div>
  );
}
