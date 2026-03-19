import { format } from "date-fns";
// ============================================

// CONFIGURACIÓN DE NEGOCIO - NAUJARAS SEVILLA
// ============================================

// URLs de Webhooks de n8n (producción)
export const N8N_WEBHOOK_URL = "https://n8n-n8n.npfusf.easypanel.host/webhook/a2e613d7-6690-47de-939d-9c479e95e24c";
export const N8N_AVAILABILITY_URL = "https://n8n-n8n.npfusf.easypanel.host/webhook/disponibilidad";
export const N8N_PRICES_WEBHOOK_URL = "https://n8n-n8n.npfusf.easypanel.host/webhook/854bd8ed-d900-4b55-a210-a08dac674651";
export const N8N_BOOKING_WEBHOOK_URL = "https://n8n-n8n.npfusf.easypanel.host/webhook/a34d16d0-2cac-4847-845c-9b0a89f81f0c";

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

export interface DecorationDetails {
  iniciales: string;
  numero: string;
}

export interface RoomConfig {
  id: RoomId;
  name: string;
  description: string;
  image: string;
  capacity: number;
  features: string[];
  jornadas: JornadaConfig[];
  photosLink: string;
}

export interface ClientData {
  arrendadorNombre: string;
  arrendadorDni: string;
  acompananteNombre: string;
  acompananteDni: string;
  email: string;
  telefono: string;
}

export interface BookingData {
  room: RoomId | null;
  date: Date | null;
  jornada: JornadaType | null;
  jornadaPrice: number | null; // Precio dinámico de la jornada
  comments?: string;
  commentFields?: {
    generales: string;
    horaLlegada: string;
    pagoManual: string;
  };
  extras: {
    decoracion: DecorationType | null;
    decoracionDetails: DecorationDetails;
    pack: PackType | null;
    personasExtra: number;
  };
  clientData: ClientData;
  seguroCancelacion: boolean;
}

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

export const DECORATIONS: { id: DecorationType; name: string; price: number }[] = [
  { id: "romantica", name: "Decoración Romántica", price: 20 },
  { id: "cumpleanos", name: "Decoración Cumpleaños", price: 20 },
  { id: "aniversario", name: "Decoración Aniversario", price: 20 }
];

export const PACKS: { id: PackType; name: string; price: number }[] = [
  { id: "cava", name: "Pack Cava", price: 15 },
  { id: "lambrusco", name: "Pack Lambrusco", price: 10 }
];

export const PERSONA_EXTRA_PRICE = 10;
export const MAX_PERSONAS_EXTRA = 2;
export const INSURANCE_PERCENTAGE = 0.05;

export function canAddPersonasExtra(roomId: RoomId | null, jornada: JornadaType | null): boolean {
  return roomId === "atico" && jornada === "dia";
}

export function getRoomById(id: RoomId): RoomConfig | undefined {
  return ROOMS.find(r => r.id === id);
}

export function getJornadaForRoom(roomId: RoomId, jornadaId: JornadaType): JornadaConfig | undefined {
  const room = getRoomById(roomId);
  return room?.jornadas.find(j => j.id === jornadaId);
}

export function calculateTotalPrice(booking: BookingData): number {
  let total = 0;

  // Precio de la jornada (dinámico si existe, sino estático)
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
    if (decoration) total += decoration.price;
  }

  // Pack
  if (booking.extras.pack) {
    const pack = PACKS.find(p => p.id === booking.extras.pack);
    if (pack) total += pack.price;
  }

  // Personas extra
  if (canAddPersonasExtra(booking.room, booking.jornada)) {
    total += booking.extras.personasExtra * PERSONA_EXTRA_PRICE;
  }

  // Seguro de cancelación (5% del total de la estancia)
  if (booking.seguroCancelacion) {
    total += Math.round(total * INSURANCE_PERCENTAGE * 100) / 100;
  }

  return total;
}

