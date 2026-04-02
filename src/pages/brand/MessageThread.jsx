import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getConversationById, conversations, timeAgo } from '../../data';

export default function BrandMessageThread() {
  const { id } = useParams();
  const conv = getConversationById(id) || conversations[0];
  const [msgs, setMsgs] = useState(conv.messages);
  const [input, setInput] = useState('');
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = () => {
    if (!input.trim()) return;
    setMsgs(m => [...m, { id: `m${Date.now()}`, from: 'brand', text: input, time: new Date().toISOString() }]);
    setInput('');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-10rem)] max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <Link to="/brand/messages" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-all"><ArrowLeft size={18} /></Link>
          <img src={conv.creatorAvatar} alt="" className="w-10 h-10 rounded-xl object-cover" />
          <div className="flex-1">
            <p className="font-heading font-semibold text-gray-900 dark:text-white">{conv.creatorName}</p>
            <p className="text-xs text-gray-500">Creator · @{conv.creatorName.toLowerCase().replace(' ', '')}</p>
          </div>
          <button onClick={() => toast.success('Opening hire flow...')} className="btn btn-brand btn-sm"><Zap size={13} />Hire</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pb-2 scrollbar-hide">
          {msgs.map(msg => (
            <div key={msg.id} className={`flex ${msg.from === 'brand' ? 'justify-end' : 'justify-start'}`}>
              {msg.from !== 'brand' && <img src={conv.creatorAvatar} alt="" className="w-8 h-8 rounded-full object-cover mr-2 flex-shrink-0 self-end" />}
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl text-sm ${msg.from === 'brand' ? 'bg-gradient-brand text-white rounded-br-md' : 'bg-white dark:bg-[#111118] border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md'}`}>
                <p className="leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1.5 ${msg.from === 'brand' ? 'text-white/60' : 'text-gray-400'}`}>{timeAgo(msg.time)}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-end gap-2">
            <button className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex-shrink-0"><Paperclip size={18} /></button>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={`Message ${conv.creatorName}...`} rows={1} className="input resize-none flex-1" style={{ minHeight: '44px' }} />
            <button onClick={send} disabled={!input.trim()} className="p-2.5 rounded-xl bg-brand text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"><Send size={18} /></button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
