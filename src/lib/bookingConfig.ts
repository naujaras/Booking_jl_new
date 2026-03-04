// ============================================
// CONFIGURACIÓN DE NEGOCIO - NAUJARAS SEVILLA
// ============================================

// URLs de Webhooks de n8n (producción)
export const N8N_WEBHOOK_URL = "https://n8n-n8n.npfusf.easypanel.host/webhook/disponibilidad";
export const N8N_PRICES_WEBHOOK_URL = "https://n8n-n8n.npfusf.easypanel.host/webhook/precios-excel";
export const N8N_BOOKING_WEBHOOK_URL = "https://n8n-n8n.npfusf.easypanel.host/webhook/reservar";

// Tipos de datos
export type RoomId = "atico" | "estudio" | "habitacion";
export type JornadaType = "dia" | "noche" | "dia_entero_manana" | "dia_entero_noche";
export type DecorationType = "romantica" | "cumpleanos" | "aniversario";
export type PackType = "cava" | "lambrusco";

export interface TimeSlot {
  start: string;
  end: string;
  nextDay?: boolean;
}

export interface JornadaConfig {
  id: JornadaType;
  name: string;
  description: string;
  price: number;
  timeSlot: TimeSlot;
}

export interface RoomConfig {
  id: RoomId;
  name: string;
  description: string;
  image: string;
  photosLink: string;
  capacity: number;
  features: string[];
  jornadas: JornadaConfig[];
}

export interface Extra {
  id: string;
  name: string;
  description: string;
  price: number;
}

export interface ClientData {
  arrendadorNombre: string;
  arrendadorDni: string;
  acompananteNombre: string;
  acompananteDni: string;
  email: string;
  telefono: string;
}

// Datos personalizados de decoración
export interface DecorationDetails {
  iniciales: string; // Para todas las decoraciones
  numero: string; // Número de años (cumpleaños/aniversario)
}

export interface BookingData {
  room: RoomId | null;
  date: Date | null;
  jornada: JornadaType | null;
  jornadaPrice: number | null; // Precio dinámico de la jornada
  comments?: string;
  extras: {
    decoracion: DecorationType | null;
    decoracionDetails: DecorationDetails;
    pack: PackType | null;
    personasExtra: number;
  };
  clientData: ClientData;
}

