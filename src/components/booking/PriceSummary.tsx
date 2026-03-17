import { 
  BookingData, 
  getRoomById, 
  getJornadaForRoom, 
  calculateTotalPrice,
  calculateInsurancePrice,
  DECORATIONS,
  PACKS,
  PERSONA_EXTRA_PRICE,
  canAddPersonasExtra
} from "@/lib/bookingConfig";

interface PriceSummaryProps {
  booking: BookingData;
}

export function PriceSummary({ booking }: PriceSummaryProps) {
  const room = booking.room ? getRoomById(booking.room) : null;
  const jornada = booking.room && booking.jornada ? getJornadaForRoom(booking.room, booking.jornada) : null;
  const decoration = booking.extras.decoracion ? DECORATIONS.find(d => d.id === booking.extras.decoracion) : null;
  const pack = booking.extras.pack ? PACKS.find(p => p.id === booking.extras.pack) : null;
  const showPersonasExtra = canAddPersonasExtra(booking.room, booking.jornada) && booking.extras.personasExtra > 0;
  const totalPrice = calculateTotalPrice(booking);
  const insurancePrice = calculateInsurancePrice(booking);

  // Usar precio dinámico si existe, sino el estático
  const jornadaPrice = booking.jornadaPrice ?? jornada?.price ?? 0;

  if (!room || !jornada) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
      <h3 className="font-semibold text-foreground mb-3">Resumen</h3>
      
      <div className="space-y-2 text-sm">
        {/* Base Price */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">{room.name} - {jornada.name}</span>
          <span className="font-medium">{jornadaPrice}€</span>
        </div>

        {/* Decoration */}
        {decoration && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{decoration.name}</span>
            <span className="font-medium">+{decoration.price}€</span>
          </div>
        )}

        {/* Pack */}
        {pack && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{pack.name}</span>
            <span className="font-medium">+{pack.price}€</span>
          </div>
        )}

        {/* Personas Extra */}
        {showPersonasExtra && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {booking.extras.personasExtra} persona{booking.extras.personasExtra > 1 ? "s" : ""} extra
            </span>
            <span className="font-medium">+{booking.extras.personasExtra * PERSONA_EXTRA_PRICE}€</span>
          </div>
        )}

        {/* Seguro de cancelación */}
        {booking.seguroCancelacion && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Seguro cancelación (5%)</span>
            <span className="font-medium">+{insurancePrice}€</span>
          </div>
        )}

        {/* Total */}
        <div className="pt-2 mt-2 border-t border-border flex justify-between items-center">
          <span className="font-semibold text-foreground">Total</span>
          <span className="text-xl font-bold text-primary">{totalPrice}€</span>
        </div>
      </div>
    </div>
  );
}