export function calculateInsurancePrice(booking: BookingData): number {
  let baseTotal = 0;

  if (booking.room && booking.jornada) {
    if (booking.jornadaPrice !== null && booking.jornadaPrice !== undefined) {
      baseTotal += booking.jornadaPrice;
    } else {
      const jornada = getJornadaForRoom(booking.room, booking.jornada);
      if (jornada) {
        baseTotal += jornada.price;
      }
    }
  }
  
  if (booking.extras.decoracion) {
    const decoration = DECORATIONS.find(d => d.id === booking.extras.decoracion);
    if (decoration) baseTotal += decoration.price;
  }
  
  if (booking.extras.pack) {
    const pack = PACKS.find(p => p.id === booking.extras.pack);
    if (pack) baseTotal += pack.price;
  }
  
  if (canAddPersonasExtra(booking.room, booking.jornada)) {
    baseTotal += booking.extras.personasExtra * PERSONA_EXTRA_PRICE;
  }

  return Math.round(baseTotal * INSURANCE_PERCENTAGE * 100) / 100;
}

export function formatTimeSlot(timeSlot: TimeSlot): string {
  const endLabel = timeSlot.nextDay ? " (día siguiente)" : "";
  return `${timeSlot.start} - ${timeSlot.end}${endLabel}`;
}

// Función auxiliar para formatear fecha en formato ISO local para n8n
export function formatDateTimeLocal(date: Date, time: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T${time}:00`;
}

export interface CalendarEvent {
  id: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  json?: any; // Para compatibilidad con envoltorio n8n
}

export interface AvailabilityResult {
  events: CalendarEvent[];
  availableJornadas: JornadaType[];
}

export interface JornadaPrices {
  [key: string]: number;
}

// Función para obtener precios dinámicos desde n8n
export async function fetchJornadaPrices(date: Date, roomId: RoomId): Promise<JornadaPrices | null> {
  const n8nRoomName = roomId === 'atico' ? 'Ático' : (roomId === 'estudio' ? 'Estudio' : 'Habitación');
  
  try {
    const response = await fetch(N8N_PRICES_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: roomId,
        room_name: n8nRoomName, // n8n Switch1 uses this
        date: format(date, "dd/MM/yyyy"), // Formato con ceros iniciales (ej: 02/03/2026) para match con Excel
        date_iso: format(date, "yyyy-MM-dd"),
        date_formatted: date.toLocaleDateString('es-ES', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })
      }),
      signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
    });

    if (!response.ok) {
      console.warn(`Price webhook returned status ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log('Respuesta precios n8n:', data);

    // Si n8n devuelve una lista, tomamos el primer elemento (la fila de la hoja)
    const row = Array.isArray(data) ? data[0] : data;
    
    if (!row || typeof row !== 'object') return null;

    // Función para limpiar el precio del Excel (ej: " 119,00 € " -> 119)
    const parseExcelPrice = (val: any): number | null => {
      if (typeof val === 'number') return val;
      if (typeof val !== 'string') return null;
      // Eliminar espacios, símbolos de moneda y normalizar coma a punto
      const cleaned = val.trim().replace(/[^\d.,-]/g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    };

    return {
      dia: parseExcelPrice(row.dia ?? row.jornada_de_dia),
      noche: parseExcelPrice(row.noche ?? row.jornada_de_noche),
      dia_entero_manana: parseExcelPrice(row.dia_entero_manana),
      dia_entero_noche: parseExcelPrice(row.dia_entero_noche),
    };
  } catch (error) {
    console.error('Error fetching prices:', error);
    return null;
  }
}

// Función para verificar disponibilidad via n8n webhook
export async function checkAvailability(date: Date, roomId: RoomId): Promise<AvailabilityResult> {
  const room = getRoomById(roomId);
  
  try {
    const dateFrom = format(date, 'yyyy-MM-dd');
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const dateTo = format(nextDay, 'yyyy-MM-dd');

    const payload = {
      action: 'check_availability',
      room_id: roomId,
      room_name: roomId === 'atico' ? 'Ático' : (roomId === 'estudio' ? 'Estudio' : 'Habitación'),
      date_start: `${dateFrom}T00:00:00Z`,
      date_end: `${dateTo}T23:59:59Z`
    };

    const response = await fetch('https://n8n-n8n.npfusf.easypanel.host/webhook/a2e613d7-6690-47de-939d-9c479e95e24c', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined
    });

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const rawText = await response.text();
    let data;
    if (rawText && rawText.trim() !== '') {
      try {
        data = JSON.parse(rawText);
      } catch (e) {
        console.warn('La respuesta de n8n no es un JSON válido, asumiendo sin eventos:', rawText);
        data = [];
      }
    } else {
      data = [];
    }
    
    console.log('Respuesta disponibilidad n8n en APP:', data);

    let rawEvents: any[] = [];
    if (Array.isArray(data)) rawEvents = data;
    else if (data && data.busy && Array.isArray(data.busy)) rawEvents = data.busy;
    else if (data && typeof data === 'object') rawEvents = [data];

    let events: CalendarEvent[] = rawEvents.map(e => e.json ? e.json : e).map(e => {
        const start = e.start ? (e.start.dateTime || e.start.date) : (e.inicio ? (e.inicio['fecha y hora'] || e.inicio.fecha || e.inicio.date || e.inicio.dateTime) : null);
        const end = e.end ? (e.end.dateTime || e.end.date) : (e.fin ? (e.fin['fecha y hora'] || e.fin.fecha || e.fin.date || e.fin.dateTime) : null);
        return { 
            id: `busy-${Math.random()}`,
            start: { dateTime: start || (typeof e.start === 'string' ? e.start : null) }, 
            end: { dateTime: end || (typeof e.end === 'string' ? e.end : null) } 
        };
    }).filter(e => e.start.dateTime && e.end.dateTime);

    const availableJornadas = getAvailableJornadas(events, roomId, date);
    return { events, availableJornadas };

  } catch (error) {
    console.error('Error disponibilidad real:', error);
    throw error;
  }
}

