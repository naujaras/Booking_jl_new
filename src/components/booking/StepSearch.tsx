import { useState, useEffect } from "react";
import { format, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, Loader2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ROOMS,
  RoomId,
  JornadaType,
  JornadaConfig,
  checkAvailability,
  fetchJornadaPrices,
  AvailabilityResult,
  JornadaPrices,
  getRoomById,
  formatTimeSlot
} from "@/lib/bookingConfig";

interface StepSearchProps {
  selectedRoom: RoomId | null;
  selectedDate: Date | null;
  selectedJornada: JornadaType | null;
  onRoomChange: (room: RoomId) => void;
  onDateChange: (date: Date | null) => void;
  onJornadaChange: (jornada: JornadaType, price?: number) => void;
  onNext: () => void;
}

export function StepSearch({
  selectedRoom,
  selectedDate,
  selectedJornada,
  onRoomChange,
  onDateChange,
  onJornadaChange,
  onNext
}: StepSearchProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilityResult | null>(null);
  const [jornadaPrices, setJornadaPrices] = useState<JornadaPrices | null>(null);
  const [showJornadaDialog, setShowJornadaDialog] = useState(false);

  useEffect(() => {
    async function checkDateAndPrices() {
      if (selectedRoom && selectedDate) {
        setIsChecking(true);
        setAvailabilityResult(null);
        setJornadaPrices(null);

        // Consultar disponibilidad y precios en paralelo
        const [availabilityData, pricesData] = await Promise.all([
          checkAvailability(selectedDate, selectedRoom),
          fetchJornadaPrices(selectedDate, selectedRoom)
        ]);

        setAvailabilityResult(availabilityData);
        setJornadaPrices(pricesData);
        setIsChecking(false);

        // Si hay jornadas disponibles, mostrar el popup
        if (availabilityData.availableJornadas.length > 0) {
          setShowJornadaDialog(true);
        }
      }
    }
    checkDateAndPrices();
  }, [selectedRoom, selectedDate]);

  const hasAvailableJornadas = availabilityResult && availabilityResult.availableJornadas.length > 0;
  const canProceed = selectedRoom && selectedDate && selectedJornada && hasAvailableJornadas;

  // Obtener las jornadas del room actual para mostrar en el popup
  const currentRoom = selectedRoom ? getRoomById(selectedRoom) : null;
  const availableJornadasConfig: JornadaConfig[] = currentRoom
    ? currentRoom.jornadas.filter(j => availabilityResult?.availableJornadas.includes(j.id))
    : [];

  // Obtener precio de una jornada (dinámico o estático como fallback)
  const getJornadaPrice = (jornadaId: JornadaType): number => {
    if (jornadaPrices) {
      return jornadaPrices[jornadaId] || 0;
    }
    // Fallback a precio estático de la configuración
    const jornada = currentRoom?.jornadas.find(j => j.id === jornadaId);
    return jornada?.price || 0;
  };

  const handleJornadaSelect = (jornadaId: JornadaType) => {
    const price = getJornadaPrice(jornadaId);
    onJornadaChange(jornadaId, price);
    setShowJornadaDialog(false);
  };

  const handleOpenJornadaDialog = () => {
    if (hasAvailableJornadas) {
      setShowJornadaDialog(true);
    }
  };

  return (
    <div className="space-y-6">

      {/* Room Selection */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-foreground">Tipo de Estancia</label>
        <div className="grid gap-4 sm:grid-cols-3">
          {ROOMS.map((room) => (
            <div
              key={room.id}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-300 text-center cursor-pointer min-h-[80px] flex items-center justify-center",
                "hover:border-primary/50 hover:shadow-md",
                selectedRoom === room.id
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border bg-card"
              )}
              onClick={() => onRoomChange(room.id)}
            >
              {selectedRoom === room.id && (
                <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
              )}
              <h3 className={cn(
                "font-semibold text-sm sm:text-base leading-tight px-2",
                selectedRoom === room.id ? "text-primary" : "text-foreground"
              )}>
                {room.name}
              </h3>
            </div>
          ))}
        </div>
      </div>

      {/* Date Selection */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-foreground">Fecha</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-14",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-3 h-5 w-5" />
              {selectedDate ? (
                format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
              ) : (
                <span>Selecciona una fecha</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate || undefined}
              onSelect={(date) => onDateChange(date || null)}
              disabled={(date) => date < startOfToday()}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Availability Status */}
        {selectedRoom && selectedDate && (
          <div className={cn(
            "flex items-center gap-2 p-3 rounded-lg text-sm",
            isChecking && "bg-muted text-muted-foreground",
            hasAvailableJornadas && "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
            availabilityResult && !hasAvailableJornadas && "bg-destructive/10 text-destructive",
            !isChecking && !availabilityResult && "bg-destructive/10 text-destructive"
          )}>
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verificando disponibilidad en tiempo real...</span>
              </>
            ) : hasAvailableJornadas ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {availabilityResult!.availableJornadas.length === 4
                    ? "¡Todas las jornadas disponibles!"
                    : `${availabilityResult!.availableJornadas.length} jornada(s) disponible(s)`}
                </span>
              </>
            ) : availabilityResult && availabilityResult.availableJornadas.length === 0 ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>No hay jornadas disponibles para esta fecha.</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Error al conectar con el servidor. Por favor, reintenta en unos segundos.</span>
              </>
            )}
          </div>
        )}

        {/* Selected Jornada Display */}
        {selectedJornada && currentRoom && (
          <div
            onClick={handleOpenJornadaDialog}
            className="flex items-center justify-between p-4 rounded-lg border-2 border-primary bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  {currentRoom.jornadas.find(j => j.id === selectedJornada)?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatTimeSlot(currentRoom.jornadas.find(j => j.id === selectedJornada)!.timeSlot)}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm">Cambiar</Button>
          </div>
        )}
      </div>

      {/* Next Button */}
      <Button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full h-14 text-lg font-medium"
        size="lg"
      >
        Continuar
      </Button>

      {/* Jornada Selection Dialog */}
      <Dialog open={showJornadaDialog} onOpenChange={setShowJornadaDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecciona tu jornada</DialogTitle>
            <DialogDescription>
              {currentRoom?.name} - {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {availableJornadasConfig.map((jornada) => {
              const price = getJornadaPrice(jornada.id);
              return (
                <button
                  key={jornada.id}
                  onClick={() => handleJornadaSelect(jornada.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left",
                    "hover:border-primary/50 hover:bg-primary/5",
                    selectedJornada === jornada.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{jornada.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTimeSlot(jornada.timeSlot)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{price}€</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowJornadaDialog(false)}>
              Volver
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
