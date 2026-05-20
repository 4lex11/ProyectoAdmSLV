"use client";

import React, { useState } from 'react';
import { Send, Plus, Search, ArrowLeft, Shield } from 'lucide-react';

interface System {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: 'green' | 'purple' | 'orange' | 'blue';
}

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

type Page = 'selection' | 'chat';

const ChatbotSoporte: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('selection');
  const [selectedSystem, setSelectedSystem] = useState<System | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');

  const systems: System[] = [
    { 
      id: 'seguro-vida-ley', 
      name: 'Seguro Vida Ley', 
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-xl">
          👥
        </div>
      ),
      color: 'green' 
    },
    { 
      id: 'retcc', 
      name: 'RETCC', 
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xl">
          📋
        </div>
      ),
      color: 'purple' 
    },
    { 
      id: 'remype', 
      name: 'REMYPE', 
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white text-xl">
          🏢
        </div>
      ),
      color: 'orange' 
    },
    { 
      id: 'trabajador-hogar', 
      name: 'Trabajador del hogar', 
      icon: (
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-white text-xl">
          🏠
        </div>
      ),
      color: 'blue' 
    },
  ];

  const handleSystemSelect = (system: System): void => {
    setSelectedSystem(system);
    const initialMessage: Message = {
      id: 1,
      sender: 'bot',
      text: 'Hola, ¿en qué puedo ayudarte hoy?',
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
    setCurrentPage('chat');
  };

  const handleSendMessage = (): void => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: inputMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');

    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        sender: 'bot',
        text: 'La información que el proceso de actualización hecha la fecha de alta en el T-registro puede tardar aproximadamente 12 días.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 500);
  };

  const handleBackToSelection = (): void => {
    setCurrentPage('selection');
    setSelectedSystem(null);
    setMessages([]);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  // Página de selección del sistema
  if (currentPage === 'selection') {
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white px-8 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded px-3 py-1">
                <div className="text-sm font-bold text-red-600">🇵🇪 PERÚ</div>
              </div>
              <div className="border-l-2 border-white/30 pl-4">
                <p className="text-sm font-semibold">Ministerio de Trabajo</p>
                <p className="text-xs text-blue-100">y Promoción del Empleo</p>
              </div>
            </div>
            <h1 className="text-2xl font-bold">Chatbot de Soporte</h1>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <div className="max-w-5xl w-full grid grid-cols-2 gap-16">
            
            {/* Lado Izquierdo - Avatar y Bienvenida */}
            <div className="flex flex-col items-center justify-center">
              <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
                <div className="w-48 h-48 relative">
                  {/* Avatar mejorado */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-7xl">👩‍💼</span>
                  </div>
                  {/* Burbuja de chat */}
                  <div className="absolute -top-2 -right-4 bg-blue-200 rounded-full px-4 py-2 shadow-md">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-blue-900 text-center mb-2">
                ¡Hola! Soy tu asistente virtual
              </h2>
              
              <p className="text-lg font-semibold text-blue-900 text-center mb-6">
                Bienvenid@ al Chatbot<br />de Soporte MTPE
              </p>

              <p className="text-gray-600 text-center mb-8">
                Estamos aquí para ayudarte
              </p>

              {/* Info de disponibilidad */}
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg px-6 py-4 flex items-center gap-3 w-full">
                <Shield className="text-emerald-600" size={24} />
                <div>
                  <p className="font-semibold text-emerald-900 text-sm">
                    Atención disponible las 24<br />horas del día
                  </p>
                </div>
              </div>
            </div>

            {/* Lado Derecho - Selección de Sistemas */}
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
                    style={{
                      animation: `slideIn 0.5s ease-out ${index * 0.1}s both`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        {system.icon}
                      </div>
                      <span className="font-bold text-gray-700 text-lg">{system.name}</span>
                    </div>
                    <span className="text-gray-400 group-hover:text-blue-500 text-2xl transition-colors">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        <style>{`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    );
  }

  // Página de chat
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white px-8 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToSelection}
              className="hover:bg-blue-700 p-2 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
                {selectedSystem?.id === 'seguro-vida-ley' && '👥'}
                {selectedSystem?.id === 'retcc' && '📋'}
                {selectedSystem?.id === 'remype' && '🏢'}
                {selectedSystem?.id === 'trabajador-hogar' && '🏠'}
              </div>
              <h2 className="font-semibold text-lg">{selectedSystem?.name}</h2>
            </div>
          </div>
          <button className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition">
            <Plus size={18} />
            Nueva Conversación
          </button>
        </div>
      </div>

      {/* Contenido del chat */}
      <div className="flex-1 flex flex-col">
        {/* Área de mensajes */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-gray-50 to-white">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-5xl mb-4 opacity-20">💬</div>
                <p className="text-gray-400 text-lg">Iniciando conversación...</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-md px-6 py-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-blue-900 text-white rounded-br-none shadow-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-xs mt-2 ${
                    msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* Botones de respuesta rápida */}
          {messages.length > 0 && messages[messages.length - 1].sender === 'bot' && (
            <div className="flex gap-3 justify-start mt-6 animate-fadeIn">
              <button className="px-5 py-2 bg-green-50 border-2 border-green-400 text-green-700 rounded-lg font-semibold hover:bg-green-100 transition">
                ✓ Sí
              </button>
              <button className="px-5 py-2 bg-red-50 border-2 border-red-400 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition">
                ✕ No
              </button>
            </div>
          )}
        </div>

        {/* Input de mensaje */}
        <div className="bg-white border-t border-gray-200 p-6 shadow-lg">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Escribe tu mensaje..."
              className="flex-1 bg-gray-50 border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-900 hover:bg-blue-800 text-white rounded-xl px-6 py-3 transition flex items-center gap-2 font-semibold shadow-md hover:shadow-lg"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChatbotSoporte;