# Naujaras Booking

Sistema de reservas para alojamientos románticos Naujaras en Sevilla.

## Tecnologías

- React 18 + Vite + TypeScript
- shadcn/ui + Tailwind CSS
- n8n webhooks para disponibilidad, precios y gestión de contratos

## Despliegue Local

### Requisitos

- Node.js 18+
- npm

### Instalación

```bash
# Clonar repositorio
git clone <URL_REPOSITORIO>
cd naujaras-booking

# Instalar dependencias
npm install
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo (puerto 8080)
npm run dev
```

La aplicación estará disponible en: http://localhost:8080

## Estructura del Proyecto

```
src/
├── components/
│   ├── booking/
│   │   ├── BookingWizard.tsx      # Wizard principal (6 pasos)
│   │   ├── StepSearch.tsx         # Paso 1: Búsqueda (sala, fecha, jornada)
│   │   ├── StepExtras.tsx         # Paso 2: Extras (decoración, packs)
│   │   ├── StepClientData.tsx     # Paso 3: Datos del contrato
│   │   ├── StepConfirmation.tsx   # Paso 4: Resumen y normas
│   │   ├── StepContractSigning.tsx # Paso 5: Firma del contrato
│   │   ├── StepPayment.tsx        # Paso 6: Métodos de pago
│   │   └── ...
│   └── ui/                        # Componentes shadcn/ui
├── lib/
│   └── bookingConfig.ts           # Configuración, webhooks, validaciones
└── ...
```

## Webhooks n8n

| Función | URL |
|---------|-----|
| Disponibilidad | `https://n8n-n8n.1owldl.easypanel.host/webhook/b4920b99-...` |
| Precios dinámicos | `https://n8n-n8n.1owldl.easypanel.host/webhook/854bd8ed-...` |
| Crear reserva/contrato | `https://n8n-n8n.1owldl.easypanel.host/webhook/a34d16d0-...` |
| Estado firma contrato | `https://n8n-n8n.1owldl.easypanel.host/webhook/db23982f-...` |
| Generar pago Stripe | `https://n8n-n8n.1owldl.easypanel.host/webhook/6712f3f0-...` |

## Flujo de Reserva

1. **Búsqueda**: Selección de sala, fecha y jornada
2. **Extras**: Decoración opcional y packs románticos
3. **Datos**: Información del arrendador y acompañante (DNI validado)
4. **Resumen**: Revisión y aceptación de normas
5. **Contrato**: Generación y firma digital (DocuSeal)
6. **Pago**: Tarjeta (Stripe), Bizum o Transferencia

## Validaciones

- DNI/NIE español con letra de control
- Nombre completo (nombre + apellidos)
- Email y teléfono

## Scripts

```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run preview  # Preview build
```
