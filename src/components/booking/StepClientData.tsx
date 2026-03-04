import { useState } from "react";
import { User, Mail, Phone, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClientData, validateDNI, validateEmail, validatePhone, validateFullName } from "@/lib/bookingConfig";

interface StepClientDataProps {
  clientData: ClientData;
  onClientDataChange: (data: ClientData) => void;
  onNext: () => void;
  onBack: () => void;
}

interface FormErrors {
  arrendadorNombre?: string;
  arrendadorDni?: string;
  acompananteNombre?: string;
  acompananteDni?: string;
  email?: string;
  telefono?: string;
}

export function StepClientData({
  clientData,
  onClientDataChange,
  onNext,
  onBack
}: StepClientDataProps) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof ClientData, value: string) => {
    const newData = { ...clientData, [field]: value };
    onClientDataChange(newData);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleBlur = (field: keyof ClientData) => {
    setTouched({ ...touched, [field]: true });
    validateField(field);
  };

  const validateField = (field: keyof ClientData): boolean => {
    let error: string | undefined;
    const value = clientData[field];

    switch (field) {
      case "arrendadorNombre":
        if (!value.trim()) error = "El nombre es obligatorio";
        else if (!validateFullName(value)) error = "Introduce nombre y apellidos";
        break;
      case "arrendadorDni":
        if (!value.trim()) error = "El DNI es obligatorio";
        else if (!validateDNI(value)) error = "DNI/NIE inválido. Verifica el formato y la letra";
        break;
      case "acompananteNombre":
        if (value.trim() && !validateFullName(value)) error = "Introduce nombre y apellidos";
        break;
      case "acompananteDni":
        if (value.trim() && !validateDNI(value)) error = "DNI/NIE inválido. Verifica el formato y la letra";
        break;
      case "email":
        if (value.trim() && !validateEmail(value)) error = "Email inválido";
        break;
      case "telefono":
        if (!value.trim()) error = "El teléfono es obligatorio";
        else if (!validatePhone(value)) error = "Teléfono inválido (9 dígitos)";
        break;
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  };

  const validateAll = (): boolean => {
    const fields: (keyof ClientData)[] = [
      "arrendadorNombre",
      "arrendadorDni",
      "telefono"
    ];

    // Validar opcionales solo si están informados
    if (clientData.acompananteNombre.trim() || clientData.acompananteDni.trim()) {
      fields.push("acompananteNombre", "acompananteDni");
    }
    if (clientData.email.trim()) {
      fields.push("email");
    }

    let isValid = true;
    const newErrors: FormErrors = {};

    fields.forEach((field) => {
      const fieldValid = validateField(field);
      if (!fieldValid) {
        isValid = false;
        newErrors[field] = errors[field];
      }
    });

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    fields.forEach((field) => (allTouched[field] = true));
    setTouched(allTouched);

    return isValid;
  };

  const handleNext = () => {
    if (validateAll()) {
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif font-semibold text-foreground">
          Datos del contrato
        </h2>
        <p className="text-muted-foreground">
          Introduce los datos de las personas que disfrutarán de la estancia
        </p>
      </div>

      {/* Arrendador */}
      <div className="space-y-4">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <User className="h-4 w-4" />
          Datos del Arrendador
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="arrendadorNombre">Nombre completo</Label>
            <Input
              id="arrendadorNombre"
              placeholder="Juan García López"
              value={clientData.arrendadorNombre}
              onChange={(e) => handleChange("arrendadorNombre", e.target.value)}
              onBlur={() => handleBlur("arrendadorNombre")}
              className={errors.arrendadorNombre && touched.arrendadorNombre ? "border-destructive" : ""}
            />
            {errors.arrendadorNombre && touched.arrendadorNombre && (
              <p className="text-xs text-destructive">{errors.arrendadorNombre}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="arrendadorDni">DNI/NIE</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="arrendadorDni"
                placeholder="12345678A"
                value={clientData.arrendadorDni}
                onChange={(e) => handleChange("arrendadorDni", e.target.value.toUpperCase())}
                onBlur={() => handleBlur("arrendadorDni")}
                className={`pl-10 ${errors.arrendadorDni && touched.arrendadorDni ? "border-destructive" : ""}`}
              />
            </div>
            {errors.arrendadorDni && touched.arrendadorDni && (
              <p className="text-xs text-destructive">{errors.arrendadorDni}</p>
            )}
          </div>
        </div>
      </div>

      {/* Acompañante */}
      <div className="space-y-4">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <User className="h-4 w-4" />
          Datos del Acompañante (opcional)
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="acompananteNombre">Nombre completo (opcional)</Label>
            <Input
              id="acompananteNombre"
              placeholder="María Fernández Ruiz"
              value={clientData.acompananteNombre}
              onChange={(e) => handleChange("acompananteNombre", e.target.value)}
              onBlur={() => handleBlur("acompananteNombre")}
              className={errors.acompananteNombre && touched.acompananteNombre ? "border-destructive" : ""}
            />
            {errors.acompananteNombre && touched.acompananteNombre && (
              <p className="text-xs text-destructive">{errors.acompananteNombre}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="acompananteDni">DNI/NIE (opcional)</Label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="acompananteDni"
                placeholder="87654321B"
                value={clientData.acompananteDni}
                onChange={(e) => handleChange("acompananteDni", e.target.value.toUpperCase())}
                onBlur={() => handleBlur("acompananteDni")}
                className={`pl-10 ${errors.acompananteDni && touched.acompananteDni ? "border-destructive" : ""}`}
              />
            </div>
            {errors.acompananteDni && touched.acompananteDni && (
              <p className="text-xs text-destructive">{errors.acompananteDni}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div className="space-y-4">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Datos de Contacto
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email (opcional)</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@email.com"
                value={clientData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                className={`pl-10 ${errors.email && touched.email ? "border-destructive" : ""}`}
              />
            </div>
            {errors.email && touched.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="telefono"
                type="tel"
                placeholder="612345678"
                value={clientData.telefono}
                onChange={(e) => handleChange("telefono", e.target.value.replace(/\D/g, ""))}
                onBlur={() => handleBlur("telefono")}
                className={`pl-10 ${errors.telefono && touched.telefono ? "border-destructive" : ""}`}
              />
            </div>
            {errors.telefono && touched.telefono && (
              <p className="text-xs text-destructive">{errors.telefono}</p>
            )}
          </div>
        </div>
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
          onClick={handleNext}
          className="flex-1 h-14 text-lg font-medium"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