function getAvailableJornadas(events: CalendarEvent[], roomId: RoomId, date: Date): JornadaType[] {
  const room = getRoomById(roomId);
  if (!room) return [];

  console.log(`Evaluando ${events.length} eventos para ${roomId} el ${format(date, 'yyyy-MM-dd')}`);

  return room.jornadas.filter(jornada => {
    // Calcular inicio y fin de la jornada en milisegundos
    const entryDate = new Date(date);
    const [entryHour, entryMin] = jornada.timeSlot.start.split(':').map(Number);
    entryDate.setHours(entryHour, entryMin, 0, 0);

    const exitDate = new Date(date);
    if (jornada.timeSlot.nextDay) {
      exitDate.setDate(exitDate.getDate() + 1);
    }
    const [exitHour, exitMin] = jornada.timeSlot.end.split(':').map(Number);
    exitDate.setHours(exitHour, exitMin, 0, 0);

    const jornadaStart = entryDate.getTime();
    const jornadaEnd = exitDate.getTime();

    // Si hay algún evento que solape con este rango
    const hasOverlap = events.some(event => {
      const startStr = event.start?.dateTime || event.start?.date;
      const endStr = event.end?.dateTime || event.end?.date;
      
      if (!startStr || !endStr) return false;

      const eventStart = new Date(startStr).getTime();
      const eventEnd = new Date(endStr).getTime();

      // Solapamiento: el evento empieza antes del fin de la jornada Y termina después del inicio
      const overlap = eventStart < jornadaEnd && eventEnd > jornadaStart;
      if (overlap) {
        console.log(`Jornada ${jornada.id} OCUPADA por evento: ${eventStart} - ${eventEnd}`);
      }
      return overlap;
    });

    return !hasOverlap;
  }).map(j => j.id);
}


