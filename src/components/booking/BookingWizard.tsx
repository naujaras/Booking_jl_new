import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { StepSearch } from "./StepSearch";
import { StepExtras } from "./StepExtras";
import { StepClientData } from "./StepClientData";
import { StepConfirmation } from "./StepConfirmation";
import { StepContractSigning } from "./StepContractSigning";
import { StepPayment } from "./StepPayment";
import { StepFinalConfirmation } from "./StepFinalConfirmation";
import { PriceSummary } from "./PriceSummary";
import {
  BookingData,
  RoomId,
  JornadaType,
  DecorationType,
  PackType,
  ClientData,
  DecorationDetails
} from "@/lib/bookingConfig";

const STEPS = [
  { id: 1, name: "Búsqueda" },
  { id: 2, name: "Extras" },
  { id: 3, name: "Datos" },
  { id: 4, name: "Resumen" },
  { id: 5, name: "Contrato" },
  { id: 6, name: "Pago" },
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
    horaLlegada: "",
    pagoManual: ""
  }
};

export function BookingWizard() {
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [booking, setBooking] = useState<BookingData>(initialBookingData);
  const [paymentPendingVerification, setPaymentPendingVerification] = useState(false);

  useEffect(() => {
    const roomParam = searchParams.get("room") as RoomId | null;
    const dateParam = searchParams.get("date");
    const jornadaParam = searchParams.get("jornada") as JornadaType | null;
    const slotParam = searchParams.get("slot");

    if (roomParam || dateParam || jornadaParam || slotParam) {
      const newBooking = { ...initialBookingData };

      if (roomParam) newBooking.room = roomParam;
      if (dateParam) {
        const parsedDate = new Date(dateParam);
        if (!isNaN(parsedDate.getTime())) {
          newBooking.date = parsedDate;
        }
      }
      
      if (jornadaParam) {
        newBooking.jornada = jornadaParam;
      } else if (slotParam) {
        // Map slot name from Hub to JornadaType
        const slotMap: Record<string, JornadaType> = {
          "Día": "dia",
          "Noche": "noche",
          "Día Entero (mañana)": "dia_entero_manana",
          "Día Entero (noche)": "dia_entero_noche"
        };
        if (slotMap[slotParam]) {
          newBooking.jornada = slotMap[slotParam];
        }
      }

      setBooking(newBooking);
      
      // If we have room, date and jornada, skip to extras (step 2)
      if (newBooking.room && newBooking.date && newBooking.jornada) {
        setCurrentStep(2);
      }
    }
  }, [searchParams]);

  const handleRoomChange = (room: RoomId) => {
    setBooking({ ...booking, room, jornada: null, extras: { ...booking.extras, personasExtra: 0 } });
  };

  const handleDateChange = (date: Date | null) => {
    setBooking({ ...booking, date });
  };

  const handleJornadaChange = (jornada: JornadaType, price?: number) => {
    // Reset personasExtra if changing from ático día to another option
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

  const handleDecoracionChange = (decoracion: DecorationType | null) => {
    setBooking({
      ...booking,
      extras: {
        ...booking.extras,
        decoracion,
        // Reset detalles si se deselecciona la decoración
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

  const handleCommentFieldsChange = (fields: { generales: string; horaLlegada: string; pagoManual: string }) => {
    setBooking({ ...booking, commentFields: fields });
  };

  const handleCommentsChange = (comments: string) => {
    setBooking({ ...booking, comments });
  };

  const handleSeguroChange = (seguroCancelacion: boolean) => {
    setBooking({ ...booking, seguroCancelacion });
  };

  const handleReset = () => {
    setBooking(initialBookingData);
    setCurrentStep(1);
    setPaymentPendingVerification(false);
  };

  const handlePaymentPendingVerification = () => {
    setPaymentPendingVerification(true);
    setCurrentStep(7);
  };

  const showPriceSummary = currentStep >= 1 && currentStep <= 4 && booking.room && booking.jornada;

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                {/* Step circle and label */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                    currentStep >= step.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {step.id}
                  </div>
                  <span
                    className={cn(
                      "hidden sm:block text-xs mt-2 text-center transition-colors whitespace-nowrap",
                      currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.name}
                  </span>
                </div>
                {/* Connector line */}
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

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {currentStep === 1 && (
            <StepSearch
              selectedRoom={booking.room}
              selectedDate={booking.date}
              selectedJornada={booking.jornada}
              onRoomChange={handleRoomChange}
              onDateChange={handleDateChange}
              onJornadaChange={handleJornadaChange}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && booking.room && booking.jornada && (
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
              onNext={() => setCurrentStep(5)}
              onCommentsChange={handleCommentsChange}
              onCommentFieldsChange={handleCommentFieldsChange}
            />
          )}

          {currentStep === 5 && (
            <StepContractSigning
              booking={booking}
              onBack={() => setCurrentStep(4)}
              onNext={() => setCurrentStep(6)}
              onReset={handleReset}
            />
          )}

          {currentStep === 6 && (
            <StepPayment
              booking={booking}
              onBack={() => setCurrentStep(5)}
              onNext={() => setCurrentStep(7)}
              onReset={handleReset}
              onPendingVerification={handlePaymentPendingVerification}
              onSeguroChange={handleSeguroChange}
            />
          )}

          {currentStep === 7 && (
            <StepFinalConfirmation
              booking={booking}
              onReset={handleReset}
              pendingVerification={paymentPendingVerification}
            />
          )}

          {/* Floating Price Summary */}
          {showPriceSummary && (
            <div className="fixed bottom-4 right-4 w-72 hidden lg:block">
              <PriceSummary booking={booking} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
