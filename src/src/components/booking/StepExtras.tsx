import { Heart, PartyPopper, Gift, Wine, GlassWater, Users, Minus, Plus, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RoomId,
  JornadaType,
  DecorationType,
  PackType,
  DecorationDetails,
  DECORATIONS,
  PACKS,
  PERSONA_EXTRA_PRICE,
  MAX_PERSONAS_EXTRA,
  canAddPersonasExtra
} from "@/lib/bookingConfig";

interface StepExtrasProps {
  selectedRoom: RoomId;
  selectedJornada: JornadaType;
  selectedDecoracion: DecorationType | null;
  decoracionDetails: DecorationDetails;
  selectedPack: PackType | null;
  personasExtra: number;
  onDecoracionChange: (decoracion: DecorationType | null) => void;
  onDecoracionDetailsChange: (details: DecorationDetails) => void;
  onPackChange: (pack: PackType | null) => void;
  onPersonasExtraChange: (count: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const decorationIcons: Record<string, React.ReactNode> = {
  romantica: <Heart className="h-5 w-5" />,
  cumpleanos: <PartyPopper className="h-5 w-5" />,
  aniversario: <Gift className="h-5 w-5" />
};

const packIcons: Record<string, React.ReactNode> = {
  cava: <Wine className="h-5 w-5" />,
  lambrusco: <GlassWater className="h-5 w-5" />
};

// Detalles de lo que incluye cada decoración
const decorationIncludes: Record<string, string[]> = {
  romantica: [
    "Corazón de pétalos sobre la cama con vuestras iniciales",
    "Velitas LED por la cama y más pétalos",
    "Guirnalda 'I love you'"
  ],
  cumpleanos: [
    "Globos de corazones en el techo",
    "Corazón de pétalos con el número de años y vuestras iniciales",
    "Velitas LED por la cama y más pétalos",
    "Guirnalda 'Feliz cumpleaños'"
  ],
  aniversario: [
    "Globos de corazones en el techo",
    "Corazón de pétalos con los años e iniciales",
    "Velitas LED por la cama y más pétalos",
    "Guirnalda 'Feliz aniversario'"
  ]
};

export function StepExtras({
  selectedRoom,
  selectedJornada,
  selectedDecoracion,
  decoracionDetails,
  selectedPack,
  personasExtra,
  onDecoracionChange,
  onDecoracionDetailsChange,
  onPackChange,
  onPersonasExtraChange,
  onNext,
  onBack
}: StepExtrasProps) {
  const showPersonasExtra = canAddPersonasExtra(selectedRoom, selectedJornada);

  const handleInicialesChange = (value: string) => {
    onDecoracionDetailsChange({
      ...decoracionDetails,
      iniciales: value.toUpperCase()
    });
  };

  const handleNumeroChange = (value: string) => {
    // Solo permitir números
    const numericValue = value.replace(/[^0-9]/g, '');
    onDecoracionDetailsChange({
      ...decoracionDetails,
      numero: numericValue
    });
  };

  // Verificar si los campos requeridos están completos
  const isDecorationDetailsComplete = () => {
    // Los detalles de decoración ahora son opcionales
    return true;
  };

  const canProceed = isDecorationDetailsComplete();

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif font-semibold text-foreground">
          Personaliza tu experiencia
        </h2>
        <p className="text-muted-foreground">
          Añade detalles especiales para hacer tu momento único
        </p>
      </div>

      {/* Decoración */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground">Decoración Especial (opcional)</label>
            <a
              href="https://naujaras.com/#fotosyvideosdecoracion"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Ver fotos
            </a>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {DECORATIONS.map((decoration) => (
            <button
              key={decoration.id}
              onClick={() =>
                onDecoracionChange(
                  selectedDecoracion === decoration.id ? null : decoration.id as DecorationType
                )
              }
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-300 text-left",
                "hover:border-primary/50",
                selectedDecoracion === decoration.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className={cn(
                    "inline-flex p-2 rounded-lg",
                    selectedDecoracion === decoration.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {decorationIcons[decoration.id]}
                  </div>
                  <span className="text-sm font-semibold text-primary">+{decoration.price}€</span>
                </div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">{decoration.name.replace('Decoración ', '')}</h4>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Detalles de la decoración seleccionada */}
        {selectedDecoracion && (
          <div className="mt-4 p-4 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-4">
            {/* Lo que incluye */}
            <div>
              <h4 className="font-medium text-foreground text-sm mb-2">Incluye:</h4>
              <ul className="space-y-1">
                {decorationIncludes[selectedDecoracion].map((item, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Campos de personalización */}
            <div className="pt-3 border-t border-primary/20 space-y-4">
              <h4 className="font-medium text-foreground text-sm">Personalización:</h4>

              {/* Campo de iniciales - siempre visible */}
              <div className="space-y-2">
                <Label htmlFor="iniciales" className="text-sm">
                  Iniciales para el corazón de pétalos (opcional)
                </Label>
                <Input
                  id="iniciales"
                  placeholder="Ej: A & M"
                  value={decoracionDetails.iniciales}
                  onChange={(e) => handleInicialesChange(e.target.value)}
                  maxLength={10}
                  className="bg-background"
                />
              </div>

              {/* Campo de número - solo para cumpleaños y aniversario */}
              {(selectedDecoracion === 'cumpleanos' || selectedDecoracion === 'aniversario') && (
                <div className="space-y-2">
                  <Label htmlFor="numero" className="text-sm">
                    {selectedDecoracion === 'cumpleanos'
                      ? 'Número de años que se celebran (opcional)'
                      : 'Número de años de aniversario (opcional)'}
                  </Label>
                  <Input
                    id="numero"
                    placeholder={selectedDecoracion === 'cumpleanos' ? "Ej: 30" : "Ej: 5"}
                    value={decoracionDetails.numero}
                    onChange={(e) => handleNumeroChange(e.target.value)}
                    maxLength={3}
                    className="bg-background w-24"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pack Romántico */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Pack Romántico (opcional)</label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() =>
                onPackChange(selectedPack === pack.id ? null : pack.id as PackType)
              }
              className={cn(
                "p-4 rounded-xl border-2 transition-all duration-300 text-left",
                "hover:border-primary/50",
                selectedPack === pack.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className={cn(
                    "inline-flex p-2 rounded-lg",
                    selectedPack === pack.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {packIcons[pack.id]}
                  </div>
                  <span className="text-sm font-semibold text-primary">+{pack.price}€</span>
                </div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">{pack.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{pack.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Personas Extra - Solo para Ático en jornada de día */}
      {showPersonasExtra && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Personas Extra</label>
            <span className="text-sm text-muted-foreground">+{PERSONA_EXTRA_PRICE}€/persona</span>
          </div>
          <div className="p-4 rounded-xl border-2 border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-flex p-2 rounded-lg bg-muted text-muted-foreground">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground text-sm">Añadir acompañantes</h4>
                  <p className="text-xs text-muted-foreground">Máximo {MAX_PERSONAS_EXTRA} personas adicionales</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPersonasExtraChange(Math.max(0, personasExtra - 1))}
                  disabled={personasExtra === 0}
                  className="h-9 w-9"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold text-foreground">{personasExtra}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onPersonasExtraChange(Math.min(MAX_PERSONAS_EXTRA, personasExtra + 1))}
                  disabled={personasExtra >= MAX_PERSONAS_EXTRA}
                  className="h-9 w-9"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nota informativa */}
      <p className="text-sm text-muted-foreground text-center">
        Todos los extras son opcionales. Puedes continuar sin añadir ninguno.
      </p>

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
          disabled={!canProceed}
          className="flex-1 h-14 text-lg font-medium"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