// Configuración de habitaciones con horarios
export const ROOMS: RoomConfig[] = [
  {
    id: "atico",
    name: "Ático con piscina climatizada y jacuzzi XXL",
    description: "Espacio premium con piscina de agua caliente y jacuzzi XXL",
    image: "/rooms/atico.jpg",
    photosLink: "https://naujaras.com/#fotosyvideosatico",
    capacity: 2,
    features: ["Piscina climatizada", "Jacuzzi XXL", "Terraza privada", "Climatización"],
    jornadas: [
      {
        id: "dia",
        name: "Jornada Día",
        description: "Perfecto para una escapada romántica diurna",
        price: 80,
        timeSlot: { start: "13:00", end: "20:00" }
      },
      {
        id: "noche",
        name: "Jornada Noche",
        description: "Una noche inolvidable bajo las estrellas",
        price: 100,
        timeSlot: { start: "22:00", end: "11:00", nextDay: true }
      },
      {
        id: "dia_entero_manana",
        name: "Día Entero (Entrada Mañana)",
        description: "Disfruta desde el mediodía hasta la mañana siguiente",
        price: 150,
        timeSlot: { start: "13:00", end: "11:00", nextDay: true }
      },
      {
        id: "dia_entero_noche",
        name: "Día Entero (Entrada Noche)",
        description: "Desde la noche hasta el atardecer siguiente",
        price: 150,
        timeSlot: { start: "22:00", end: "20:00", nextDay: true }
      }
    ]
  },
  {
    id: "estudio",
    name: "Estudio con jacuzzi XXL sin piscina",
    description: "Amplio estudio con jacuzzi XXL y sofá",
    image: "/rooms/estudio.jpg",
    photosLink: "https://naujaras.com/#fotosyvideosestudio",
    capacity: 2,
    features: ["Jacuzzi XXL", "Sofá", "Más amplio", "Climatización"],
    jornadas: [
      {
        id: "dia",
        name: "Jornada Día",
        description: "Perfecto para una escapada romántica diurna",
        price: 70,
        timeSlot: { start: "11:30", end: "18:30" }
      },
      {
        id: "noche",
        name: "Jornada Noche",
        description: "Una noche íntima y especial",
        price: 90,
        timeSlot: { start: "20:00", end: "10:00", nextDay: true }
      },
      {
        id: "dia_entero_manana",
        name: "Día Entero (Entrada Mañana)",
        description: "Disfruta desde la mañana hasta el día siguiente",
        price: 130,
        timeSlot: { start: "11:30", end: "10:00", nextDay: true }
      },
      {
        id: "dia_entero_noche",
        name: "Día Entero (Entrada Noche)",
        description: "Desde la noche hasta la tarde siguiente",
        price: 130,
        timeSlot: { start: "20:00", end: "18:30", nextDay: true }
      }
    ]
  },
  {
    id: "habitacion",
    name: "Habitación con jacuzzi XXL sin piscina",
    description: "Habitación íntima con jacuzzi XXL",
    image: "/rooms/habitacion.jpg",
    photosLink: "https://naujaras.com/#habitacion",
    capacity: 2,
    features: ["Jacuzzi XXL", "Ambiente íntimo", "Climatización"],
    jornadas: [
      {
        id: "dia",
        name: "Jornada Día",
        description: "Ideal para una tarde romántica",
        price: 60,
        timeSlot: { start: "13:30", end: "19:30" }
      },
      {
        id: "noche",
        name: "Jornada Noche",
        description: "Noche de ensueño en pareja",
        price: 80,
        timeSlot: { start: "21:00", end: "12:00", nextDay: true }
      },
      {
        id: "dia_entero_manana",
        name: "Día Entero (Entrada Mañana)",
        description: "Desde el mediodía hasta el día siguiente",
        price: 120,
        timeSlot: { start: "13:30", end: "12:00", nextDay: true }
      },
      {
        id: "dia_entero_noche",
        name: "Día Entero (Entrada Noche)",
        description: "Desde la noche hasta la tarde siguiente",
        price: 120,
        timeSlot: { start: "21:00", end: "19:30", nextDay: true }
      }
    ]
  }
];

// Configuración de extras
export const DECORATIONS: Extra[] = [
  {
    id: "romantica",
    name: "Decoración Romántica",
    description: "Corazón de pétalos con iniciales, velitas LED, guirnalda 'I love you'",
    price: 9
  },
  {
    id: "cumpleanos",
    name: "Decoración Cumpleaños",
    description: "Globos de corazones, corazón de pétalos con número y iniciales, velitas LED, guirnalda 'Feliz cumpleaños'",
    price: 9
  },
  {
    id: "aniversario",
    name: "Decoración Aniversario",
    description: "Globos de corazones, corazón de pétalos con años e iniciales, velitas LED, guirnalda 'Feliz aniversario'",
    price: 9
  }
];

export const PACKS: Extra[] = [
  { id: "cava", name: "Pack Cava", description: "Botella de cava y bombones", price: 9 },
  { id: "lambrusco", name: "Pack Lambrusco", description: "Botella de lambrusco y bombones", price: 9 }
];

export const PERSONA_EXTRA_PRICE = 10;
export const MAX_PERSONAS_EXTRA = 2;

// Funciones de utilidad
export function getRoomById(roomId: RoomId): RoomConfig | undefined {
  return ROOMS.find(room => room.id === roomId);
}

export function getJornadaForRoom(roomId: RoomId, jornadaId: JornadaType): JornadaConfig | undefined {
  const room = getRoomById(roomId);
  return room?.jornadas.find(j => j.id === jornadaId);
}

