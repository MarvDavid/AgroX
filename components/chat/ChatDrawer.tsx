'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare, User, Store, ShieldCheck, RefreshCw } from 'lucide-react';
import { ChatMessage, ChatThread } from '@/types';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetProduct?: {
    id: string;
    name: string;
    sellerId: string;
    sellerName: string;
  } | null;
  currentUser?: {
    id: string;
    name: string;
    role: 'buyer' | 'farmer';
  };
}

export default function ChatDrawer({
  isOpen,
  onClose,
  targetProduct,
  currentUser = { id: 'buyer-001', name: 'John Doe Enterprise', role: 'buyer' },
}: ChatDrawerProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      initChatSession();
    }
  }, [isOpen, targetProduct]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initChatSession = async () => {
    setLoading(true);
    try {
      if (targetProduct) {
        // Create or get target thread
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_thread',
            productId: targetProduct.id,
            productName: targetProduct.name,
            buyerId: currentUser.id,
            buyerName: currentUser.name,
            farmerId: targetProduct.sellerId,
            farmerName: targetProduct.sellerName,
          }),
        });
        const data = await res.json();
        if (data.success && data.thread) {
          setActiveThread(data.thread);
          await loadMessages(data.thread.id);
        }
      } else {
        // Load user threads
        const res = await fetch('/api/chat?action=threads');
        const data = await res.json();
        if (data.success && data.threads) {
          setThreads(data.threads);
          if (data.threads.length > 0 && !activeThread) {
            setActiveThread(data.threads[0]);
            await loadMessages(data.threads[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Error initializing chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/chat?chatId=${encodeURIComponent(chatId)}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeThread) return;

    const textToSend = inputText;
    setInputText('');

    // Optimistic UI push
    const tempMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      chatId: activeThread.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text: textToSend,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: activeThread.id,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          text: textToSend,
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? data.message : m)));
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="agrox-drawer-backdrop" onClick={onClose} style={{ zIndex: 120 }} />
      <div
        className="agrox-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '450px',
          background: 'var(--color-surface)',
          zIndex: 121,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)',
          borderLeft: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-surface-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--primitive-green-100)',
                color: 'var(--primitive-green-900)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                {activeThread
                  ? currentUser.role === 'buyer'
                    ? activeThread.farmerName
                    : activeThread.buyerName
                  : 'AgroX Direct Chat'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <ShieldCheck size={12} style={{ color: 'var(--color-success)' }} />
                Escrow Direct Messaging (Supabase Client)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--color-text-secondary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Product Banner if negotiating a specific item */}
        {activeThread?.productName && (
          <div
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--primitive-green-100)',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: 'var(--primitive-green-900)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <span>Inquiry on: <strong>{activeThread.productName}</strong></span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>ID: {activeThread.productId}</span>
          </div>
        )}

        {/* Message Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            background: 'var(--color-surface)',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-secondary)' }}>
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.875rem' }}>Connecting to secure chat server...</p>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-secondary)' }}>
              <MessageSquare size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>Start the negotiation</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Ask about volume availability, moisture specifications, or shipping schedule.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      marginBottom: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    {msg.senderRole === 'farmer' ? <Store size={12} /> : <User size={12} />}
                    {msg.senderName} ({msg.senderRole})
                  </div>
                  <div
                    style={{
                      maxWidth: '82%',
                      padding: '0.75rem 1rem',
                      borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      background: isMe ? 'var(--color-action-primary)' : 'var(--color-surface-muted)',
                      color: isMe ? '#FFFFFF' : 'var(--color-text-primary)',
                      fontSize: '0.9rem',
                      lineHeight: 1.45,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {msg.text}
                  </div>
                  <span style={{ fontSize: '0.675rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{ padding: '0.5rem 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', background: 'var(--color-surface-muted)', borderTop: '1px solid var(--color-border)' }}>
          {[
            'Is this produce available for immediate dispatch?',
            'What is the minimum bulk order quantity?',
            'Can we schedule logistics pickup for tomorrow?',
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(chip)}
              style={{
                whiteSpace: 'nowrap',
                fontSize: '0.75rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '12px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: '0.75rem',
            background: 'var(--color-surface)',
          }}
        >
          <input
            type="text"
            placeholder="Type your message here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              outline: 'none',
              fontSize: '0.9rem',
              background: 'var(--color-surface-muted)',
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="agrox-btn agrox-btn-primary"
            style={{ opacity: inputText.trim() ? 1 : 0.5, padding: '0.75rem 1.25rem' }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}
