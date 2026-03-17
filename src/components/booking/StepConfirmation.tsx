import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, MapPin, Users, Heart, Wine, ChevronDown, ChevronUp, ScrollText, FileSignature, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BookingData,
  getRoomById,
  getJornadaForRoom,
  formatTimeSlot,
  calculateTotalPrice,
  DECORATIONS,
  PACKS,
  PERSONA_EXTRA_PRICE
} from "@/lib/bookingConfig";

interface StepConfirmationProps {
  booking: BookingData;
  onBack: () => void;
  onNext: () => void;
  onCommentsChange: (comments: string) => void;
}

const RULE_SECTIONS = [
  {
    title: "Política de cancelación",
    rules: [
      {
        title: "Cambios y cancelaciones",
        description: `CAMBIOS de FECHA o CANCELACIONES:

Una vez formalizada la reserva, NO EXISTE LA POSIBILIDAD DE CANCELAR LA RESERVA y NO SE DEVOLVERÁ en ninguna circunstancia el importe abonado.

No obstante, si tiene algún contratiempo EXISTE LA POSIBILIDAD DE POSPONER LA RESERVA.

Si lo solicita con 7 DÍAS o más para la fecha de la reserva el cambio NO CONLLEVA NINGÚN COSTE para usted. Le guardarnos el dinero abonado hasta que elija otra fecha, con un tiempo máximo de 6 meses a contar desde la fecha de la solicitud.

En caso de que quiera POSPONER LA RESERVA con menos de 7 días y hasta 48 horas antes del comienzo de su estancia, el cambio de fecha conlleva una penalización del 50 % del importe de la reserva. El otro 50 % se le guardará para cuando elija otra fecha, con un tiempo máximo de 6 meses a contar desde la fecha de la solicitud.

NO SE PODRÁ POSPONER LA RESERVA SI FALTAN MENOS DE 48 HORAS para la reserva.`
      }
    ]
  },
  {
    title: "Normas de comportamiento",
    rules: [
      { title: "Visitas y aforo", description: "No se permiten visitas ni entradas de personas no incluidas en la reserva." },
      { title: "Fiestas y ruido", description: "Está totalmente prohibido hacer fiestas o ruidos que molesten a los vecinos." },
      { title: "Tabaco", description: "No se puede fumar dentro del alojamiento." }
    ]
  },
  {
    title: "Prohibiciones",
    rules: [
      { title: "Seguridad en piscina (ático)", description: "Está prohibido saltar a la piscina y también usar vasos, botellas o cualquier objeto de cristal en esa zona." },
      { title: "Higiene en piscina", description: "No se puede verter ningún tipo de producto, bebida o sustancia en la piscina. Si ocurre, se pierde la fianza total." },
      { title: "Uso del jacuzzi", description: "El jacuzzi debe llenarse hasta que el agua cubra por completo los jets antes de encender los chorros o las burbujas (para no quemar el motor)." }
    ]
  },
  {
    title: "Otros puntos importantes",
    rules: [
      { title: "Fianza", description: "Hay una fianza de 50€ en efectivo que se entrega al llegar y se devuelve al salir si se cumplen las normas y todo queda en buen estado." },
      { title: "Uso del agua caliente (crítico)", description: "El agua caliente disponible es la justa para un llenado completo del jacuzzi. Después es necesario esperar entre 4 y 5 horas para que recupere la temperatura." },
      { title: "Llaves", description: "Deben dejarse dentro del alojamiento al salir. Si se pierden, el coste es de 30 €." },
      { title: "Equipamiento", description: "Los textiles, menaje y utensilios son los que aparecen en la documentación oficial." }
    ]
  }
];

