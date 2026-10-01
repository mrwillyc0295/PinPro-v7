import {
  Outlet,
  NavLink,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Compass,
  Plus,
  MessageSquare,
  User,
  Wallet,
  ClipboardList,
  Settings,
  Users,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "motion/react";
import { memo, useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  handleFirestoreError,
  OperationType,
} from "../lib/firestoreErrorHandler";
import { useTranslation } from "react-i18next";
import { RoleModeBadge } from "./RoleModeBadge";
import { PinProTour } from "./PinProTour";

const NavItem = memo(
  ({
    to,
    icon: Icon,
    label,
    badge,
    isSpecial,
  }: {
    to: string;
    icon: any;
    label: string;
    badge?: number;
    isSpecial?: boolean;
  }) => {
    if (isSpecial) {
      return (
        <NavLink
          to={to}
          className="flex flex-col items-center justify-center relative -top-8 z-50"
        >
          {({ isActive }) => (
            <div className="flex flex-col items-center gap-1 group">
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border-4 border-surface-lowest transition-all duration-500",
                  isActive
                    ? "bg-[#39FF14] text-black shadow-[0_0_30px_rgba(57,255,20,0.4)] scale-105"
                    : "bg-primary-container text-surface-lowest hover:scale-105",
                )}
              >
                <Icon className="w-8 h-8" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-black tracking-widest uppercase transition-colors px-2 py-0.5 rounded-md",
                  isActive
                    ? "text-[#39FF14]"
                    : "text-on-surface-variant group-hover:text-primary-container",
                )}
              >
                {label}
              </span>
            </div>
          )}
        </NavLink>
      );
    }

    return (
      <NavLink
        to={to}
        className="flex flex-1 flex-col items-center justify-center relative px-1"
      >
        {({ isActive }) => (
          <div
            className={cn(
              "flex flex-col items-center gap-1 group py-1 transition-all duration-300 w-full",
              isActive
                ? "text-primary-container"
                : "text-on-surface-variant hover:text-primary-container",
            )}
          >
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -top-[1px] w-8 h-1 rounded-full bg-primary-container shadow-[0_0_15px_rgba(0,255,255,0.4)]"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
            <div className="relative p-1.5 rounded-xl transition-all duration-300">
              <Icon
                className={cn(
                  "w-7 h-7 transition-all duration-300",
                  isActive ? "scale-105" : "group-hover:scale-105",
                )}
              />
              {badge !== undefined && badge > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#39FF14] px-1 text-[10px] font-black text-black shadow-lg ring-2 ring-surface-lowest">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </div>
            <p
              className={cn(
                "text-[10px] whitespace-nowrap transition-all duration-300",
                isActive
                  ? "font-bold tracking-wider uppercase"
                  : "font-medium opacity-80",
              )}
            >
              {label}
            </p>
          </div>
        )}
      </NavLink>
    );
  },
);

export default function Layout() {
  const { profile, user, isAdmin } = useAuth();
  const location = useLocation();
  const isPro = profile?.role === "Profesional";
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    if (!user || !profile || (profile as any).isNewUser) {
      setUnreadCount(0);
      setUnreadNotifCount(0);
      return;
    }

    let unsubscribeMessages = () => {};
    let unsubscribeNotifs = () => {};

    try {
      // Messages listener
      const qMessages = query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid),
      );

      unsubscribeMessages = onSnapshot(
        qMessages,
        (snapshot) => {
          let totalUnread = 0;
          snapshot.docs.forEach((doc) => {
            const data = doc.data();
            totalUnread += data.unreadCount?.[user.uid] || 0;
          });
          setUnreadCount(totalUnread);
        },
        (error) => {
          console.warn(
            "[Layout] Chat listener permission denied:",
            error.message,
          );
        },
      );

      // Notifications listener
      const qNotifs = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        where("read", "==", false),
      );

      unsubscribeNotifs = onSnapshot(
        qNotifs,
        (snapshot) => {
          setUnreadNotifCount(snapshot.size);
        },
        (error) => {
          console.warn(
            "[Layout] Notif listener permission denied:",
            error.message,
          );
        },
      );
    } catch (err) {
      console.error("[Layout] Error setting up listeners:", err);
    }

    return () => {
      unsubscribeMessages();
      unsubscribeNotifs();
    };
  }, [user, profile]);

  const isTargetingAdminRoute = location.pathname.startsWith("/admin");
  const isEditProfile =
    location.pathname === "/edit-profile" ||
    location.pathname.endsWith("/edit-profile");
  const isSplash =
    location.pathname === "/" ||
    location.pathname === "/inicio-registro" ||
    location.pathname === "/welcome";
  const isRegister =
    location.pathname === "/register" ||
    location.pathname === "/complete-profile" ||
    location.pathname === "/welcome";
  const isNewProfile =
    (profile as any)?.isNewUser || (profile as any)?.bypassActive;
  const isHiddenRoute =
    isTargetingAdminRoute ||
    isEditProfile ||
    isSplash ||
    isRegister ||
    isNewProfile;

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-surface-lowest">
      {!isHiddenRoute && (
        <>
          <RoleModeBadge />
          <PinProTour />
        </>
      )}
      <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden hide-scrollbar relative">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      {!isHiddenRoute && (
        <nav className="flex border-t border-primary-container/20 bg-surface-lowest/95 backdrop-blur-md px-4 sm:px-6 z-30 justify-between items-center relative shadow-[0_-5px_20px_rgba(0,255,255,0.15)] shrink-0 h-[60px] pb-[5px]">
          {!user ? (
            <>
              <NavItem to="/" icon={Compass} label={t("nav.explore")} />
              <NavItem
                to="/inicio-registro"
                icon={Plus}
                label="SOLICITAR"
                isSpecial={true}
              />
              <NavItem to="/inicio-registro" icon={User} label="Entrar" />
            </>
          ) : isAdmin ? (
            <>
              <NavItem to="/mapa" icon={Compass} label={t("nav.explore")} />
              <NavItem
                to="/admin"
                icon={ShieldCheck}
                label="CEO MASTER"
                isSpecial={true}
              />
              <NavItem
                to="/messages"
                icon={MessageSquare}
                label={t("nav.messages")}
                badge={unreadCount}
              />
              <NavItem
                to="/profile"
                icon={User}
                label={t("nav.profile")}
                badge={unreadNotifCount}
              />
            </>
          ) : !isPro ? (
            <>
              <NavItem to="/mapa" icon={Compass} label={t("nav.explore")} />
              <NavItem
                to="/client-reservations"
                icon={ClipboardList}
                label="Mis Reservas"
              />
              <NavItem
                to="/new-request"
                icon={Plus}
                label="SOLICITAR"
                isSpecial={true}
              />
              <NavItem
                to="/messages"
                icon={MessageSquare}
                label={t("nav.messages")}
                badge={unreadCount}
              />
              <NavItem
                to="/profile"
                icon={User}
                label={t("nav.profile")}
                badge={unreadNotifCount}
              />
            </>
          ) : (
            <>
              <NavItem to="/mapa" icon={Compass} label={t("nav.explore")} />
              <NavItem to="/users" icon={Users} label="Usuarios" />
              <NavItem
                to="/activity"
                icon={ClipboardList}
                label={t("nav.jobs")}
              />
              <NavItem
                to="/messages"
                icon={MessageSquare}
                label={t("nav.messages")}
                badge={unreadCount}
              />
              <NavItem
                to="/pro/dashboard"
                icon={LayoutDashboard}
                label="Panel"
              />
            </>
          )}
        </nav>
      )}
    </div>
  );
}
