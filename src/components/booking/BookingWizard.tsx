import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepSearch } from "./StepSearch";
import { StepExtras } from "./StepExtras";
import { StepClientData } from "./StepClientData";
import { StepConfirmation } from "./StepConfirmation";
import { StepContractSigning } from "./StepContractSigning";
import { StepPayment } from "./StepPayment";
import { StepFinalConfirmation } from "./StepFinalConfirmation";
import { PriceSummary } from "./PriceSummary";
import { Chatbot } from "./Chatbot";
import {
  BookingData,
  RoomId,
  JornadaType,
  DecorationType,
  PackType,
  ClientData,
  DecorationDetails,
  getRoomById,
  sendFinalRegistroWebhook,
  fetchJornadaPrices
} from "@/lib/bookingConfig";

const STEPS = [
  { id: 1, name: "Búsqueda" },
  { id: 2, name: "Extras" },
  { id: 3, name: "Datos" },
  { id: 4, name: "Resumen" },
  { id: 5, name: "Pago" },
  { id: 6, name: "Contrato" },
  { id: 7, name: "Confirmación" }
];

const initialClientData: ClientData = {
  arrendadorNombre: "",
  arrendadorDni: "",
  acompananteNombre: "",
  acompananteDni: "",
  email: "",
  telefono: ""
};

const initialBookingData: BookingData = {
  room: null,
  date: null,
  jornada: null,
  jornadaPrice: null,
  selections: [],
  comments: "",
  extras: {
    decoracion: null,
    decoracionDetails: {
      iniciales: "",
      numero: ""
    },
    pack: null,
    personasExtra: 0
  },
  seguroCancelacion: false,
  clientData: initialClientData,
  commentFields: {
    generales: "",
    horaLlegada: ""
  }
};

const getInitialBookingData = (): BookingData => {
  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get("room") as RoomId | null;
  const dateParam = params.get("date");
  const slotParam = params.get("slot");

  let parsedDate: Date | null = null;
  if (dateParam) {
    const [y, m, d] = dateParam.split("-").map(Number);
    if (y && m && d) {
      parsedDate = new Date(y, m - 1, d);
    }
  }

  let parsedJornada: JornadaType | null = null;
  if (slotParam) {
    const slotMap: Record<string, JornadaType> = {
      "Día": "dia",
      "Noche": "noche",
      "Día Entero (mañana)": "dia_entero_manana",
      "Día Entero (noche)": "dia_entero_noche"
    };
    if (slotMap[slotParam]) {
      parsedJornada = slotMap[slotParam];
    } else {
      const s = slotParam.toLowerCase();
      if (s.includes("mañana") || s.includes("manana")) parsedJornada = "dia_entero_manana";
      else if (s.includes("noche") && s.includes("entero")) parsedJornada = "dia_entero_noche";
      else if (s.includes("noche")) parsedJornada = "noche";
      else if (s.includes("día") || s.includes("dia")) parsedJornada = "dia";
    }
  }

  let initialSelections: import("@/lib/bookingConfig").BookingSelection[] = [];
  if (parsedDate && parsedJornada && roomParam) {
    const roomObj = getRoomById(roomParam);
    const jConfig = roomObj?.jornadas.find((x: any) => x.id === parsedJornada);
    if (jConfig) {
      initialSelections = [{ date: parsedDate, jornada: parsedJornada, price: 0 }]; // Inicializar a 0 para que sea n8n quien dé el precio
    }
  }

  return {
    ...initialBookingData,
    room: roomParam,
    date: parsedDate,
    jornada: parsedJornada,
    selections: initialSelections
  };
};

