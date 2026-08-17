'use client';

import React, { useState, useEffect, useRef } from 'react';
import PageShell from '@/components/layout/PageShell';
import {
  MessageSquare,
  Send,
  User,
  Store,
  ShieldCheck,
  Search,
  ArrowLeft
} from 'lucide-react';
import { ChatMessage, ChatThread } from '@/types';

export default function DedicatedChatPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'buyer' | 'farmer'>('buyer');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = role === 'buyer'
    ? { id: 'buyer-001', name: 'John Doe Enterprise', role: 'buyer' as const }
    : { id: 's-101', name: 'SunValley Grain Farms', role: 'farmer' as const };

  useEffect(() => {
    fetchThreads();
  }, [role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat?action=threads');
      const data = await res.json();
      if (data.success && data.threads) {
        setThreads(data.threads);
        if (data.threads.length > 0 && !activeThread) {
          setActiveThread(data.threads[0]);
          await loadMessages(data.threads[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load chat threads:', err);
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
      console.error('Failed to load messages:', err);
    }
  };

  const handleSelectThread = async (thread: ChatThread) => {
    setActiveThread(thread);
    setMobileView('chat');
    await loadMessages(thread.id);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeThread) return;

    const textToSend = inputText;
    setInputText('');

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
      console.error('Failed to send message:', err);
    }
  };

  return (
    // No footer: the inbox flexes to fill the remaining viewport height, which
    // is what replaces the old calc(100vh - 220px) magic number.
    <PageShell muted wide footer={false} mainClassName="agrox-chat-page">
        {/* Role Toggle Header */}
        <div className="agrox-page-header">
          <div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 3.5vw, 1.75rem)', fontWeight: 800, lineHeight: 1.25 }}>AgroX Direct Messaging Inbox</h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Real-time produce negotiation & logistics coordination (Supabase Client).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--color-surface)', padding: '0.25rem 0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', paddingLeft: '0.35rem' }}>View As:</span>
            <button
              onClick={() => setRole('buyer')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: role === 'buyer' ? 'var(--color-action-primary)' : 'transparent',
                color: role === 'buyer' ? '#FFFFFF' : 'var(--color-text-primary)',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            >
              Buyer
            </button>
            <button
              onClick={() => setRole('farmer')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                background: role === 'farmer' ? 'var(--primitive-green-900)' : 'transparent',
                color: role === 'farmer' ? '#FFFFFF' : 'var(--color-text-primary)',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            >
              Farmer
            </button>
          </div>
        </div>

        {/* Full Inbox Interface Grid. Height comes from `flex: 1` inside
            .agrox-chat-page rather than a hard-coded viewport calculation, so
            the composer is always reachable without scrolling the document. */}
        <div
          className="agrox-chat-inbox-grid"
          style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Thread List Sidebar */}
          <div
            className={`agrox-chat-thread-list ${mobileView === 'chat' ? 'agrox-mobile-hidden' : ''}`}
            style={{ borderRight: '1px solid var(--color-border)', flexDirection: 'column', minWidth: 0, minHeight: 0, background: 'var(--color-surface-muted)' }}
          >
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.5rem' }}>Active Conversations ({threads.length})</div>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                <input
                  type="text"
                  aria-label="Search chats"
                  placeholder="Search chats..."
                  className="agrox-input"
                  style={{
                    paddingLeft: '2.1rem',
                    paddingBlock: '0.45rem',
                    fontSize: '0.825rem',
                    background: 'var(--color-surface-muted)',
                  }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>Loading threads...</div>
              ) : threads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>No active threads found.</div>
              ) : (
                threads.map((t) => {
                  const isSelected = activeThread?.id === t.id;
                  const partnerName = role === 'buyer' ? t.farmerName : t.buyerName;
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectThread(t)}
                      style={{
                        padding: '0.85rem 1rem',
                        borderBottom: '1px solid var(--color-border)',
                        background: isSelected ? 'var(--color-surface)' : 'transparent',
                        cursor: 'pointer',
                        borderLeft: isSelected ? '4px solid var(--color-action-primary)' : '4px solid transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{partnerName}</div>
                        <span style={{ fontSize: '0.675rem', color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                          {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.785rem', color: 'var(--color-action-primary)', fontWeight: 600, marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.productName || 'General Produce'}
                      </div>
                      <div style={{ fontSize: '0.785rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.lastMessage}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Conversation Panel */}
          <div
            className={`agrox-chat-panel ${mobileView === 'list' ? 'agrox-mobile-hidden' : ''}`}
            style={{ flexDirection: 'column', minWidth: 0, minHeight: 0, background: 'var(--color-surface)' }}
          >
            {activeThread ? (
              <>
                {/* Header with Mobile Back Button */}
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                    <button
                      onClick={() => setMobileView('list')}
                      className="agrox-btn agrox-btn-outline visible-mobile"
                      style={{ flexShrink: 0, padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                      aria-label="Back to chat list"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {role === 'buyer' ? activeThread.farmerName : activeThread.buyerName}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Item: <strong>{activeThread.productName}</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--primitive-green-100)', color: 'var(--primitive-green-900)', padding: '0.25rem 0.6rem', borderRadius: '10px', fontSize: '0.725rem', fontWeight: 700, flexShrink: 0 }}>
                    <ShieldCheck size={13} /> <span className="hidden-mobile">Escrow Protected</span>
                  </div>
                </div>

                {/* Messages Body */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          {msg.senderRole === 'farmer' ? <Store size={11} /> : <User size={11} />}
                          {msg.senderName} ({msg.senderRole})
                        </div>
                        <div style={{ maxWidth: '85%', padding: '0.75rem 1rem', borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px', background: isMe ? 'var(--color-action-primary)' : 'var(--color-surface-muted)', color: isMe ? '#FFFFFF' : 'var(--color-text-primary)', fontSize: '0.875rem', lineHeight: 1.45, boxShadow: 'var(--shadow-sm)', wordBreak: 'break-word' }}>
                          {msg.text}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Bar */}
                <form onSubmit={handleSendMessage} style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.5rem', background: 'var(--color-surface)' }}>
                  <input
                    type="text"
                    aria-label="Message"
                    placeholder="Type message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="agrox-input"
                    style={{ flex: 1, minWidth: 0, fontSize: '0.875rem', background: 'var(--color-surface-muted)' }}
                  />
                  <button type="submit" disabled={!inputText.trim()} className="agrox-btn agrox-btn-primary" style={{ flexShrink: 0, padding: '0.65rem 1rem', opacity: inputText.trim() ? 1 : 0.5 }}>
                    <Send size={16} /> <span className="hidden-mobile">Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-secondary)' }}>
                <MessageSquare size={44} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Select a chat conversation</h3>
              </div>
            )}
          </div>
        </div>
    </PageShell>
  );
}