// Función para crear la pre-reserva e iniciar el contrato
export async function createBooking(booking: BookingData): Promise<{ success: boolean; message: string; bookingId?: string; contractUrl?: string }> {
  try {
    const room = getRoomById(booking.room!);
    const jornada = getJornadaForRoom(booking.room!, booking.jornada!);
    const email = getEffectiveEmail(booking.clientData.email);

    let fechaEntrada = "", fechaSalida = "";
    if (booking.date && jornada) {
      fechaEntrada = `${format(booking.date, "yyyy-MM-dd")} ${jornada.timeSlot.start}`;
      const exitDate = new Date(booking.date);
      if (jornada.timeSlot.nextDay) exitDate.setDate(exitDate.getDate() + 1);
      fechaSalida = `${format(exitDate, "yyyy-MM-dd")} ${jornada.timeSlot.end}`;
    }

    const response = await fetch(N8N_BOOKING_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_name: room?.name,
        room_id: booking.room,
        date: booking.date ? format(booking.date, "yyyy-MM-dd") : null,
        jornada: jornada?.name,
        jornada_id: booking.jornada,
        fecha_entrada: fechaEntrada,
        fecha_salida: fechaSalida,
        nombre: booking.clientData.arrendadorNombre,
        dni: booking.clientData.arrendadorDni,
        email: email,
        telefono: booking.clientData.telefono,
        acompanante_nombre: booking.clientData.acompananteNombre,
        acompanante_dni: booking.clientData.acompananteDni,
        extras: {
          decoracion: booking.extras.decoracion,
          decoracionDetails: booking.extras.decoracionDetails,
          pack: booking.extras.pack,
          personasExtra: booking.extras.personasExtra
        },
        comentarios: booking.comments,
        commentFields: booking.commentFields,
        precio_total: calculateTotalPrice(booking),
        seguro_cancelacion: booking.seguroCancelacion
      })
    });

    if (!response.ok) throw new Error("Error al procesar la reserva");

    const data = await response.json();
    let contractUrl: string | undefined;
    
    if (Array.isArray(data) && data[0]?.submitters?.[0]?.embed_src) {
      contractUrl = data[0].submitters[0].embed_src;
    } else if (data && data.contractUrl) {
      contractUrl = data.contractUrl;
    } else {
      console.warn("Generando enlace DocuSeal localmente.");
      const emailEncoded = encodeURIComponent(email);
      const nombre = encodeURIComponent(booking.clientData.arrendadorNombre);
      const dni = encodeURIComponent(booking.clientData.arrendadorDni);
      const nombreAcomp = encodeURIComponent(booking.clientData.acompananteNombre || '');
      const dniAcomp = encodeURIComponent(booking.clientData.acompananteDni || '');
      const numPersonas = (booking.clientData.acompananteNombre ? 2 : 1) + booking.extras.personasExtra;
      const servicios = encodeURIComponent(`${room?.name} (${jornada?.name})`);

      let dia = "", mes = "", anio = "";
      if (booking.date) {
        dia = String(booking.date.getDate()).padStart(2, "0");
        mes = String(booking.date.getMonth() + 1).padStart(2, "0");
        anio = String(booking.date.getFullYear());
      }

      contractUrl = `https://docuseal.com/d/wmTU9BzDWXetEa?email=${emailEncoded}&Nombre_arrendador=${nombre}&DNI=${dni}&Acompa%C3%B1ante=${nombreAcomp}&DNI_acompa%C3%B1ante=${dniAcomp}&Servicios_contratados=${servicios}&N%C3%BAmero_de_personas_incluidas_en_la_reserva=${numPersonas}&fecha_entrada=${encodeURIComponent(fechaEntrada.split(" ")[0])}&hora_entrada=${encodeURIComponent(jornada?.timeSlot.start || '')}&fecha_salida=${encodeURIComponent(fechaSalida.split(" ")[0])}&hora_salida=${encodeURIComponent(jornada?.timeSlot.end || '')}&dia=${dia}&mes=${mes}&a%C3%B1o=${anio}`;
    }

    return {
      success: true,
      message: 'El contrato ha sido generado.',
      bookingId: data[0]?.id?.toString() || data?.id?.toString() || `NJ-${Date.now()}`,
      contractUrl
    };
  } catch (error) {
    console.error("Error createBooking:", error);
    return { success: false, message: "No se pudo conectar con el sistema de reservas." };
  }
}

// Email por defecto cuando el usuario no facilita uno
export const DEFAULT_CONTACT_EMAIL = "gestionchatbotnaujaras@gmail.com";

export function getEffectiveEmail(email: string): string {
  return email.trim() || DEFAULT_CONTACT_EMAIL;
}


// --- FUNCIONES DE VALIDACIÓN MIGRADAS ---

/**
 * Valida que el nombre tenga al menos dos palabras (nombre y apellido)
 */
export function validateFullName(name: string): boolean {
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/).filter(word => word.length >= 2);
  return words.length >= 2;
}

/**
 * Valida DNI o NIE español con su letra de control correspondiente
 */
export function validateDNI(dni: string): boolean {
  const upperDni = dni.toUpperCase().trim();
  const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';

  // Validar formato DNI: 7-8 dígitos + 1 letra
  const dniRegex = /^[0-9]{7,8}[A-Z]$/;
  if (dniRegex.test(upperDni)) {
    const parteNumerica = upperDni.slice(0, -1).padStart(8, '0');
    const numero = parseInt(parteNumerica, 10);
    const letraEsperada = letras[numero % 23];
    return upperDni.charAt(upperDni.length - 1) === letraEsperada;
  }

  // Validar formato NIE: X/Y/Z + 7 dígitos + 1 letra
  const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
  if (nieRegex.test(upperDni)) {
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

/**
 * Valida formato de email estándar
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida teléfono español (9 dígitos empezando por 6, 7 o 9)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[679][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