export function StepConfirmation({ booking, onBack, onNext, onCommentsChange }: StepConfirmationProps) {
  const [showRules, setShowRules] = useState(false);
  const [hasOpenedRules, setHasOpenedRules] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);

  const room = booking.room ? getRoomById(booking.room) : null;
  const jornada = booking.room && booking.jornada ? getJornadaForRoom(booking.room, booking.jornada) : null;
  const decoration = booking.extras.decoracion ? DECORATIONS.find(d => d.id === booking.extras.decoracion) : null;
  const pack = booking.extras.pack ? PACKS.find(p => p.id === booking.extras.pack) : null;
  const totalPrice = calculateTotalPrice(booking);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif font-semibold text-foreground">
          Confirma tu reserva
        </h2>
        <p className="text-muted-foreground">
          Revisa los detalles antes de confirmar
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary text-primary-foreground">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">{room?.name}</h3>
              <p className="text-sm text-muted-foreground">Naujaras Sevilla</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-4">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                {booking.date && format(booking.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
              <p className="text-sm text-muted-foreground">{jornada?.name}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                {jornada && formatTimeSlot(jornada.timeSlot)}
              </p>
            </div>
          </div>

          {/* Extras */}
          {(decoration || pack || booking.extras.personasExtra > 0) && (
            <div className="pt-4 border-t border-border space-y-3">
              <p className="text-sm font-medium text-foreground">Extras seleccionados:</p>
              
              {decoration && (
                <div className="flex items-center gap-3 text-sm">
                  <Heart className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{decoration.name}</span>
                  <span className="ml-auto font-medium">+{decoration.price}€</span>
                </div>
              )}
              
              {pack && (
                <div className="flex items-center gap-3 text-sm">
                  <Wine className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">{pack.name}</span>
                  <span className="ml-auto font-medium">+{pack.price}€</span>
                </div>
              )}
              
              {booking.extras.personasExtra > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    {booking.extras.personasExtra} persona{booking.extras.personasExtra > 1 ? "s" : ""} extra
                  </span>
                  <span className="ml-auto font-medium">
                    +{booking.extras.personasExtra * PERSONA_EXTRA_PRICE}€
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Client Data */}
          <div className="pt-4 border-t border-border space-y-3">
            <p className="text-sm font-medium text-foreground">Datos de contacto:</p>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arrendador:</span>
                <span className="font-medium">{booking.clientData.arrendadorNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Acompañante:</span>
                <span className="font-medium">{booking.clientData.acompananteNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{booking.clientData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Teléfono:</span>
                <span className="font-medium">{booking.clientData.telefono}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="bg-primary text-primary-foreground p-6">
          <div className="flex items-center justify-between">
            <span className="text-lg">Total a pagar</span>
            <span className="text-3xl font-bold">{totalPrice}€</span>
          </div>
        </div>
      </div>

      {/* Comentarios */}
      <div className="space-y-2">
        <Label htmlFor="comentarios">Comentarios para el propietario (opcional)</Label>
        <Textarea
          id="comentarios"
          placeholder="Ej: Llegaremos sobre las 22:30, agradeceríamos check-in tardío."
          value={booking.comments ?? ""}
          onChange={(e) => onCommentsChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Añade indicaciones especiales, horarios estimados o cualquier detalle que debamos saber.
        </p>
      </div>

      {/* Normas de la Reserva */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() =>
            setShowRules((prev) => {
              const next = !prev;
              if (next) setHasOpenedRules(true);
              return next;
            })
          }
          className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ScrollText className="h-5 w-5 text-primary" />
            <span className="font-medium text-foreground">Normas de la Reserva</span>
          </div>
          {showRules ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {showRules && (
          <div className="p-4 pt-0 border-t border-border">
            <div className="space-y-6 mt-4">
              {RULE_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-3">
                  <h4 className="text-base font-semibold text-foreground">{section.title}</h4>
                  <ul className="space-y-2">
                    {section.rules.map((rule) => (
                      <li key={rule.title} className="text-sm">
                        <span className="font-medium text-foreground">{rule.title}:</span>{" "}
                        <span className="text-muted-foreground whitespace-pre-line">{rule.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {!hasOpenedRules && (
        <p className="text-sm text-destructive font-semibold px-1">
          Es necesario abrir y leer las normas para continuar.
        </p>
      )}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/40 bg-destructive/10">
        <AlertTriangle className="h-6 w-6 text-destructive mt-0.5" />
        <p className="text-sm sm:text-base text-destructive font-semibold leading-relaxed">
          * La no lectura de las normas de uso supondrá no poder reclamar nada.
        </p>
      </div>

      {/* Aceptación de normas */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
        <Checkbox
          id="accept-rules"
          checked={acceptedRules}
          onCheckedChange={(checked) => setAcceptedRules(checked === true)}
          className="mt-0.5"
        />
        <label
          htmlFor="accept-rules"
          className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
        >
          He leído y acepto las{" "}
          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="text-primary hover:underline font-medium"
          >
            normas de la reserva
          </button>{" "}
          y la política de cancelación
        </label>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 h-14 text-lg"
        >
          Atrás
        </Button>
        <Button
          onClick={onNext}
          disabled={!acceptedRules || !hasOpenedRules}
          className="flex-1 h-14 text-lg font-medium"
        >
          <FileSignature className="mr-2 h-5 w-5" />
          Continuar con la firma
        </Button>
      </div>
    </div>
  );
}
