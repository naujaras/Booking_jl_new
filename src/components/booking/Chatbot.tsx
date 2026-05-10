import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CHATBOT_URL = "/api/n8n/chatbot-hub";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  isTyping?: boolean;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sessionId] = useState(() => 'booking_' + Math.random().toString(36).substr(2, 9));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: Date.now().toString(),
          sender: "bot",
          text: "¡Hola! 🧡 Soy el asistente de Naujarás. Estoy aquí para ayudarte con cualquier duda sobre tu reserva. ¿Qué necesitas saber?"
        }
      ]);
    }
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendToBot = async (text: string) => {
    const typingId = "typing_" + Date.now();
    setMessages(prev => [...prev, { id: typingId, sender: "bot", text: "Consultando...", isTyping: true }]);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout

      const response = await fetch(CHATBOT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          sessionId: sessionId,
          source: "booking_app"
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      let botText = "Lo siento, he tenido un problema conectando con mi cerebro. ¿Puedes repetir?";
      if (Array.isArray(data)) {
        botText = data[0].output || data[0].content || data[0].text || botText;
      } else {
        botText = data.output || data.content || data.text || botText;
      }

      setMessages(prev => 
        prev.map(m => m.id === typingId ? { id: Date.now().toString(), sender: "bot", text: botText } : m)
      );
    } catch (e: any) {
      const errorMsg = e.name === 'AbortError' 
        ? "El asistente está muy ocupado, inténtalo de nuevo en unos segundos."
        : "Vaya, parece que no tengo conexión ahora mismo.";
        
      setMessages(prev => 
        prev.map(m => m.id === typingId ? { id: Date.now().toString(), sender: "bot", text: errorMsg } : m)
      );
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue("");
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: "user", text }]);
    sendToBot(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const formatBotText = (text: string) => {
    let safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/__(.+?)__/g, '<strong>$1</strong>');
    safe = safe.replace(/\*(.+?)\*/g, '<em>$1</em>');
    safe = safe.replace(/\\n/g, '<br>');
    safe = safe.replace(/\n/g, '<br>');
    return safe;
  };

  return (
    <>
      {/* Botón flotante para la Aplicación */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 h-14 rounded-full px-6 shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground z-40 animate-bounce cursor-pointer"
        size="lg"
      >
        <MessageCircle className="mr-2 h-5 w-5" />
        <span className="font-semibold">¿Dudas? Asistente virtual</span>
      </Button>

      {/* Modal / Panel del Chatbot */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-0">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md h-[80vh] sm:h-[600px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="h-16 bg-primary text-primary-foreground px-4 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="bg-primary-foreground/20 p-2 rounded-full">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Asistente Naujarás</h3>
                  <p className="text-xs opacity-80 leading-tight">Respuestas inmediatas a tus dudas</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="text-primary-foreground hover:bg-primary-foreground/20 rounded-full h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      msg.sender === "user" 
                        ? "bg-primary text-white rounded-br-none" 
                        : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none"
                    }`}
                  >
                    {msg.isTyping ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin opacity-70" />
                        <span className="italic opacity-80">{msg.text}</span>
                      </div>
                    ) : (
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: msg.sender === "bot" ? formatBotText(msg.text) : msg.text 
                        }} 
                      />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-950 border-t border-border flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu duda aquí..."
                className="flex-1 rounded-full bg-slate-100 dark:bg-slate-800 border-transparent text-slate-900 dark:text-slate-100 focus-visible:ring-primary h-12"
              />
              <Button 
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="rounded-full h-12 w-12 p-0 flex-shrink-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