export function canAddPersonasExtra(roomId: RoomId | null, jornadaId: JornadaType | null): boolean {
  // Solo se permite añadir personas extra en el Ático durante la jornada de día
  return roomId === "atico" && jornadaId === "dia";
}

export function calculateTotalPrice(booking: BookingData): number {
  let total = 0;

  // Precio base de la jornada (usar precio dinámico si existe, sino el estático)
  if (booking.room && booking.jornada) {
    if (booking.jornadaPrice !== null && booking.jornadaPrice !== undefined) {
      total += booking.jornadaPrice;
    } else {
      const jornada = getJornadaForRoom(booking.room, booking.jornada);
      if (jornada) {
        total += jornada.price;
      }
    }
  }

  // Decoración
  if (booking.extras.decoracion) {
    const decoration = DECORATIONS.find(d => d.id === booking.extras.decoracion);
    if (decoration) {
      total += decoration.price;
    }
  }

  // Pack
  if (booking.extras.pack) {
    const pack = PACKS.find(p => p.id === booking.extras.pack);
    if (pack) {
      total += pack.price;
    }
  }

  // Personas extra
  if (canAddPersonasExtra(booking.room, booking.jornada)) {
    total += booking.extras.personasExtra * PERSONA_EXTRA_PRICE;
  }

  return total;
}

export function formatTimeSlot(timeSlot: TimeSlot): string {
  const endLabel = timeSlot.nextDay ? " (día siguiente)" : "";
  return `${timeSlot.start} - ${timeSlot.end}${endLabel}`;
}

// Tipo para eventos del calendario
export interface CalendarEvent {
  id: string;
  summary?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
}

// Resultado de verificar disponibilidad
export interface AvailabilityResult {
  events: CalendarEvent[];
  availableJornadas: JornadaType[];
}

// Precios por jornada (formato del webhook)
export interface JornadaPricesResponse {
  row_number?: number;
  fecha?: string;
  jornada_de_dia: number;
  jornada_de_noche: number;
  dia_entero_manana: number;
  dia_entero_noche: number;
}

// Precios normalizados para uso interno
export interface JornadaPrices {
  dia: number;
  noche: number;
  dia_entero_manana: number;
  dia_entero_noche: number;
}

// Email por defecto cuando el usuario no facilita uno
export const DEFAULT_CONTACT_EMAIL = "gestionchatbotnaujaras@gmail.com";

export function getEffectiveEmail(email: string): string {
  return email.trim() || DEFAULT_CONTACT_EMAIL;
}

