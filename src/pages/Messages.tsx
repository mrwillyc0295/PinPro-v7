import { Search, MoreVertical, Edit, MessageSquare, Plus, X, User as UserIcon, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, getDocs, addDoc, serverTimestamp, or, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function Messages() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchChats = () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData = snapshot.docs.map(doc => {
        const data = doc.data();
        const otherParticipantId = data.participants.find((p: string) => p !== user.uid);
        const otherParticipantName = data.participantNames?.[otherParticipantId] || 'Usuario';

        return {
          id: doc.id,
          name: otherParticipantName,
          lastMessage: data.lastMessage || 'Sin mensajes aún',
          time: data.updatedAt ? new Date(data.updatedAt.toMillis()).toLocaleDateString() : '',
          updatedAt: data.updatedAt?.toMillis() || 0,
          unread: data.unreadCount?.[user.uid] || 0,
          online: false // Placeholder for online status
        };
      });

      // Sort by updatedAt descending
      chatData.sort((a, b) => b.updatedAt - a.updatedAt);

      setChats(chatData);
      setLoading(false);
    }, (err) => {
      setLoading(false);
      setError("No se pudieron cargar las conversaciones. Por favor, intenta de nuevo.");
      try {
        handleFirestoreError(err, OperationType.LIST, 'chats');
      } catch (e) {
        // Error is thrown as required, but we also handled it in state
        console.error("Firestore error handled in Messages:", e);
      }
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = fetchChats();
    return () => unsubscribe?.();
  }, [user]);

  const fetchAllUsers = async () => {
    if (!user) return;
    setLoadingUsers(true);
    setError(null);
    try {
      const professionalsSnap = await getDocs(collection(db, 'profesionales'));
      const pros = professionalsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'Profesional' }));

      let clients: any[] = [];
      try {
        if (profile?.role === 'Admin') {
          const clientesSnap = await getDocs(collection(db, 'clientes'));
          clients = clientesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'Cliente' }));
        }
      } catch (e) {
        console.log("Could not fetch list of clients (likely not admin)");
      }

      const combined = [...pros, ...clients].filter(u => u.id !== user.uid);
      setAllUsers(combined);
    } catch (err) {
      setError("No se pudieron cargar los usuarios para iniciar un nuevo chat.");
      try {
        handleFirestoreError(err, OperationType.LIST, 'users');
      } catch(e) {}
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleStartChat = async (otherUser: any) => {
    if (!user) return;
    setError(null);

    try {
      // Check if chat already exists
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', user.uid)
      );

      const snapshot = await getDocs(q);
      const existingChat = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(otherUser.id);
      });

      if (existingChat) {
        navigate(`/messages/${existingChat.id}`);
        return;
      }

      // Create new chat
      const newChatRef = await addDoc(collection(db, 'chats'), {
        participants: [user.uid, otherUser.id],
        participantNames: {
          [user.uid]: profile?.name || 'Usuario',
          [otherUser.id]: otherUser.name || 'Usuario'
        },
        lastMessage: '',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        unreadCount: {
          [user.uid]: 0,
          [otherUser.id]: 0
        }
      });

      navigate(`/messages/${newChatRef.id}`);
    } catch (err) {
      setError("No se pudo iniciar la conversación. Por favor, intenta de nuevo.");
      handleFirestoreError(err, OperationType.CREATE, 'chats');
    }
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta conversación permanentemente?')) return;

    try {
      await deleteDoc(doc(db, 'chats', chatId));
      // Optionally delete associated messages
      const q = query(collection(db, 'messages'), where('chatId', '==', chatId));
      const messageDocs = await getDocs(q);
      const deletePromises = messageDocs.docs.map(mDoc => deleteDoc(mDoc.ref));
      await Promise.all(deletePromises);
    } catch (err) {
      console.error("Error deleting chat:", err);
      setError("No se pudo eliminar la conversación.");
      handleFirestoreError(err, OperationType.DELETE, `chats/${chatId}`);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-surface-lowest text-on-surface w-full max-w-[800px] mx-auto">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 sticky top-0 z-10 bg-surface-lowest/80 backdrop-blur-xl border-b border-surface-highest">
        <div className="flex items-center justify-end mb-6 relative">
          <button
            onClick={() => {
              setIsNewChatModalOpen(true);
              fetchAllUsers();
            }}
            className="absolute left-0 w-11 h-11 rounded-xl bg-primary-container text-surface-lowest flex items-center justify-center shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:scale-110 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black text-on-surface uppercase tracking-tighter italic drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Mensajes</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar mensajes..."
            className="w-full bg-surface-container text-on-surface placeholder:text-on-surface-variant rounded-2xl py-3 px-5 focus:outline-none focus:ring-1 focus:ring-primary-container transition-shadow"
          />
        </div>
      </header>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="m-4 p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-3 text-error">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div className="flex-1 text-sm font-medium">{error}</div>
            <button
              onClick={() => fetchChats()}
              className="p-2 hover:bg-error/10 rounded-full transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center text-on-surface-variant py-10 animate-pulse">Cargando mensajes...</div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-20 text-center px-10">
            <div className="w-24 h-24 rounded-full bg-surface-container/50 flex items-center justify-center border border-dashed border-primary-container/30 relative">
              <MessageSquare className="w-10 h-10 text-primary-container/40" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-container rounded-full shadow-[0_0_10px_#00FFFF] animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-on-surface font-black text-xl tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Silencio en el canal</h3>
              <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
                Tus conversaciones con clientes y profesionales aparecerán aquí. ¡Inicia una charla para empezar!
              </p>
            </div>
            {profile?.role === 'Cliente' && (
              <button
                onClick={() => navigate('/home')}
                className="bg-primary-container/10 text-primary-container border border-primary-container/50 font-bold px-6 py-3 rounded-full hover:bg-primary-container hover:text-surface-lowest transition-all shadow-[0_0_15px_rgba(0,255,255,0.2)] uppercase text-xs tracking-widest"
              >
                Explorar Profesionales
              </button>
            )}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => navigate(`/messages/${chat.id}`)}
              className="flex items-center gap-4 p-4 mx-2 my-1 rounded-2xl hover:bg-surface-container transition-colors cursor-pointer"
            >
              {/* Avatar Placeholder */}
              <div className="relative shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-primary-container/40 to-primary-container/10 flex items-center justify-center text-primary-container font-black text-2xl border border-primary-container/50 shadow-[0_0_15px_rgba(0,255,255,0.4)] ring-2 ring-primary-container/30">
                <span className="drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]">{chat.name.charAt(0).toUpperCase()}</span>
                {chat.online && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00FF00] rounded-full border-2 border-surface-lowest shadow-[0_0_8px_#00FF00]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display font-semibold text-on-surface truncate">
                    {chat.name}
                  </h3>
                  <span className="text-xs text-on-surface-variant shrink-0 ml-2">
                    {chat.time}
                  </span>
                </div>
                <p className="text-xl text-on-surface-variant truncate font-medium">
                  {chat.lastMessage}
                </p>
              </div>

              {/* Unread Badge and Actions */}
              <div className="flex flex-col items-end gap-2">
                {chat.unread > 0 && (
                  <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-xs font-bold">
                    {chat.unread}
                  </div>
                )}
                <button
                  onClick={(e) => deleteChat(chat.id, e)}
                  className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-all"
                  title="Eliminar conversación"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-surface-lowest animate-in slide-in-from-bottom-10 duration-300">
          <header className="px-6 pt-12 pb-4 border-b border-surface-highest flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container/10 flex items-center justify-center border border-primary-container/30">
                <Plus className="w-5 h-5 text-primary-container" />
              </div>
              <h2 className="text-lg font-black text-on-surface uppercase tracking-tight">Nuevo Mensaje</h2>
            </div>
            <button
              onClick={() => setIsNewChatModalOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-highest text-on-surface-variant transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </header>

          <div className="p-6">
            <div className="relative">
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o profesión..."
                className="w-full bg-surface-container text-on-surface placeholder:text-on-surface-variant rounded-2xl py-3 px-5 focus:outline-none focus:ring-1 focus:ring-primary-container transition-shadow"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2">
            {loadingUsers ? (
              <div className="text-center text-on-surface-variant py-10 animate-pulse">Buscando perfiles...</div>
            ) : allUsers.filter(u =>
                u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                u.profession?.toLowerCase().includes(userSearchTerm.toLowerCase())
              ).length === 0 ? (
              <div className="text-center text-on-surface-variant py-10">No se encontraron perfiles.</div>
            ) : (
              allUsers.filter(u =>
                u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                u.profession?.toLowerCase().includes(userSearchTerm.toLowerCase())
              ).map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleStartChat(u)}
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-container/40 to-primary-container/10 flex items-center justify-center text-primary-container font-black text-xl border border-primary-container/50">
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-on-surface truncate">{u.name}</h3>
                    <p className="text-xs text-primary-container font-medium">{u.profession || u.role}</p>
                  </div>
                  <Plus className="w-5 h-5 text-on-surface-variant" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
