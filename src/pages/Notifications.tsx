import { ArrowLeft, Bell, CheckCircle2, Clock, Star, AlertCircle, MessageSquare, Shield, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService, Notification } from '../services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = notificationService.subscribeToUserNotifications(user.uid, (data) => {
      setNotifications(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.uid);
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (notif.id) {
      await notificationService.markAsRead(notif.id);
    }

    // Navigate based on type
    if (notif.type.startsWith('booking_')) {
      navigate('/activity');
    } else if (notif.type === 'message_new') {
      if (notif.relatedId) {
        navigate(`/messages/${notif.relatedId}`);
      } else {
        navigate('/messages');
      }
    }
  };

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case 'booking_new':
        return { icon: Bell, color: 'text-primary-container', bgColor: 'bg-primary-container/10', borderColor: 'border-primary-container/30' };
      case 'booking_accepted':
        return { icon: CheckCircle2, color: 'text-green-400', bgColor: 'bg-green-400/10', borderColor: 'border-green-400/30' };
      case 'booking_started':
        return { icon: Clock, color: 'text-blue-400', bgColor: 'bg-blue-400/10', borderColor: 'border-blue-400/30' };
      case 'booking_completed':
        return { icon: Star, color: 'text-amber-400', bgColor: 'bg-amber-400/10', borderColor: 'border-amber-400/30' };
      case 'booking_cancelled':
        return { icon: AlertCircle, color: 'text-red-400', bgColor: 'bg-red-400/10', borderColor: 'border-red-400/30' };
      case 'message_new':
        return { icon: MessageSquare, color: 'text-purple-400', bgColor: 'bg-purple-400/10', borderColor: 'border-purple-400/30' };
      default:
        return { icon: Shield, color: 'text-on-surface-variant', bgColor: 'bg-surface-highest', borderColor: 'border-outline-variant' };
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex-1 w-full h-full bg-surface-lowest overflow-y-auto hide-scrollbar flex flex-col pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface-lowest/90 backdrop-blur-xl border-b border-primary-container/20 shadow-[0_4px_20px_-10px_rgba(0,255,255,0.3)] px-5 py-4 pt-12 flex items-center justify-end">
        <h1 className="text-lg font-black text-on-surface tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] uppercase italic">Notificaciones</h1>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-4">
        <div className="flex justify-between items-end mb-2">
          <h2 className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em]">Recientes</h2>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] text-primary-container font-bold uppercase hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] transition-all"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-24 bg-surface-container/40 rounded-2xl animate-pulse border border-outline-variant/30"></div>
            ))
          ) : notifications.length > 0 ? (
            notifications.map((notif) => {
              const config = getNotificationConfig(notif.type);
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "relative p-4 rounded-2xl border transition-all duration-300 flex gap-4 cursor-pointer group",
                    notif.read
                      ? "bg-surface border-outline-variant opacity-70"
                      : "bg-surface-container/80 backdrop-blur-md border-primary-container/50 shadow-[0_5px_20px_-5px_rgba(0,255,255,0.15)] hover:shadow-[0_5px_25px_-5px_rgba(0,255,255,0.3)]"
                  )}
                >
                  {!notif.read && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-primary-container rounded-full shadow-[0_0_8px_#00FFFF]"></div>
                  )}

                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110", config.bgColor, config.color, config.borderColor)}>
                    <config.icon className="w-6 h-6 drop-shadow-[0_0_5px_currentColor]" />
                  </div>

                  <div className="flex flex-col flex-1">
                    <h3 className={cn("text-lg font-bold mb-1", notif.read ? "text-on-surface-variant" : "text-on-surface")}>
                      {notif.title}
                    </h3>
                    <p className="text-xl text-on-surface-variant leading-relaxed mb-2">
                      {notif.message}
                    </p>
                    <span className="text-[10px] font-bold text-primary-container/70 uppercase tracking-wider">
                      {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true, locale: es }) : 'Ahora'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-surface-container/20 rounded-3xl border border-dashed border-outline-variant/30">
              <div className="w-16 h-16 rounded-full bg-surface-container/50 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-on-surface-variant/30" />
              </div>
              <p className="text-on-surface-variant text-sm font-medium">No tienes notificaciones</p>
              <p className="text-[10px] text-on-surface-variant/60 mt-1">Te avisaremos cuando pase algo importante</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