// Función auxiliar para formatear fecha en ISO con timezone de Madrid
function formatDateTimeLocal(date: Date, time: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T${time}:00.000+01:00`;
}

// Función auxiliar para formatear fecha como YYYY-MM-DD (sin conversión UTC)
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Función para parsear hora de string "HH:MM" a minutos desde medianoche
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Función para verificar si dos rangos horarios se solapan
function rangesOverlap(
  start1: number, end1: number, crossesMidnight1: boolean,
  start2: number, end2: number, crossesMidnight2: boolean
): boolean {
  // Normalizar rangos que cruzan medianoche
  // Si cruza medianoche, el rango va de start a 1440 (medianoche) y de 0 a end

  if (!crossesMidnight1 && !crossesMidnight2) {
    // Ambos rangos en el mismo día
    return start1 < end2 && start2 < end1;
  }

  if (crossesMidnight1 && !crossesMidnight2) {
    // Rango 1 cruza medianoche: start1->1440 y 0->end1
    return (start2 < 1440 && start2 >= start1) || (end2 > 0 && end2 <= end1) || (start2 < end1);
  }

  if (!crossesMidnight1 && crossesMidnight2) {
    // Rango 2 cruza medianoche
    return (start1 < 1440 && start1 >= start2) || (end1 > 0 && end1 <= end2) || (start1 < end2);
  }

  // Ambos cruzan medianoche - siempre se solapan
  return true;
}

// Función para verificar si un evento ocupa una jornada específica
function eventOccupiesJornada(
  event: CalendarEvent,
  jornada: JornadaConfig,
  selectedDate: Date
): boolean {
  const eventStart = new Date(event.start.dateTime);
  const eventEnd = new Date(event.end.dateTime);

  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

  // Crear fecha/hora de inicio y fin de la jornada
  const jornadaStartTime = timeToMinutes(jornada.timeSlot.start);
  const jornadaEndTime = timeToMinutes(jornada.timeSlot.end);

  // Construir las fechas de la jornada
  let jornadaStart: Date;
  let jornadaEnd: Date;

  if (jornada.timeSlot.nextDay) {
    // La jornada cruza medianoche
    jornadaStart = new Date(`${selectedDateStr}T${jornada.timeSlot.start}:00`);
    jornadaEnd = new Date(`${nextDateStr}T${jornada.timeSlot.end}:00`);
  } else {
    // La jornada es en el mismo día
    jornadaStart = new Date(`${selectedDateStr}T${jornada.timeSlot.start}:00`);
    jornadaEnd = new Date(`${selectedDateStr}T${jornada.timeSlot.end}:00`);
  }

  // Verificar solapamiento: el evento ocupa la jornada si hay intersección
  return eventStart < jornadaEnd && eventEnd > jornadaStart;
}

// Función para obtener jornadas disponibles basándose en eventos
export function getAvailableJornadas(
  events: CalendarEvent[],
  roomId: RoomId,
  selectedDate: Date
): JornadaType[] {
  const room = getRoomById(roomId);
  if (!room) return [];

  // Filtrar eventos reales (no vacíos)
  const realEvents = events.filter(e =>
    e && typeof e === 'object' && Object.keys(e).length > 0 && e.start && e.end
  );

  // Si no hay eventos, todas las jornadas están disponibles
  if (realEvents.length === 0) {
    return room.jornadas.map(j => j.id);
  }

  // Verificar cada jornada
  const available: JornadaType[] = [];

  for (const jornada of room.jornadas) {
    const isOccupied = realEvents.some(event =>
      eventOccupiesJornada(event, jornada, selectedDate)
    );

    if (!isOccupied) {
      available.push(jornada.id);
    }
  }

  return available;
}

// Función para verificar disponibilidad via n8n webhook
// Devuelve los eventos y las jornadas disponibles
export async function checkAvailability(date: Date, roomId: RoomId): Promise<AvailabilityResult> {
  try {
    const room = getRoomById(roomId);

    // Crear rango de fechas: mes completo para cachear si se quiere, o día actual
    const startDateTime = formatDateLocal(date); // YYYY-MM-DD
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const endDateTime = formatDateLocal(nextDay); // YYYY-MM-DD

    // Petición GET al nuevo webhook
    const url = new URL(N8N_WEBHOOK_URL);
    url.searchParams.append('room', roomId);
    url.searchParams.append('dateFrom', startDateTime);
    url.searchParams.append('dateTo', endDateTime);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('Error en respuesta del webhook de disponibilidad:', response.status);
      return { events: [], availableJornadas: [] };
    }

    const data = await response.json();

    // Parsear eventos del nuevo formato: { "room":"x", "busy": [{start:"...", end:"..."}] }
    let events: CalendarEvent[] = [];

    if (data && data.busy && Array.isArray(data.busy)) {
      events = data.busy.map((b: any, index: number) => ({
        id: `busy-${index}`,
        start: { dateTime: b.start },
        end: { dateTime: b.end }
      }));
    } else if (Array.isArray(data)) {
      // Fallback por si devuelve array directo
      const busyArr = data[0]?.busy || data;
      if (Array.isArray(busyArr)) {
        events = busyArr.map((b: any, index: number) => ({
          id: `busy-${index}`,
          start: { dateTime: b.start || b.start?.dateTime },
          end: { dateTime: b.end || b.end?.dateTime }
        })).filter(e => e.start.dateTime && e.end.dateTime);
      }
    }

    // Calcular jornadas disponibles
    const availableJornadas = getAvailableJornadas(events, roomId, date);

    return { events, availableJornadas };
  } catch (error) {
    console.error('Error verificando disponibilidad:', error);
    return { events: [], availableJornadas: [] };
  }
}

// Función para obtener precios dinámicos desde n8n
export async function fetchJornadaPrices(date: Date, roomId: RoomId): Promise<JornadaPrices | null> {
  try {
    const room = getRoomById(roomId);

    // Formatear fecha como dd/mm/yyyy
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const dateFormatted = `${day}/${month}/${year}`;

    // Petición GET al webhook de precios
    const url = new URL(N8N_PRICES_WEBHOOK_URL);
    url.searchParams.append('room', roomId);
    url.searchParams.append('date', dateFormatted);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('Error obteniendo precios:', response.status);
      return null;
    }

    const data = await response.json();

    // Parsear respuesta - viene como array con un objeto
    let pricesResponse: JornadaPricesResponse;

    if (Array.isArray(data) && data.length > 0) {
      pricesResponse = data[0];
    } else if (data && typeof data === 'object') {
      pricesResponse = data;
    } else {
      return null;
    }

    // Validar que tenga los campos necesarios y normalizar nombres
    if (
      pricesResponse.jornada_de_dia !== undefined &&
      pricesResponse.jornada_de_noche !== undefined &&
      pricesResponse.dia_entero_manana !== undefined &&
      pricesResponse.dia_entero_noche !== undefined
    ) {
      // Convertir a número por si vienen como texto desde Google Sheets ('150' -> 150)
      return {
        dia: Number(pricesResponse.jornada_de_dia) || 0,
        noche: Number(pricesResponse.jornada_de_noche) || 0,
        dia_entero_manana: Number(pricesResponse.dia_entero_manana) || 0,
        dia_entero_noche: Number(pricesResponse.dia_entero_noche) || 0
      };
    }

    return null;
  } catch (error) {
    console.error('Error obteniendo precios:', error);
    return null;
  }
}

// Función auxiliar para formatear fecha y hora como dd/mm/yyyy HH:mm
function formatDateTimeSpanish(date: Date, time: string): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year} ${time}`;
}

