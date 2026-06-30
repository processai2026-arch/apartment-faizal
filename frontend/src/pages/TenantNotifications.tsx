import NotificationCenter from '@/components/features/NotificationCenter';

export default function TenantNotifications() {
  return (
    <NotificationCenter
      role="tenant"
      title="My Notifications"
      description="Keep up with visitor updates, invoices, complaint progress, and building announcements."
    />
  );
}
