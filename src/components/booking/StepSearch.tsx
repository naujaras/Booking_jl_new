import { useState, useEffect } from "react";
import { format, startOfToday } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, CheckCircle2, Loader2, Clock } from "lucide-react";
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

        try {
          // Consultar disponibilidad y precios en paralelo
          const [availabilityData, pricesData] = await Promise.all([
            checkAvailability(selectedDate, selectedRoom),
            fetchJornadaPrices(selectedDate, selectedRoom)
          ]);

          setAvailabilityResult(availabilityData);
          setJornadaPrices(pricesData);
          
          console.log('Resultados de disponibilidad:', availabilityData);
          console.log('Precios obtenidos:', pricesData);

          // Si hay jornadas disponibles (con precio y hueco), mostrar el popup
          // El chequeo real se hace abajo en availableJornadasConfig
        } catch (error) {
          console.error('Fallo crítico en búsqueda:', error);
          // Al no haber salvavidas, availabilityResult seguirá siendo null y mostrará error
        } finally {
          setIsChecking(false);
        }
      }
    }
    checkDateAndPrices();
  }, [selectedRoom, selectedDate]);

  // Obtener las jornadas del room actual para mostrar en el popup
  // Filtrar por disponibilidad (GCal) Y por tener precio (Excel)
  const currentRoom = selectedRoom ? getRoomById(selectedRoom) : null;
  const availableJornadasConfig: JornadaConfig[] = currentRoom
    ? currentRoom.jornadas.filter(j => {
        const isAvailable = availabilityResult?.availableJornadas.includes(j.id);
        const hasPrice = jornadaPrices && jornadaPrices[j.id] && jornadaPrices[j.id] > 0;
        return isAvailable && hasPrice;
      })
    : [];

  const hasAvailableJornadas = availableJornadasConfig.length > 0;
  const canProceed = selectedRoom && selectedDate && selectedJornada && hasAvailableJornadas;

  // Abrir diálogo automáticamente cuando hay resultados válidos
  useEffect(() => {
    if (hasAvailableJornadas && !selectedJornada && !isChecking) {
      setShowJornadaDialog(true);
    }
  }, [hasAvailableJornadas, selectedJornada, isChecking]);

  // Obtener precio de una jornada (dinámico o estático como fallback)
  const getJornadaPrice = (jornadaId: JornadaType): number => {
    if (jornadaPrices && jornadaPrices[jornadaId] !== undefined) {
      return jornadaPrices[jornadaId];
    }
    return 0; // No hay precio real del Excel
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
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif font-semibold text-foreground">
          Elige tu escapada perfecta
        </h2>
        <p className="text-muted-foreground">
          Selecciona la estancia y fecha para tu momento especial
        </p>
      </div>

      {/* Aviso Cajero */}
      <div className="bg-amber-50 md:mx-0 mx-4 border border-amber-300 rounded-xl p-5 text-sm text-amber-900 flex flex-col gap-3 shadow-sm">
        <p>
          <strong>Atención:</strong> Si vas a realizar el pago mediante <strong>ingreso en cajero</strong>, es indispensable tener el saldo previamente cargado en tu monedero virtual.
        </p>
        <p>
          Debes consultarlo usando el botón correspondiente dentro de nuestro HUB principal.
        </p>
        <a 
          href="https://naujaras.com" 
          target="_blank"
          rel="noopener noreferrer" 
          className="inline-flex items-center justify-center max-w-max px-4 py-2 mt-1 bg-amber-200 border border-amber-400 rounded-md font-bold text-amber-950 hover:bg-amber-300 transition-colors shadow-sm"
        >
          Pago en cajero / Gestionar tu pago en efectivo
        </a>
      </div>

      {/* Room Selection */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-foreground">Tipo de Estancia</label>
        <div className="grid gap-4 sm:grid-cols-3">
          {ROOMS.map((room) => (
            <div
              key={room.id}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-300 text-center cursor-pointer min-h-[100px] flex items-center justify-center",
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
            !isChecking && !hasAvailableJornadas && "bg-destructive/10 text-destructive"
          )}>
            {isChecking && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verificando disponibilidad en tiempo real...</span>
              </>
            )}
            
            {!isChecking && hasAvailableJornadas && (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>
                   Encontramos {availableJornadasConfig.length} opciones disponibles con precio confirmado.
                </span>
              </>
            )}

            {!isChecking && !hasAvailableJornadas && availabilityResult && (
              <span>No hay plazas disponibles para esta combinación. Por favor, elige otra fecha o estancia.</span>
            )}
            
            {!isChecking && !hasAvailableJornadas && !availabilityResult && (
              <span>Error de conexión con el sistema de reservas. Recarga la página o inténtalo más tarde.</span>
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