// Función para crear reserva
export async function createBooking(booking: BookingData): Promise<{ success: boolean; message: string; bookingId?: string; contractUrl?: string }> {
  try {
    const room = getRoomById(booking.room!);
    const jornada = getJornadaForRoom(booking.room!, booking.jornada!);
    const decoration = booking.extras.decoracion
      ? DECORATIONS.find(d => d.id === booking.extras.decoracion)
      : null;
    const pack = booking.extras.pack
      ? PACKS.find(p => p.id === booking.extras.pack)
      : null;
    const email = getEffectiveEmail(booking.clientData.email);

    // Calcular fecha de entrada y salida
    let fechaEntrada: string | null = null;
    let fechaSalida: string | null = null;

    if (booking.date && jornada) {
      const entryDate = new Date(booking.date);
      fechaEntrada = formatDateTimeSpanish(entryDate, jornada.timeSlot.start);

      // Si la jornada termina al día siguiente
      const exitDate = new Date(booking.date);
      if (jornada.timeSlot.nextDay) {
        exitDate.setDate(exitDate.getDate() + 1);
      }
      fechaSalida = formatDateTimeSpanish(exitDate, jornada.timeSlot.end);
    }

    const response = await fetch(N8N_BOOKING_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Datos de la estancia
        room_id: booking.room,
        room_name: room?.name,
        fecha: booking.date ? formatDateLocal(booking.date) : null,
        fecha_entrada: fechaEntrada,
        fecha_salida: fechaSalida,
        jornada_id: booking.jornada,
        jornada_name: jornada?.name,
        jornada_horario: jornada ? formatTimeSlot(jornada.timeSlot) : null,
        jornada_precio: booking.jornadaPrice,

        // Extras
        decoracion_id: booking.extras.decoracion,
        decoracion_name: decoration?.name || null,
        decoracion_precio: decoration?.price || 0,
        decoracion_iniciales: booking.extras.decoracionDetails.iniciales || null,
        decoracion_numero: booking.extras.decoracionDetails.numero || null,

        pack_id: booking.extras.pack,
        pack_name: pack?.name || null,
        pack_precio: pack?.price || 0,

        personas_extra: booking.extras.personasExtra,
        personas_extra_precio: booking.extras.personasExtra * PERSONA_EXTRA_PRICE,

        // Total
        precio_total: calculateTotalPrice(booking),

        comentarios: booking.comments || "",

        // Datos del cliente
        arrendador_nombre: booking.clientData.arrendadorNombre,
        arrendador_dni: booking.clientData.arrendadorDni,
        acompanante_nombre: booking.clientData.acompananteNombre,
        acompanante_dni: booking.clientData.acompananteDni,
        email,
        telefono: booking.clientData.telefono
      })
    });

    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor');
    }

    const data = await response.json();

    // Extraer URL del contrato de la respuesta del webhook
    // La respuesta viene como array: [{ submitters: [{ embed_src: "..." }] }]
    let contractUrl: string | undefined;
    if (Array.isArray(data) && data[0]?.submitters?.[0]?.embed_src) {
      contractUrl = data[0].submitters[0].embed_src;
    }

    return {
      success: true,
      message: 'El contrato ha sido generado. Firma el documento para continuar con el pago.',
      bookingId: data[0]?.id?.toString() || `NJ-${Date.now()}`,
      contractUrl
    };
  } catch (error) {
    console.error('Error creando reserva:', error);
    return {
      success: false,
      message: 'Error al crear la reserva. Por favor, inténtalo de nuevo.'
    };
  }
}

