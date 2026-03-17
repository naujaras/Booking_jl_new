import { Clock, Sun, Moon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RoomId, JornadaType, getRoomById, formatTimeSlot } from "@/lib/bookingConfig";

interface StepJornadaProps {
  selectedRoom: RoomId;
  selectedJornada: JornadaType | null;
  onJornadaChange: (jornada: JornadaType) => void;
  onNext: () => void;
  onBack: () => void;
}

const jornadaIcons: Record<JornadaType, React.ReactNode> = {
  dia: <Sun className="h-5 w-5" />,
  noche: <Moon className="h-5 w-5" />,
  dia_entero_manana: <Sparkles className="h-5 w-5" />,
  dia_entero_noche: <Sparkles className="h-5 w-5" />
};

export function StepJornada({
  selectedRoom,
  selectedJornada,
  onJornadaChange,
  onNext,
  onBack
}: StepJornadaProps) {
  const room = getRoomById(selectedRoom);
  
  if (!room) return null;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif font-semibold text-foreground">
          Elige tu jornada
        </h2>
        <p className="text-muted-foreground">
          Selecciona el horario que mejor se adapte a tus planes en <span className="font-medium">{room.name}</span>
        </p>
      </div>

      {/* Jornada Selection */}
      <div className="grid gap-4 sm:grid-cols-2">
        {room.jornadas.map((jornada) => (
          <button
            key={jornada.id}
            onClick={() => onJornadaChange(jornada.id)}
            className={cn(
              "relative p-5 rounded-xl border-2 transition-all duration-300 text-left",
              "hover:border-primary/50 hover:shadow-md",
              selectedJornada === jornada.id
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card"
            )}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className={cn(
                  "inline-flex p-2.5 rounded-lg",
                  selectedJornada === jornada.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {jornadaIcons[jornada.id]}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">{jornada.price}€</span>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground">{jornada.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{jornada.description}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatTimeSlot(jornada.timeSlot)}</span>
              </div>
            </div>

            {selectedJornada === jornada.id && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background" />
            )}
          </button>
        ))}
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
          disabled={!selectedJornada}
          className="flex-1 h-14 text-lg font-medium"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
