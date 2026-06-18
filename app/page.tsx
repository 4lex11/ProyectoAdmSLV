"use client";

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Send, Plus, ArrowLeft, Shield, Loader } from 'lucide-react';

interface System {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: 'green' | 'purple' | 'orange' | 'blue';
}

interface CasoEncontrado {
  id_caso: number;
  problema: string;
  solucion: string;
  causa: string;
  mensaje_sistema: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type Page = 'selection' | 'chat';
type ChatStep = 'initial' | 'describe' | 'searching' | 'solution' | 'feedback' | 'closed';

const ChatbotSoporte: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('selection');
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatStep, setChatStep] = useState<ChatStep>('initial');
  const [casoActual, setCasoActual] = useState<CasoEncontrado | null>(null);
  const [consultaUsuario, setConsultaUsuario] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const systems: System[] = [
    {
      id: 'svl',
      name: 'Seguro Vida Ley',
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xl">
          👥
        </div>
      ),
      color: 'green',
    },
    {
      id: 'retcc',
      name: 'RETCC',
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xl">
          📋
        </div>
      ),
      color: 'purple',
    },
    {
      id: 'remype',
      name: 'REMYPE',
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xl">
          🏢
        </div>
      ),
      color: 'orange',
    },
    {
      id: 'renocc',
      name: 'Trabajador del hogar',
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-xl">
          🏠
        </div>
      ),
      color: 'blue',
    },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSystemSelect = (system: System): void => {
    setSelectedSystem(system);
    const initialMessage: Message = {
      id: 'initial',
      role: 'assistant',
      content: `Hola, soy tu asistente para el sistema **${system.name}**. Cuéntame cuál es el mensaje que aparece en el sistema o describe el inconveniente que presentas.`,
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
    setChatStep('describe');
    setCurrentPage('chat');
  };

  const handleBackToSelection = (): void => {
    setCurrentPage('selection');
    setSelectedSystem(null);
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setChatStep('initial');
    setCasoActual(null);
    setConsultaUsuario('');
  };

  const buscarSolucion = async (consulta: string): Promise<void> => {
    if (!selectedSystem) return;

    setIsLoading(true);
    setConsultaUsuario(consulta);

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: consulta,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      // Buscar en Supabase
      const response = await fetch('/api/search-casos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sistema: selectedSystem.id, consulta }),
      });

      const data = await response.json();

      if (data.success && data.caso) {
        // Caso encontrado
        setCasoActual(data.caso);

        const solutionMessage: Message = {
          id: Date.now().toString() + '-solution',
          role: 'assistant',
          content: `**Problema identificado:**
${data.caso.problema}

**Causa:**
${data.caso.causa}

**Solución:**
${data.caso.solucion}

¿Esta información resolvió tu problema?`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, solutionMessage]);
        setChatStep('feedback');
      } else {
        // No se encontró solución
        const notFoundMessage: Message = {
          id: Date.now().toString() + '-notfound',
          role: 'assistant',
          content: data.message || 'No se encontró una solución. Por favor, contacta a soporte al correo soporte@trabajo.gob.pe',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, notFoundMessage]);
        setChatStep('closed');
      }
    } catch (error) {
      console.error('Error buscando solución:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '-error',
        role: 'assistant',
        content: 'Lo siento, ocurrió un error al buscar la solución. Por favor intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (resuelto: boolean): Promise<void> => {
    if (!selectedSystem || !casoActual) return;

    setIsLoading(true);

    // Agregar respuesta del usuario
    const feedbackMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: resuelto ? 'Sí' : 'No',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, feedbackMessage]);

    try {
      // Guardar reporte
      await fetch('/api/save-reporte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idCaso: casoActual.id_caso,
          sistema: selectedSystem.id.toUpperCase(),
          consultaUser: consultaUsuario,
          respuestaBot: casoActual.solucion,
          resuelto,
        }),
      });

      if (resuelto) {
        // Caso resuelto
        const closeMessage: Message = {
          id: Date.now().toString() + '-close',
          role: 'assistant',
          content: 'Perfecto. Gracias por utilizar el Chatbot de Soporte MTPE. ¿Hay algo más en lo que pueda ayudarte?',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, closeMessage]);
        setChatStep('closed');
      } else {
        // Caso no resuelto - mostrar pasos adicionales
        const moreStepsMessage: Message = {
          id: Date.now().toString() + '-moresteps',
          role: 'assistant',
          content: `Entiendo que el problema aún persiste. Te recomendamos:\n\n1. Verifica los pasos mencionados nuevamente\n2. Contacta a soporte al correo: soporte@trabajo.gob.pe\n3. O llama al 01 630 6000 (anexo disponible según el sistema)\n\nPor favor, adjunta screenshots y detalles de tu consulta.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, moreStepsMessage]);
        setChatStep('closed');
      }
    } catch (error) {
      console.error('Error guardando reporte:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (): Promise<void> => {
    if (!input.trim() || isLoading) return;

    if (chatStep === 'describe') {
      await buscarSolucion(input);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  // ─── Página de selección ───────────────────────────────────────────────────
  if (currentPage === 'selection') {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white px-8 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="bg-white rounded px-3 py-1">
              <Image 
                src="/LogoMTPE.png" 
                alt="Logo MTPE" 
                width={250} 
                height={400}
                loading="eager"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold">Chatbot de Soporte</h1>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="max-w-5xl w-full grid grid-cols-2 gap-16">
            <div className="flex flex-col items-center justify-center">
              <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
                <div className="w-48 h-48 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <Image 
                      src="/asistente.png" 
                      alt="Asistente Virtual" 
                      width={192} 
                      height={192}
                      style={{ width: 'auto', height: 'auto' }}
                    />
                  </div>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-blue-900 text-center mb-2">
                ¡Hola! Soy tu asistente virtual
              </h2>
              <p className="text-lg font-semibold text-blue-900 text-center mb-6">
                Bienvenid@ al Chatbot<br />de Soporte MTPE
              </p>
              <p className="text-gray-600 text-center mb-8">Estamos aquí para ayudarte</p>
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg px-6 py-4 flex items-center gap-3 w-full">
                <Shield className="text-emerald-600" size={24} />
                <p className="font-semibold text-emerald-900 text-sm">
                  Atención disponible las 24 horas del día
                </p>
              </div>
            </div>

            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-gray-800 mb-8">
                ¿Sobre qué sistema necesitas ayuda?
              </h3>
              <div className="space-y-4">
                {systems.map((system, index) => (
                  <button
                    key={system.id}
                    onClick={() => handleSystemSelect(system)}
                    className="w-full bg-white border-2 border-gray-200 rounded-xl p-5 text-left hover:border-blue-500 hover:shadow-lg transition-all duration-300 flex items-center justify-between group"
                    style={{ animation: `slideIn 0.5s ease-out ${index * 0.1}s both` }}
                  >
                    <div className="flex items-center gap-4">
                      {system.icon}
                      <span className="font-bold text-gray-700 text-lg">{system.name}</span>
                    </div>
                    <span className="text-gray-400 group-hover:text-blue-500 text-2xl transition-colors">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(20px); }
            to   { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    );
  }

  // ─── Página de chat ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white px-8 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleBackToSelection} className="hover:bg-blue-700 p-2 rounded-lg transition">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
                {selectedSystem?.id === 'svl' && '👥'}
                {selectedSystem?.id === 'retcc' && '📋'}
                {selectedSystem?.id === 'remype' && '🏢'}
                {selectedSystem?.id === 'renocc' && '🏠'}
              </div>
              <h2 className="font-semibold text-lg">{selectedSystem?.name}</h2>
            </div>
          </div>
          <button
            onClick={() => {
              setMessages([
                {
                  id: 'initial-' + Date.now(),
                  role: 'assistant',
                  content: `Hola, soy tu asistente para el sistema **${selectedSystem?.name}**. Cuéntame cuál es el mensaje que aparece en el sistema o describe el inconveniente que presentas.`,
                  timestamp: new Date(),
                },
              ]);
              setInput('');
              setIsLoading(false);
              setChatStep('describe');
              setCasoActual(null);
              setConsultaUsuario('');
            }}
            className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
          >
            <Plus size={18} />
            Nueva Conversación
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-gray-50 to-white">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-md px-6 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-900 text-white rounded-br-none shadow-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {isLoading && chatStep === 'searching' && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-bl-none px-6 py-4 flex items-center gap-2">
                <Loader size={18} className="animate-spin" />
                <span className="text-sm text-gray-600">Buscando solución...</span>
              </div>
            </div>
          )}

          {chatStep === 'feedback' && casoActual && !isLoading && (
            <div className="flex gap-3 justify-start mt-2 animate-fadeIn">
              <button
                onClick={() => handleFeedback(true)}
                className="px-5 py-2 bg-green-50 border-2 border-green-400 text-green-700 rounded-lg font-semibold hover:bg-green-100 transition"
              >
                ✓ Sí
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className="px-5 py-2 bg-red-50 border-2 border-red-400 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition"
              >
                ✕ No
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {chatStep !== 'feedback' && (
          <div className="bg-white border-t border-gray-200 p-6 shadow-lg">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Describe tu problema..."
                disabled={isLoading}
                className="flex-1 bg-gray-50 border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 transition flex items-center gap-2 font-semibold shadow-md hover:shadow-lg"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default ChatbotSoporte;