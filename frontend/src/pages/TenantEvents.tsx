import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, MapPin, Users, Clock, CheckCircle2, XCircle, RefreshCcw, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/useEventStore';
import StatusBadge from '@/components/features/StatusBadge';
import SearchInput from '@/components/features/SearchInput';
import EmptyState from '@/components/features/EmptyState';
import WhatsAppShareButton from '@/components/features/WhatsAppShareButton';
import { announcementPayload } from '@/lib/whatsapp';
import type { CommunityEvent } from '@/types';

type Tab = 'events' | 'my-registrations';

function EventCard({
  event,
  onRegister,
  onCancel,
  onViewDetail,
}: {
  event: CommunityEvent;
  onRegister: (id: string) => void;
  onCancel: (id: string) => void;
  onViewDetail: (event: CommunityEvent) => void;
}) {
  const isFull = event.capacity > 0 && (event.registrationCount ?? 0) >= event.capacity;
  const isRegistered = event.isRegistered ?? false;
  const isPast = event.eventDate < new Date().toISOString().slice(0, 10);

  return (
    <div
      className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onViewDetail(event)}
    >
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">{event.title}</h3>
          <StatusBadge status={event.status} size="sm" />
        </div>

        {event.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{event.description}</p>
        )}

        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
            {event.eventDate}
            {event.eventTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{event.eventTime}</span>}
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              {event.location}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            {event.capacity === 0 ? (
              'Unlimited seats'
            ) : (
              <span>
                {event.registrationCount ?? 0}/{event.capacity} registered
                {isFull && <span className="ml-1 text-rose-500 font-medium">· Full</span>}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          {isRegistered ? (
            <>
              <span className="flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Registered
              </span>
              {!isPast && (
                <button
                  onClick={() => onCancel(event.id)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel Registration
                </button>
              )}
            </>
          ) : !isPast && !isFull ? (
            <button
              onClick={() => onRegister(event.id)}
              className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              Register
            </button>
          ) : isFull ? (
            <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 dark:bg-slate-800">Event Full</span>
          ) : (
            <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500 dark:bg-slate-800">Past Event</span>
          )}
          <button
            onClick={() => onViewDetail(event)}
            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            Details <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EventDetailDialog({
  event,
  onClose,
  onRegister,
  onCancel,
}: {
  event: CommunityEvent;
  onClose: () => void;
  onRegister: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const isFull = event.capacity > 0 && (event.registrationCount ?? 0) >= event.capacity;
  const isRegistered = event.isRegistered ?? false;
  const isPast = event.eventDate < new Date().toISOString().slice(0, 10);

  const sharePayload = announcementPayload({
    title: event.title,
    body: [
      event.description ?? '',
      event.location ? `📍 Location: ${event.location}` : '',
      event.organizer ? `👤 Organiser: ${event.organizer}` : '',
    ].filter(Boolean).join('\n'),
    date: event.eventDate,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-slate-900 overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">{event.title}</h2>
              <StatusBadge status={event.status} size="sm" />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{event.eventDate}{event.eventTime && ` at ${event.eventTime}`}</p>
          </div>
          <button onClick={onClose} className="ml-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0">
            <XCircle className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {event.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{event.description}</p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <CalendarDays className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span>{event.eventDate}{event.eventTime && ` at ${event.eventTime}`}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                {event.location}
              </div>
            )}
            {event.organizer && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Users className="h-4 w-4 text-slate-400 flex-shrink-0" />
                Organised by: {event.organizer}
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Users className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span>
                {event.capacity === 0
                  ? `Unlimited capacity · ${event.registrationCount ?? 0} registered`
                  : `${event.registrationCount ?? 0} / ${event.capacity} registered`}
              </span>
            </div>
            {event.registrationRequired && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                Registration is required for this event.
              </div>
            )}
          </div>

          {/* Action area */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {isRegistered ? (
              <>
                <span className="flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> You are registered
                </span>
                {!isPast && (
                  <button
                    onClick={() => { onCancel(event.id); onClose(); }}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel Registration
                  </button>
                )}
              </>
            ) : !isPast && !isFull ? (
              <button
                onClick={() => { onRegister(event.id); onClose(); }}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Register for Event
              </button>
            ) : isFull ? (
              <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-500 dark:bg-slate-800">Event is Full</span>
            ) : null}
            <WhatsAppShareButton payload={sharePayload} size="sm" variant="outline" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TenantEvents() {
  const { tenantEvents, myRegistrations, loading, loadTenantEvents, loadMyRegistrations, registerForEvent, cancelRegistration } = useEventStore();
  const [tab, setTab] = useState<Tab>('events');
  const [search, setSearch] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [detailEvent, setDetailEvent] = useState<CommunityEvent | null>(null);

  const refresh = useCallback(() => {
    const params: Record<string, string | undefined> = {
      search: search || undefined,
      upcoming: upcomingOnly ? '1' : undefined,
    };
    loadTenantEvents(params).catch((e: unknown) => toast.error(e instanceof Error ? e.message : 'Failed to load events'));
  }, [loadTenantEvents, search, upcomingOnly]);

  useEffect(() => {
    if (tab === 'events') refresh();
    if (tab === 'my-registrations') loadMyRegistrations().catch(() => null);
  }, [tab, search, upcomingOnly]); // eslint-disable-line

  const handleRegister = async (id: string) => {
    try {
      await registerForEvent(id);
      toast.success('Registered successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel your registration for this event?')) return;
    try {
      await cancelRegistration(id);
      toast.success('Registration cancelled');
      if (tab === 'my-registrations') loadMyRegistrations().catch(() => null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[Outfit] text-xl font-bold text-slate-900 dark:text-slate-100">Community Events</h1>
          <p className="text-sm text-slate-500">Upcoming events and notice board</p>
        </div>
        <button
          onClick={tab === 'events' ? refresh : () => loadMyRegistrations().catch(() => null)}
          className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-700"
        >
          <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800 w-fit">
        {([['events', 'Events'], ['my-registrations', 'My Registrations']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-all',
              tab === t ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Events tab */}
      {tab === 'events' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex-1 min-w-48">
              <SearchInput value={search} onChange={setSearch} placeholder="Search events…" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                checked={upcomingOnly}
                onChange={(e) => setUpcomingOnly(e.target.checked)}
              />
              Upcoming only
            </label>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" /></div>
          ) : tenantEvents.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No events available" description="Check back soon for upcoming community events." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {tenantEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onRegister={handleRegister}
                  onCancel={handleCancel}
                  onViewDetail={setDetailEvent}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Registrations tab */}
      {tab === 'my-registrations' && (
        <div className="space-y-3">
          {myRegistrations.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No registrations yet" description="Register for upcoming events to see them here." />
          ) : (
            myRegistrations.map((reg) => {
              const isPast = (reg.eventDate ?? '') < today;
              return (
                <div key={reg.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-slate-800 dark:text-slate-200">{reg.eventTitle}</h3>
                        <StatusBadge status={reg.status} size="sm" />
                        {reg.eventStatus && <StatusBadge status={reg.eventStatus} size="sm" />}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                        {reg.eventDate && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {reg.eventDate}
                            {reg.eventTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{reg.eventTime}</span>}
                          </span>
                        )}
                        {reg.location && (
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{reg.location}</span>
                        )}
                      </div>
                    </div>
                    {reg.status === 'Registered' && !isPast && (
                      <button
                        onClick={() => handleCancel(reg.eventId)}
                        className="flex-shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Event detail dialog */}
      {detailEvent && (
        <EventDetailDialog
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onRegister={handleRegister}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
