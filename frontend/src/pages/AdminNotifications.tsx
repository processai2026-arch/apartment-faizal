import NotificationCenter from '@/components/features/NotificationCenter';

export default function AdminNotifications() {
  return (
    <NotificationCenter
      role="admin"
      title="Notification Center"
      description="Track announcements, visitor events, complaints, finance updates, and high-priority system alerts."
      allowCreate
      allowDelete
    />
  );
}
