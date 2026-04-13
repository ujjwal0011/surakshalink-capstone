import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';

// ─── Credit Packages (mirrors backend) ───
const CREDIT_PACKAGES = [
  { id: 'starter',  credits: 2,  cost: 100, emoji: '⚡', label: 'Starter Pack',  description: 'A quick top-up for light usage.' },
  { id: 'standard', credits: 5,  cost: 200, emoji: '🔋', label: 'Standard Pack', description: 'Best value for regular learners.' },
  { id: 'bulk',     credits: 10, cost: 350, emoji: '💎', label: 'Bulk Pack',     description: 'Power through your study sessions.' },
  { id: 'mega',     credits: 25, cost: 750, emoji: '🔥', label: 'Mega Pack',     description: 'Become an AI-powered disaster expert!' },
];

const StudentAI = () => {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'credits'

  // ── Credits State ──
  const [credits, setCredits] = useState({ summary: 0, chatbot: 0, purchased: 0 });
  const [totalXP, setTotalXP] = useState(0);
  const [purchasing, setPurchasing] = useState(null);
  const [confirmPkg, setConfirmPkg] = useState(null);

  // ── Chat State ──
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  // ── Load initial data ──
  useEffect(() => {
    fetchCredits();
    fetchConversations();
  }, []);

  // ── Auto-scroll to bottom on new messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCredits = async () => {
    try {
      const { data } = await api.get('/ai/credits');
      setCredits({ summary: data.summary, chatbot: data.chatbot, purchased: data.purchased });
    } catch (err) {
      // Silently fail — credits will show as 0
    }
  };

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/ai/chat');
      setConversations(data);
    } catch (err) {
      // Silently fail
    } finally {
      setLoadingChats(false);
    }
  };

  const loadConversation = async (convId) => {
    try {
      const { data } = await api.get(`/ai/chat/${convId}`);
      setActiveConversation(data);
      setMessages(data.messages || []);
      setSidebarOpen(false);
    } catch (err) {
      toast.error('Failed to load conversation');
    }
  };

  const startNewChat = () => {
    setActiveConversation(null);
    setMessages([]);
    setInputMessage('');
    setSidebarOpen(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sending) return;

    const userMsg = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    // Optimistic UI — show user message immediately
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);

    try {
      let response;
      if (activeConversation) {
        // Continue existing conversation
        response = await api.post(`/ai/chat/${activeConversation._id}/message`, { message: userMsg });
        // Add AI response
        const aiMsg = response.data.messages.find(m => m.role === 'assistant');
        if (aiMsg) {
          setMessages(prev => [...prev, { role: 'assistant', content: aiMsg.content, timestamp: new Date() }]);
        }
      } else {
        // Start new conversation
        response = await api.post('/ai/chat/new', { message: userMsg });
        setActiveConversation(response.data.conversation);
        setMessages(response.data.conversation.messages);
        // Refresh conversation list
        fetchConversations();
      }

      // Update credits from response
      if (response.data.credits) {
        setCredits(response.data.credits);
      }
    } catch (err) {
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1));

      if (err.response?.data?.creditsNeeded) {
        toast.error('No AI credits remaining! Visit the Credit Center to buy more.', { duration: 5000 });
        setActiveTab('credits');
      } else {
        toast.error(err.response?.data?.error || 'Failed to send message');
      }
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/chat/${convId}`);
      setConversations(prev => prev.filter(c => c._id !== convId));
      if (activeConversation?._id === convId) {
        startNewChat();
      }
      toast.success('Conversation deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handlePurchase = async (pkg) => {
    setPurchasing(pkg.id);
    try {
      const { data } = await api.post('/ai/credits/purchase', { packageId: pkg.id });
      toast.success(data.message, { icon: pkg.emoji });
      setCredits(data.credits);
      setTotalXP(data.remainingXP);
      setConfirmPkg(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  // Fetch XP when credits tab is opened
  useEffect(() => {
    if (activeTab === 'credits') {
      api.get('/users/me').then(({ data }) => setTotalXP(data.totalXP)).catch(() => {});
      fetchCredits();
    }
  }, [activeTab]);

  const totalCredits = credits.summary + credits.chatbot + credits.purchased;

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── TOP HEADER ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">AI Assistant</h1>
              <p className="text-xs text-gray-400">Powered by SurakshaBot</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Credit Badge */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-purple-200 rounded-xl px-4 py-2 flex items-center gap-2">
              <span className="text-sm">⚡</span>
              <span className="font-black text-purple-700 text-sm">{totalCredits} Credits</span>
            </div>

            {/* Tab Buttons */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                  activeTab === 'chat'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🤖 Chat
              </button>
              <button
                onClick={() => setActiveTab('credits')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                  activeTab === 'credits'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                ⚡ Credits
              </button>
            </div>

            <Link
              to="/dashboard/student"
              className="text-sm font-bold text-gray-400 hover:text-gray-600 transition hidden md:block"
            >
              ← Lobby
            </Link>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      {activeTab === 'chat' ? (
        <ChatView
          conversations={conversations}
          activeConversation={activeConversation}
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          sending={sending}
          loadingChats={loadingChats}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onSend={handleSendMessage}
          onLoadConversation={loadConversation}
          onStartNew={startNewChat}
          onDelete={handleDeleteConversation}
          credits={credits}
          messagesEndRef={messagesEndRef}
        />
      ) : (
        <CreditCenter
          credits={credits}
          totalXP={totalXP}
          purchasing={purchasing}
          confirmPkg={confirmPkg}
          setConfirmPkg={setConfirmPkg}
          onPurchase={handlePurchase}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════
// CHAT VIEW COMPONENT
// ═══════════════════════════════════════════
const ChatView = ({
  conversations, activeConversation, messages, inputMessage, setInputMessage,
  sending, loadingChats, sidebarOpen, setSidebarOpen, onSend, onLoadConversation,
  onStartNew, onDelete, credits, messagesEndRef
}) => {
  const totalCredits = credits.chatbot + credits.purchased;

  return (
    <div className="flex h-[calc(100vh-130px)]">
      {/* ── SIDEBAR ── */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 bg-white flex-shrink-0`}>
        <div className="w-80 h-full flex flex-col">
          {/* New Chat Button */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={onStartNew}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
            >
              ✨ New Conversation
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {loadingChats ? (
              <div className="text-center py-8">
                <div className="inline-block h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-3xl block mb-3">💬</span>
                <p className="text-gray-400 text-sm">No conversations yet</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv._id}
                  onClick={() => onLoadConversation(conv._id)}
                  className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 flex items-start justify-between ${
                    activeConversation?._id === conv._id
                      ? 'bg-purple-50 border-2 border-purple-200'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 truncate">{conv.title}</h4>
                    <p className="text-xs text-gray-400 mt-1 truncate">{conv.preview}</p>
                    <p className="text-[10px] text-gray-300 mt-1">
                      {new Date(conv.lastMessageAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' · '}{conv.messageCount} msgs
                    </p>
                  </div>
                  <button
                    onClick={(e) => onDelete(conv._id, e)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1 flex-shrink-0"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── CHAT MAIN AREA ── */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">
                {activeConversation ? activeConversation.title : 'New Conversation'}
              </h3>
              <p className="text-xs text-gray-400">Ask disaster preparedness questions only</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
              🟢 {credits.chatbot} free + 🟡 {credits.purchased} purchased
            </span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <WelcomeScreen />
          ) : (
            messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))
          )}
          {sending && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">🤖</span>
              </div>
              <div className="bg-white rounded-2xl rounded-tl-md px-5 py-3 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-xs text-gray-400">SurakshaBot is thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          {totalCredits <= 0 ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-700 font-bold text-sm mb-1">⚡ No chatbot credits remaining!</p>
              <p className="text-red-500 text-xs">Visit the Credit Center to purchase more credits with your XP.</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
                placeholder="Ask about earthquake safety, flood preparedness, first aid..."
                className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-100 transition-all placeholder:text-gray-400"
                disabled={sending}
              />
              <button
                onClick={onSend}
                disabled={!inputMessage.trim() || sending}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
              >
                {sending ? (
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// WELCOME SCREEN
// ═══════════════════════════════════════════
const WelcomeScreen = () => (
  <div className="flex-1 flex items-center justify-center h-full">
    <div className="max-w-md text-center">
      <div className="h-20 w-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-200">
        <span className="text-4xl">🛡️</span>
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">SurakshaBot</h2>
      <p className="text-gray-500 text-sm mb-8">Your AI disaster preparedness assistant. Ask anything about safety, emergencies, and survival!</p>

      <div className="grid grid-cols-1 gap-3 text-left">
        {[
          { q: 'What should I do during an earthquake?', icon: '🌍' },
          { q: 'How do I prepare a Go-Bag for floods?', icon: '🌊' },
          { q: 'What are the NDRF helpline numbers?', icon: '📞' },
          { q: 'How to give first aid for burn injuries?', icon: '🩹' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-xl border-2 border-gray-100 p-4 hover:border-purple-200 hover:shadow-sm transition-all cursor-default">
            <div className="flex items-center gap-3">
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm text-gray-700 font-medium">{item.q}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-300 mt-6">⚠️ I only answer disaster & safety related questions</p>
    </div>
  </div>
);

// ═══════════════════════════════════════════
// MESSAGE BUBBLE
// ═══════════════════════════════════════════
const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
          : 'bg-gradient-to-br from-violet-500 to-purple-600'
      }`}>
        <span className="text-white text-xs">{isUser ? '👤' : '🤖'}</span>
      </div>

      {/* Message Content */}
      <div className={`max-w-[75%] ${
        isUser
          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl rounded-tr-md'
          : 'bg-white text-gray-800 rounded-2xl rounded-tl-md border border-gray-100 shadow-sm'
      } px-5 py-3`}>
        <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? '' : 'chat-response'}`}>
          {message.content}
        </div>
        {message.timestamp && (
          <p className={`text-[10px] mt-2 ${isUser ? 'text-white/60' : 'text-gray-300'}`}>
            {new Date(message.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════
// CREDIT CENTER
// ═══════════════════════════════════════════
const CreditCenter = ({ credits, totalXP, purchasing, confirmPkg, setConfirmPkg, onPurchase }) => {
  const totalCredits = credits.summary + credits.chatbot + credits.purchased;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Credit Balance Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8 hover:shadow-md transition">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              ⚡ Credit Balance
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                {totalCredits} Total
              </span>
            </h2>
            <p className="text-gray-400 text-xs mt-1">Free credits roll over daily (capped). Purchased never expire.</p>
          </div>
          <div className="bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="text-lg">💰</span>
            <span className="font-black text-yellow-700 text-lg">{totalXP} XP</span>
          </div>
        </div>

        {/* Credit Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CreditTypeCard
            label="Summary Credits"
            value={credits.summary}
            max={10}
            emoji="🔵"
            color="blue"
            description="For AI quiz analysis"
            dailyAdd="+2/day"
          />
          <CreditTypeCard
            label="Chatbot Credits"
            value={credits.chatbot}
            max={15}
            emoji="🟢"
            color="green"
            description="For disaster Q&A"
            dailyAdd="+3/day"
          />
          <CreditTypeCard
            label="Purchased Credits"
            value={credits.purchased}
            max={null}
            emoji="🟡"
            color="yellow"
            description="Works for both features"
            dailyAdd="No expiry"
          />
        </div>
      </div>

      {/* How Credits Work */}
      <div className="bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-100 p-6 mb-8">
        <h3 className="font-black text-purple-800 text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
          📋 How Credits Work
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/60 rounded-xl p-4">
            <h4 className="font-bold text-gray-800 text-sm mb-2">🎁 Free Daily Credits</h4>
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span> 2 Summary credits added each day</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span> 3 Chatbot credits added each day</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-purple-500 rounded-full"></span> Unused credits roll over (cap: 10 / 15)</li>
            </ul>
          </div>
          <div className="bg-white/60 rounded-xl p-4">
            <h4 className="font-bold text-gray-800 text-sm mb-2">💡 Usage</h4>
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span> Quiz AI Summary = 1 summary credit</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-green-500 rounded-full"></span> Chatbot message = 1 chatbot credit</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-yellow-500 rounded-full"></span> Purchased credits work for both!</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-gray-400 rounded-full"></span> Cached summaries are always free</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Credit Packages */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-black uppercase tracking-widest text-gray-400">🛒 Credit Packs</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CREDIT_PACKAGES.map(pkg => {
            const canAfford = totalXP >= pkg.cost;
            return (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
                  canAfford
                    ? 'border-gray-200 hover:border-purple-300 hover:shadow-lg hover:-translate-y-1'
                    : 'border-gray-100 opacity-50'
                }`}
              >
                <div className="bg-gradient-to-br from-violet-500 to-purple-600 h-20 flex items-center justify-center">
                  <span className="text-4xl filter drop-shadow-md">{pkg.emoji}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-black text-gray-800 text-lg mb-1">{pkg.label}</h3>
                  <p className="text-gray-400 text-xs mb-3">{pkg.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                      +{pkg.credits} credits
                    </span>
                    <span className="text-xs font-bold text-gray-500">{pkg.cost} XP</span>
                  </div>
                  {canAfford ? (
                    <button
                      onClick={() => setConfirmPkg(pkg)}
                      disabled={purchasing === pkg.id}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-50"
                    >
                      {purchasing === pkg.id ? 'Purchasing...' : `Buy · ${pkg.cost} XP`}
                    </button>
                  ) : (
                    <div className="w-full text-center py-3 rounded-xl bg-gray-50 text-gray-400 font-bold text-sm border border-gray-100">
                      🔒 Need {pkg.cost - totalXP} more XP
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Purchase Confirmation Modal */}
      {confirmPkg && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 h-28 flex items-center justify-center">
              <span className="text-6xl filter drop-shadow-lg">{confirmPkg.emoji}</span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-black text-gray-900 text-center mb-1">
                Purchase {confirmPkg.label}?
              </h3>
              <p className="text-gray-400 text-sm text-center mb-6">+{confirmPkg.credits} AI credits</p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current XP</span>
                  <span className="font-bold text-gray-700">{totalXP} XP</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pack Cost</span>
                  <span className="font-bold text-red-500">-{confirmPkg.cost} XP</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                  <span className="font-bold text-gray-700">Remaining</span>
                  <span className="font-black text-purple-600">{totalXP - confirmPkg.cost} XP</span>
                </div>
              </div>

              <button
                onClick={() => onPurchase(confirmPkg)}
                disabled={purchasing === confirmPkg.id}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-black text-base hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {purchasing === confirmPkg.id ? (
                  <>
                    <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Processing...
                  </>
                ) : (
                  <>✅ Confirm Purchase</>
                )}
              </button>
              <button
                onClick={() => setConfirmPkg(null)}
                className="w-full mt-3 py-2 text-gray-400 text-sm font-medium hover:text-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Credit Type Card ──
const CreditTypeCard = ({ label, value, max, emoji, color, description, dailyAdd }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500', border: 'border-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500', border: 'border-green-100' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', bar: 'bg-yellow-500', border: 'border-yellow-100' },
  };
  const c = colorMap[color];
  const percent = max ? Math.min(100, (value / max) * 100) : (value > 0 ? 100 : 0);

  return (
    <div className={`${c.bg} rounded-xl p-4 border ${c.border}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-lg">{emoji}</span>
        <span className={`text-xs font-bold ${c.text} bg-white/80 px-2 py-0.5 rounded-full`}>{dailyAdd}</span>
      </div>
      <span className={`block text-3xl font-black ${c.text}`}>{value}{max ? `/${max}` : ''}</span>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      <p className="text-[10px] text-gray-400 mt-1">{description}</p>
      {max && (
        <div className="w-full bg-white/60 rounded-full h-1.5 mt-3 overflow-hidden">
          <div className={`h-full ${c.bar} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
        </div>
      )}
    </div>
  );
};

export default StudentAI;
