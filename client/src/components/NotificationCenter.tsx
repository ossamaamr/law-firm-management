import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  X,
  Check,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
} from "lucide-react";

/**
 * Notification Center Component - مركز الإشعارات
 * Handles 24-hour court session reminders and other notifications
 */

export interface Notification {
  id: string;
  type: "court_session" | "deadline" | "approval" | "alert" | "info";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  relatedId?: string;
}

interface NotificationCenterProps {
  notifications?: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onDismiss?: (notificationId: string) => void;
}

export function NotificationCenter({
  notifications = [],
  onMarkAsRead,
  onDismiss,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "court_session":
        return <Calendar className="w-4 h-4" />;
      case "deadline":
        return <Clock className="w-4 h-4" />;
      case "approval":
        return <CheckCircle className="w-4 h-4" />;
      case "alert":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "court_session":
        return "bg-blue-100 text-blue-800";
      case "deadline":
        return "bg-yellow-100 text-yellow-800";
      case "approval":
        return "bg-green-100 text-green-800";
      case "alert":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      court_session: "جلسة قضائية",
      deadline: "موعد نهائي",
      approval: "موافقة",
      alert: "تنبيه",
      info: "معلومة",
    };
    return labels[type] || type;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "للتو";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return date.toLocaleDateString("ar-SA");
  };

  const sortedNotifications = [...notifications].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-lg">الإشعارات</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {sortedNotifications.length > 0 ? (
              sortedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 transition ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${getNotificationColor(
                        notification.type
                      )}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDismiss?.(notification.id)}
                          className="h-6 w-6 p-0 flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(notification.type)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onMarkAsRead?.(notification.id)}
                            className="h-6 px-2"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            قراءة
                          </Button>
                        )}
                      </div>

                      {notification.actionUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full text-xs"
                          onClick={() => {
                            // Navigate to action URL
                            window.location.href = notification.actionUrl!;
                          }}
                        >
                          {notification.actionLabel || "عرض التفاصيل"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">لا توجد إشعارات</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {sortedNotifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50 text-center">
              <Button variant="ghost" size="sm" className="text-xs">
                عرض جميع الإشعارات
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Court Session Reminder Service
 * يخدم تذكيرات الجلسات القضائية قبل 24 ساعة
 */

export class CourtSessionReminderService {
  private reminders: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Schedule a 24-hour reminder for a court session
   */
  scheduleReminder(
    sessionId: string,
    sessionDate: Date,
    onReminder: (notification: Notification) => void
  ) {
    // Cancel existing reminder if any
    if (this.reminders.has(sessionId)) {
      clearTimeout(this.reminders.get(sessionId));
    }

    // Calculate time until 24 hours before session
    const now = new Date();
    const reminderTime = new Date(sessionDate.getTime() - 24 * 60 * 60 * 1000);
    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    if (timeUntilReminder > 0) {
      const timeout = setTimeout(() => {
        onReminder({
          id: `reminder-${sessionId}`,
          type: "court_session",
          title: "تذكير: جلسة قضائية غداً",
          message: `لديك جلسة قضائية مقررة غداً الساعة ${sessionDate.toLocaleTimeString(
            "ar-SA"
          )}`,
          timestamp: new Date(),
          read: false,
          actionLabel: "عرض التفاصيل",
        });

        this.reminders.delete(sessionId);
      }, timeUntilReminder);

      this.reminders.set(sessionId, timeout);
    }
  }

  /**
   * Cancel a scheduled reminder
   */
  cancelReminder(sessionId: string) {
    if (this.reminders.has(sessionId)) {
      clearTimeout(this.reminders.get(sessionId));
      this.reminders.delete(sessionId);
    }
  }

  /**
   * Cancel all reminders
   */
  cancelAllReminders() {
    this.reminders.forEach((timeout) => clearTimeout(timeout));
    this.reminders.clear();
  }
}

/**
 * Notification Hook
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: `notif-${Date.now()}`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
      return newNotification.id;
    },
    []
  );

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);

  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    markAsRead,
    dismissNotification,
    clearAll,
  };
}