// Validación de nombre completo (mínimo nombre y apellido)
export function validateFullName(name: string): boolean {
  const trimmed = name.trim();
  // Debe tener al menos 2 palabras con mínimo 2 caracteres cada una
  const words = trimmed.split(/\s+/).filter(word => word.length >= 2);
  return words.length >= 2;
}

// Validación de DNI/NIE español con letra de control
export function validateDNI(dni: string): boolean {
  const upperDni = dni.toUpperCase().trim();

  // Letras de control en orden
  const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';

  // Validar formato DNI: 7-8 dígitos + 1 letra (permitir sin 0 inicial)
  const dniRegex = /^[0-9]{7,8}[A-Z]$/;
  if (dniRegex.test(upperDni)) {
    // Extraer parte numérica (todo menos la última letra)
    const parteNumerica = upperDni.slice(0, -1).padStart(8, '0');
    const numero = parseInt(parteNumerica, 10);
    const letraEsperada = letras[numero % 23];
    return upperDni.charAt(upperDni.length - 1) === letraEsperada;
  }

  // Validar formato NIE: X/Y/Z + 7 dígitos + 1 letra
  const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
  if (nieRegex.test(upperDni)) {
    // Reemplazar primera letra por número: X=0, Y=1, Z=2
    let nieNumero = upperDni.substring(1, 8);
    const primeraLetra = upperDni.charAt(0);
    if (primeraLetra === 'X') nieNumero = '0' + nieNumero;
    else if (primeraLetra === 'Y') nieNumero = '1' + nieNumero;
    else if (primeraLetra === 'Z') nieNumero = '2' + nieNumero;

    const numero = parseInt(nieNumero, 10);
    const letraEsperada = letras[numero % 23];
    return upperDni.charAt(8) === letraEsperada;
  }

  return false;
}

// Validación de email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validación de teléfono español
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[679][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}
