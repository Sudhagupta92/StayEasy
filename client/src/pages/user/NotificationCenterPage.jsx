import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  CreditCard,
  Star,
  ShieldCheck,
  FileText,
  Filter,
  Inbox,
  ArrowLeft,
} from 'lucide-react';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { notificationService } from '../../services/notificationService';
import { useNotifications } from '../../context/NotificationContext';

export const NotificationCenterPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filterTab, setFilterTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const { fetchUnreadCount } = useNotifications();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ limit: 50 });
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notification center:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    const res = await notificationService.markAsRead(id);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      fetchUnreadCount();
    }
  };

  const handleMarkAllRead = async () => {
    const res = await notificationService.markAllAsRead();
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      fetchUnreadCount();
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    const res = await notificationService.deleteNotification(id);
    if (res.success) {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      fetchUnreadCount();
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      await handleMarkAsRead(n._id);
    }
    if (n.actionUrl) {
      navigate(n.actionUrl);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterTab === 'UNREAD') return !n.isRead;
    if (filterTab === 'BOOKINGS') return n.type?.includes('BOOKING') || n.type?.includes('CHECKIN');
    if (filterTab === 'PAYMENTS') return n.type?.includes('ESCROW') || n.type?.includes('PAYMENT') || n.type?.includes('INVOICE');
    if (filterTab === 'REVIEWS') return n.type?.includes('REVIEW');
    return true;
  });

  const getNotificationIcon = (type) => {
    if (type?.includes('BOOKING')) return <Calendar className="w-5 h-5 text-blue-600" />;
    if (type?.includes('ESCROW') || type?.includes('PAYMENT') || type?.includes('INVOICE'))
      return <CreditCard className="w-5 h-5 text-emerald-600" />;
    if (type?.includes('REVIEW')) return <Star className="w-5 h-5 text-amber-600" />;
    if (type?.includes('PROPERTY') || type?.includes('VERIFICATION'))
      return <ShieldCheck className="w-5 h-5 text-indigo-600" />;
    return <FileText className="w-5 h-5 text-slate-600" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <Container className="max-w-4xl">
        {/* Header Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Bell className="w-6 h-6 text-brand-600" /> Notification Center
              </h1>
              <p className="text-xs text-slate-500">
                Track real-time alerts for bookings, rent ledgers, escrow settlements & reviews.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="hidden sm:flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" /> Mark All as Read
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Updates' },
            { id: 'UNREAD', label: 'Unread Only' },
            { id: 'BOOKINGS', label: 'Bookings & Stay' },
            { id: 'PAYMENTS', label: 'Rent & Escrow' },
            { id: 'REVIEWS', label: 'Resident Reviews' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterTab === tab.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification Cards */}
        {loading ? (
          <Card className="p-12 text-center text-slate-400">Loading notification center...</Card>
        ) : filteredNotifications.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Notifications Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              You are all caught up! New updates on your reservations, invoices, and resident feedback will appear here.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((n) => (
              <Card
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 sm:p-5 transition-all cursor-pointer hover:shadow-md hover:border-slate-300 relative ${
                  !n.isRead ? 'border-l-4 border-l-brand-500 bg-brand-50/20' : 'bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-900">{n.title}</h3>
                        {!n.isRead && (
                          <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(n.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{n.message}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!n.isRead && (
                      <button
                        onClick={(e) => handleNotificationClick(n)}
                        title="Mark as read"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDelete(n._id, e)}
                      title="Delete notification"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
};

export default NotificationCenterPage;