export function BookingWizard() {
  const [booking, setBooking] = useState<BookingData>(() => {
    const saved = sessionStorage.getItem('naujaras_booking');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed.selections) {
          // Convert string dates back to Date objects
          parsed.selections = parsed.selections.map((s: any) => ({
            ...s,
            date: s.date ? new Date(s.date) : null
          }));
        }
        if (parsed.date) {
          parsed.date = new Date(parsed.date);
        }
        return parsed;
      } catch (e) {}
    }
    return getInitialBookingData();
  });

  const [currentStep, setCurrentStep] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_success') === 'true') {
      return 6; // Automatically go to contract step if returning from Stripe
    }
    const savedStep = sessionStorage.getItem('naujaras_step');
    if (savedStep) {
      return parseInt(savedStep, 10);
    }
    return 1; // Ya no saltamos al paso 2 a ciegas. Esperamos a que n8n confirme el precio en el useEffect.
  });
  const [paymentPendingVerification, setPaymentPendingVerification] = useState(false);
  const [hubError, setHubError] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('naujaras_booking', JSON.stringify(booking));
  }, [booking]);

  useEffect(() => {
    sessionStorage.setItem('naujaras_step', currentStep.toString());
  }, [currentStep]);

  // Asegurar scroll position arriba al cambiar de paso
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Sincronizar con cambios en la URL (importante para redirecciones del Hub)
  useEffect(() => {
    const data = getInitialBookingData();
      setBooking(prev => {
        const isNewHubRequest = !!(data.room && data.date && data.jornada);
        const isSameBooking = prev.room === data.room && 
                              prev.date?.getTime() === data.date?.getTime() && 
                              prev.jornada === data.jornada;

        if (isNewHubRequest && !isSameBooking) {
          return {
            ...prev,
            room: data.room,
            date: data.date,
            jornada: data.jornada,
            selections: data.selections,
            jornadaPrice: data.selections[0]?.price
          };
        }
        return prev; // Si es la misma reserva, conservamos el prev (que ya tiene el precio dinámico de sessionStorage)
      });

      // Si tenemos los 3 datos, intentamos cargar el precio dinámico si no lo tenemos aún
      if (data.room && data.date && data.jornada) {
        fetchJornadaPrices(data.date, data.room).then(prices => {
          if (prices && prices[data.jornada as string] !== undefined) {
            const dynamicPrice = prices[data.jornada as string];
            setBooking(prev => {
              const newSelections = prev.selections.map(s => 
                (s.jornada === data.jornada && s.date?.getTime() === data.date?.getTime()) 
                  ? { ...s, price: dynamicPrice } 
                  : s
              );
              return { 
                ...prev, 
                jornadaPrice: dynamicPrice, 
                selections: newSelections 
              };
            });
            // Avanzamos al paso 2 si venimos limpios del paso 1
            setCurrentStep(curr => curr === 1 ? 2 : curr);
          } else {
            console.error("Error: n8n no devolvió el precio para esta jornada al venir del Hub.");
            setHubError(true);
            setBooking(initialBookingData);
            window.history.replaceState({}, '', window.location.pathname);
            sessionStorage.removeItem('naujaras_booking');
            sessionStorage.removeItem('naujaras_step');
          }
        }).catch(err => {
          console.error("Error crítico cargando precio dinámico para URL:", err);
          setHubError(true);
          setBooking(initialBookingData);
          window.history.replaceState({}, '', window.location.pathname);
          sessionStorage.removeItem('naujaras_booking');
          sessionStorage.removeItem('naujaras_step');
        });
        
        // Limpiamos la URL para evitar que al refrescar o ir hacia atrás se vuelva a leer
        window.history.replaceState({}, '', window.location.pathname);
      }
  }, []);

  const handleRoomChange = (room: RoomId) => {
    setBooking({ ...booking, room, jornada: null, date: null, selections: [], extras: { ...booking.extras, personasExtra: 0 } });
  };

  const handleDateChange = (date: Date | null) => {
    setBooking({ ...booking, date });
  };

  const handleJornadaChange = (jornada: JornadaType, price?: number) => {
    const shouldResetPersonas = !(booking.room === "atico" && jornada === "dia");
    setBooking({
      ...booking,
      jornada,
      jornadaPrice: price ?? null,
      extras: {
        ...booking.extras,
        personasExtra: shouldResetPersonas ? 0 : booking.extras.personasExtra
      }
    });
  };

  const handleAddSelection = (date: Date, jornada: JornadaType, price: number) => {
    const newSelections = [...booking.selections, { date, jornada, price }];
    const first = newSelections[0];
    
    // Check if we need to reset personas (only valid for "atico" in "dia")
    const canStillHavePersonas = newSelections.some(s => s.jornada === "dia") && booking.room === "atico";

    setBooking(prev => ({
      ...prev,
      selections: newSelections,
      date: first.date,
      jornada: first.jornada,
      jornadaPrice: first.price,
      extras: {
        ...prev.extras,
        personasExtra: canStillHavePersonas ? prev.extras.personasExtra : 0
      }
    }));
  };

  const handleRemoveSelection = (index: number) => {
    const newSelections = booking.selections.filter((_, i) => i !== index);
    const first = newSelections[0] || { date: null, jornada: null, price: null };
    
    const canStillHavePersonas = newSelections.some(s => s.jornada === "dia") && booking.room === "atico";

    setBooking(prev => ({
      ...prev,
      selections: newSelections,
      date: first.date || null,
      jornada: first.jornada || null,
      jornadaPrice: first.price !== undefined ? first.price : null,
      extras: {
        ...prev.extras,
        personasExtra: canStillHavePersonas ? prev.extras.personasExtra : 0
      }
    }));
  };

  const handleDecoracionChange = (decoracion: DecorationType | null) => {
    setBooking({
      ...booking,
      extras: {
        ...booking.extras,
        decoracion,
        decoracionDetails: decoracion ? booking.extras.decoracionDetails : { iniciales: "", numero: "" }
      }
    });
  };

  const handleDecoracionDetailsChange = (details: DecorationDetails) => {
    setBooking({
      ...booking,
      extras: {
        ...booking.extras,
        decoracionDetails: details
      }
    });
  };

  const handlePackChange = (pack: PackType | null) => {
    setBooking({ ...booking, extras: { ...booking.extras, pack } });
  };

  const handlePersonasExtraChange = (personasExtra: number) => {
    setBooking({ ...booking, extras: { ...booking.extras, personasExtra } });
  };

  const handleClientDataChange = (clientData: ClientData) => {
    setBooking({ ...booking, clientData });
  };

  const handleCommentFieldsChange = (fields: { generales: string; horaLlegada: string }) => {
    setBooking({ ...booking, commentFields: fields });
  };

  const handleCommentsChange = (comments: string) => {
    setBooking({ ...booking, comments });
  };

  const handleSeguroChange = (seguroCancelacion: boolean) => {
    setBooking({ ...booking, seguroCancelacion });
  };

  const renderStep = () => {
    if (hubError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-6 animate-in fade-in duration-500">
          <div className="bg-destructive/10 text-destructive p-5 rounded-full ring-8 ring-destructive/5">
            <AlertTriangle className="h-14 w-14" />
          </div>
          <h2 className="text-3xl font-bold font-serif text-foreground">¡Vaya! Algo ha fallado</h2>
          <p className="text-muted-foreground text-lg max-w-md">
            No hemos podido conectar con el sistema de tarifas para comprobar el precio. Puede ser un error de conexión temporal.
          </p>
          <Button 
            onClick={() => {
              setHubError(false);
              setBooking(initialBookingData);
              setCurrentStep(1);
              window.history.replaceState({}, '', window.location.pathname);
              sessionStorage.removeItem('naujaras_booking');
              sessionStorage.removeItem('naujaras_step');
            }} 
            size="lg"
            className="mt-4 h-12 px-8 text-base shadow-md"
          >
            Volver al inicio e intentarlo de nuevo
          </Button>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <StepSearch
            selectedRoom={booking.room}
            selections={booking.selections}
            onRoomChange={handleRoomChange}
            onAddSelection={handleAddSelection}
            onRemoveSelection={handleRemoveSelection}
            onNext={() => setCurrentStep(2)}
          />
        );
      case 2:
        return (
          <StepExtras
            selectedRoom={booking.room}
            selectedJornada={booking.jornada}
            selectedDecoracion={booking.extras.decoracion}
            decoracionDetails={booking.extras.decoracionDetails}
            selectedPack={booking.extras.pack}
            personasExtra={booking.extras.personasExtra}
            onDecoracionChange={handleDecoracionChange}
            onDecoracionDetailsChange={handleDecoracionDetailsChange}
            onPackChange={handlePackChange}
            onPersonasExtraChange={handlePersonasExtraChange}
            onNext={() => {
              const hasZeroPrice = booking.selections.some(sel => !sel.price || sel.price <= 0);
              if (hasZeroPrice || booking.selections.length === 0) {
                setHubError(true);
                return;
              }
              setCurrentStep(3);
            }}
            onBack={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <StepClientData
            clientData={booking.clientData}
            onClientDataChange={handleClientDataChange}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        );
      case 4:
        return (
          <StepConfirmation
            booking={booking}
            onBack={() => setCurrentStep(3)}
            onNext={() => {
              if (!booking.bookingId) {
                setBooking(prev => ({ ...prev, bookingId: `NJ-${Date.now()}` }));
              }
              setCurrentStep(5);
            }}
            onCommentsChange={handleCommentsChange}
            onCommentFieldsChange={handleCommentFieldsChange}
            onSeguroChange={handleSeguroChange}
          />
        );
      case 5:
        return (
          <StepPayment
            booking={booking}
            onBack={() => setCurrentStep(4)}
            onNext={() => setCurrentStep(6)}
            onReset={handleReset}
            onPendingVerification={handlePaymentPendingVerification}
            onBookingCreated={(paymentUrl, contractUrl, bookingId) => {
              setBooking(prev => ({ 
                ...prev, 
                ...(paymentUrl ? { paymentUrl } : {}),
                ...(contractUrl ? { contractUrl } : {}),
                ...(bookingId ? { bookingId } : {})
              }));
            }}
          />
        );
      case 6:
        return (
          <StepContractSigning
            booking={booking}
            onBack={() => setCurrentStep(5)}
            onNext={() => setCurrentStep(7)}
            onReset={handleReset}
          />
        );
      case 7:
        return (
          <StepFinalConfirmation
            booking={booking}
            onReset={handleReset}
            pendingVerification={paymentPendingVerification}
          />
        );
      default:
        return null;
    }
  };

  const handleReset = () => {
    setBooking(initialBookingData);
    setCurrentStep(1);
    setPaymentPendingVerification(false);
  };

  const handlePaymentPendingVerification = async () => {
    try {
      // Asegurarse de que toda la info se envía a Confirmación y Calendario
      // El webhook principal ya incluye la lógica para mandar el email de "Revisar Banco"
      await sendFinalRegistroWebhook(booking, true);

      setPaymentPendingVerification(true);
      setCurrentStep(7);
    } catch (error) {
      console.error("Error enviando webhook de registro pendiente:", error);
      // Avanzamos de todas formas para no bloquear al usuario
      setPaymentPendingVerification(true);
      setCurrentStep(7);
    }
  };

  const showPriceSummary = currentStep >= 1 && currentStep <= 4 && booking.room && (booking.selections.length > 0 || booking.jornada);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {step.id}
                  </div>
                  <span className={cn(
                    "hidden sm:block text-xs mt-2 text-center transition-colors whitespace-nowrap",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "hidden sm:block flex-1 h-0.5 mx-2 mt-4 transition-colors",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {showPriceSummary && (
            <div className="block lg:hidden mb-6">
              <PriceSummary booking={booking} />
            </div>
          )}

          {currentStep === 1 && (
            <StepSearch
              selectedRoom={booking.room}
              selections={booking.selections}
              onRoomChange={handleRoomChange}
              onAddSelection={handleAddSelection}
              onRemoveSelection={handleRemoveSelection}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && booking.room && (booking.selections.length > 0 || booking.jornada) && (
            <StepExtras
              selectedRoom={booking.room}
              selectedJornada={booking.jornada}
              selectedDecoracion={booking.extras.decoracion}
              decoracionDetails={booking.extras.decoracionDetails}
              selectedPack={booking.extras.pack}
              personasExtra={booking.extras.personasExtra}
              onDecoracionChange={handleDecoracionChange}
              onDecoracionDetailsChange={handleDecoracionDetailsChange}
              onPackChange={handlePackChange}
              onPersonasExtraChange={handlePersonasExtraChange}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <StepClientData
              clientData={booking.clientData}
              onClientDataChange={handleClientDataChange}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <StepConfirmation
              booking={booking}
              onBack={() => setCurrentStep(3)}
              onNext={() => {
                if (!booking.bookingId) {
                  setBooking(prev => ({ ...prev, bookingId: `NJ-${Date.now()}` }));
                }
                setCurrentStep(5);
              }}
              onCommentsChange={handleCommentsChange}
              onCommentFieldsChange={handleCommentFieldsChange}
              onSeguroChange={handleSeguroChange}
            />
          )}

          {currentStep === 5 && (
            <StepPayment
              booking={booking}
              onBack={() => setCurrentStep(4)}
              onNext={() => setCurrentStep(6)}
              onReset={handleReset}
              onPendingVerification={handlePaymentPendingVerification}
              onBookingCreated={(paymentUrl, contractUrl, bookingId) => {
                setBooking(prev => ({ 
                  ...prev, 
                  ...(paymentUrl ? { paymentUrl } : {}),
                  ...(contractUrl ? { contractUrl } : {}),
                  ...(bookingId ? { bookingId } : {})
                }));
              }}
            />
          )}

          {currentStep === 6 && (
            <StepContractSigning
              booking={booking}
              onBack={() => setCurrentStep(5)}
              onNext={() => setCurrentStep(7)}
              onReset={handleReset}
            />
          )}

          {currentStep === 7 && (
            <StepFinalConfirmation
              booking={booking}
              onReset={handleReset}
              pendingVerification={paymentPendingVerification}
            />
          )}

          {showPriceSummary && (
            <div className="fixed bottom-24 right-4 w-72 hidden lg:block z-40">
              <PriceSummary booking={booking} />
            </div>
          )}
        </div>
      </div>
      <Chatbot />
    </div>
  );
}
