import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, MapPin, Users, Heart, Wine, ChevronDown, ChevronUp, ScrollText, FileSignature, AlertTriangle, Shield, CheckCircle2, ExternalLink, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  BookingData,
  getRoomById,
  getJornadaForRoom,
  formatTimeSlot,
  calculateTotalPrice,
  calculateInsurancePrice,
  DECORATIONS,
  PACKS,
  PERSONA_EXTRA_PRICE
} from "@/lib/bookingConfig";

interface StepConfirmationProps {
  booking: BookingData;
  onBack: () => void;
  onNext: () => void;
  onCommentsChange: (comments: string) => void;
  onCommentFieldsChange: (fields: { generales: string; horaLlegada: string }) => void;
  onSeguroChange: (seguro: boolean) => void;
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

export function StepConfirmation({ 
  booking, 
  onBack, 
  onNext, 
  onCommentsChange, 
  onCommentFieldsChange,
  onSeguroChange
}: StepConfirmationProps) {
  const [showRules, setShowRules] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [hasOpenedRules, setHasOpenedRules] = useState(false);
  const [hasOpenedPolicies, setHasOpenedPolicies] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const [showInsuranceInfo, setShowInsuranceInfo] = useState(false);

  const room = booking.room ? getRoomById(booking.room) : null;
  const jornada = booking.room && booking.jornada ? getJornadaForRoom(booking.room, booking.jornada) : null;
  const decoration = booking.extras.decoracion ? DECORATIONS.find(d => d.id === booking.extras.decoracion) : null;
  const pack = booking.extras.pack ? PACKS.find(p => p.id === booking.extras.pack) : null;
  const totalPrice = calculateTotalPrice(booking);

  const fields = booking.commentFields || { generales: "", horaLlegada: "" };

  const handleFieldChange = (key: keyof typeof fields, value: string) => {
    onCommentFieldsChange({ ...fields, [key]: value });
  };

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
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
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
          {booking.selections && booking.selections.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2 w-full pr-4">
                  <p className="font-medium text-foreground">Fechas y horarios</p>
                  {booking.selections.map((s, idx) => {
                    const j = getJornadaForRoom(booking.room!, s.jornada);
                    return (
                      <div key={idx} className="text-sm border rounded-md p-3 space-y-1">
                        <p className="font-medium text-foreground">{format(s.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">{j?.name}</span>
                          <span className="text-muted-foreground">{j && formatTimeSlot(j.timeSlot)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

          {/* Extras */}
          {(decoration || pack || booking.extras.personasExtra > 0 || booking.seguroCancelacion) && (
            <div className="pt-4 border-t border-border space-y-3">
              <p className="text-sm font-medium text-foreground">Servicios adicionales:</p>
              
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

        {/* Fianza en Efectivo Recordatorio Temprano */}
        <div className="bg-blue-50 dark:bg-blue-950/30 p-4 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Fianza Obligatoria:</strong> Recuerda que el día de tu reserva deberás entregar <strong className="text-base">50€ en efectivo</strong> que te serán devueltos a la salida (no se admite tarjeta ni Bizum para esto).
            </p>
          </div>
        </div>
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
                Para tu tranquilidad, te aconsejamos asegurar la cancelación de tu reserva a través de {" "}
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

          {showInsuranceInfo && (
            <div className="mt-4 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-5 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-sm leading-relaxed text-foreground space-y-4">
                <p>
                  Hemos buscado una aseguradora con prestigio y buen servicio para que pueda asegurar la cancelación de su reserva. Esta aseguradora es <strong>EUROP ASSISTANCE</strong>, aunque puede elegir la externa que usted prefiera.
                </p>
                <p>
                  El seguro tiene un coste aproximado del <strong>5% del importe de la estancia</strong> y puede contratarlo directamente en su plataforma.
                </p>
                
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-normal">
                    <strong>Nota:</strong> El seguro lo contrata usted directamente con ellos. Nosotros no somos intermediarios ni cobramos comisión. Solo le informamos de esta opción por su seguridad.
                  </p>
                </div>

                <div className="space-y-3 bg-slate-900 p-4 rounded-lg text-white">
                  <p className="font-semibold text-white">En caso de tener que cancelar:</p>
                  <ol className="list-decimal list-inside space-y-2 ml-1 text-white">
                    <li>Infórmenos a nosotros de la cancelación.</li>
                    <li>Contacte con la aseguradora para reclamar el importe.</li>
                  </ol>
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-400 font-medium">
                    <strong>⚠️ Importante:</strong> El reembolso depende exclusivamente de la aseguradora. NAUJARAS no participará en esa transacción ni devolverá importes en ningún caso.
                  </p>
                </div>

                {/* Aviso Menos 72h */}
                <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 space-y-2">
                   <p className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                     Aviso: Reservas de última hora
                   </p>
                   <p className="text-sm leading-normal text-slate-700 dark:text-slate-300">
                     Si faltan menos de 72 horas para su reserva, le recomendamos encarecidamente contratar el seguro <strong>en el mismo momento</strong> de abonar la reserva para cumplir con los periodos de carencia externos.
                   </p>
                 </div>

                <div className="text-center mt-6 pt-4 border-t border-border flex flex-col items-center gap-2">
                  <a
                    href="https://europ-assistance.es/seguros-de-viaje/cancelacion-estancia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors w-full sm:w-auto"
                  >
                    Ir a la web para contratar este seguro <ExternalLink className="h-4 w-4" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-2">
                    No olvide volver aquí para continuar con la reserva.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Observaciones estructuradas */}
      <div className="space-y-4">
        <h3 className="text-lg font-serif font-semibold text-foreground">Observaciones de la reserva</h3>
        
        <div className="space-y-2">
          <Label htmlFor="obs-generales">Observaciones generales</Label>
          <Textarea
            id="obs-generales"
            placeholder="Algún detalle adicional que debamos saber..."
            value={fields.generales}
            onChange={(e) => handleFieldChange("generales", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="obs-llegada">Hora estimada de llegada (si será más tarde de la apertura)</Label>
          <Textarea 
            id="obs-llegada"
            placeholder="Ej: Llegaremos sobre las 22:30..."
            value={fields.horaLlegada}
            onChange={(e) => handleFieldChange("horaLlegada", e.target.value)}
            className="h-20"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Esta información ayuda a Náujaras a gestionar mejor tu llegada.
        </p>
      </div>

      {/* Políticas y Normas */}
      <div className="space-y-4">
        {/* Política de Cancelación */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() =>
              setShowPolicies((prev) => {
                const next = !prev;
                if (next) setHasOpenedPolicies(true);
                return next;
              })
            }
            className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ScrollText className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Política de Cancelación</span>
            </div>
            {showPolicies ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {showPolicies && (
            <div className="p-4 pt-0 border-t border-border">
              <div className="space-y-6 mt-4">
                <div className="space-y-3">
                  <h4 className="text-base font-semibold text-foreground">Cambios y cancelaciones</h4>
                  <ul className="space-y-2">
                    <li className="text-sm">
                      <span className="text-muted-foreground whitespace-pre-line">{`CAMBIOS de FECHA o CANCELACIONES:

Una vez formalizada la reserva, NO EXISTE LA POSIBILIDAD DE CANCELAR LA RESERVA y NO SE DEVOLVERÁ en ninguna circunstancia el importe abonado.

No obstante, si tiene algún contratiempo EXISTE LA POSIBILIDAD DE POSPONER LA RESERVA.

Si lo solicita con 7 DÍAS o más para la fecha de la reserva el cambio NO CONLLEVA NINGÚN COSTE para usted. Le guardarnos el dinero abonado hasta que elija otra fecha, con un tiempo máximo de 6 meses a contar desde la fecha de la solicitud.

En caso de que quiera POSPONER LA RESERVA con menos de 7 días y hasta 48 horas antes del comienzo de su estancia, el cambio de fecha conlleva una penalización del 50 % del importe de la reserva. El otro 50 % se le guardará para cuando elija otra fecha, con un tiempo máximo de 6 meses a contar desde la fecha de la solicitud.

NO SE PODRÁ POSPONER LA RESERVA SI FALTAN MENOS DE 48 HORAS para la reserva.`}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
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
              <AlertTriangle className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Normas de Comportamiento y Uso</span>
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
                {RULE_SECTIONS.filter(s => s.title !== "Política de cancelación").map((section) => (
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
      </div>

      <div className="bg-white rounded-xl border border-red-500 overflow-hidden shadow-sm my-6 p-5">
        <div className="flex flex-col items-center text-center gap-3">
          <AlertTriangle className="h-10 w-10 text-red-600 flex-shrink-0" />
          {!(hasOpenedRules && hasOpenedPolicies) && (
            <p className="text-base text-red-600 font-bold">
              Es necesario abrir y leer la política de cancelación y las normas para continuar
            </p>
          )}
          <p className="text-base text-red-600 font-bold">
            La no lectura de las normas de uso supondrá no poder reclamar nada
          </p>
        </div>
      </div>

      {/* Aceptación de normas */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
        <Checkbox
          id="accept-rules"
          checked={acceptedRules}
          onCheckedChange={(checked) => setAcceptedRules(checked === true)}
          disabled={!(hasOpenedRules && hasOpenedPolicies)}
          className="mt-0.5"
        />
        <label
          htmlFor="accept-rules"
          className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
        >
          He leído y acepto la política de cancelación y las normas de la reserva
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
          <CreditCard className="mr-2 h-5 w-5" />
          Proceder al pago
        </Button>
      </div>
    </div>
  );
}
