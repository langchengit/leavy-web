import { Coffee, Map } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { TripDetail } from '../components/TripDetail';
import { Card, SectionHeader } from '../components/ui';
import { NextDeparture, ScheduleChart, TripListRow, UpcomingBanners } from '../components/upcoming';
import { useCompact, useNow, useTitle, useWide } from '../hooks';
import { formatDay, formatTime } from '../lib/format';
import { useSettings } from '../lib/settings';
import { useTrips } from '../lib/trips';
import type { Trip } from '../types';

/**
 * Laptops get the list and schedule on the left and the selected trip's details on the right
 * (`?trip=` in the URL). Smaller screens get one column; a trip opens on its own page.
 */
export function UpcomingPage() {
  const wide = useWide();
  const compact = useCompact();
  const now = useNow();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { settings } = useSettings();
  const { loading, trips, noLocation, updatedAt } = useTrips();

  const [next, ...later] = trips;
  const selected = trips.find((x) => x.event.key === params.get('trip')) ?? next;
  useTitle(wide && selected ? `${selected.event.title} · Upcoming` : 'Upcoming');

  const open = (trip: Trip) => {
    if (wide) setParams({ trip: trip.event.key });
    else navigate(`/trip/${encodeURIComponent(trip.event.key)}`);
  };

  const list = (
    <div className="upcoming">
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div className="stack g-xs grow">
          <p className="t-overline muted">{formatDay(new Date(now))}</p>
          <h1 className="t-title">When to leave</h1>
          {updatedAt ? <p className="muted">Updated {formatTime(updatedAt)}</p> : null}
        </div>
      </header>

      <UpcomingBanners />

      {loading ? (
        <LoadingCard />
      ) : next ? (
        <NextDeparture trip={next} now={now} onDetails={() => open(next)} />
      ) : (
        <Card className="empty-state">
          <Coffee size={40} aria-hidden />
          <h2 className="t-heading" style={{ color: 'var(--text)' }}>
            Nowhere to be
          </h2>
          <p>No events with a location in the next {settings.lookAheadHours} hours.</p>
        </Card>
      )}

      {!loading && !compact && trips.length > 1 ? (
        <ScheduleChart trips={trips} now={now} selected={wide ? selected?.event.key : undefined} onSelect={open} />
      ) : null}

      {later.length > 0 ? (
        <section>
          <SectionHeader title="Later" aside={`${later.length} trip${later.length === 1 ? '' : 's'}`} />
          <div className="stack g-sm">
            {later.map((trip) => (
              <TripListRow key={trip.event.key} trip={trip} now={now} selected={wide && selected?.event.key === trip.event.key} onClick={() => open(trip)} />
            ))}
          </div>
        </section>
      ) : null}

      {noLocation.length > 0 ? (
        <section>
          <SectionHeader title="No location set" />
          <Card className="stack g-md">
            {noLocation.map((e) => (
              <div key={e.key} className="row g-md">
                <p className="t-strong grow ellipsis">{e.title}</p>
                <p className="t-caption muted tabular">{formatTime(e.start)}</p>
              </div>
            ))}
            <p className="t-caption muted">Add a location in your calendar to get a leave time.</p>
          </Card>
        </section>
      ) : null}
    </div>
  );

  if (!wide) return <div className="page">{list}</div>;

  return (
    <div className="split">
      <div className="list-pane page">{list}</div>
      <aside className="detail-pane" aria-label="Trip details">
        {selected ? (
          <>
            <div className="stack g-xs" style={{ marginBottom: 16 }}>
              <p className="t-overline muted">{selected === next ? 'Next trip' : 'Trip'}</p>
              <h2 className="t-title" style={{ fontSize: 24, lineHeight: '30px' }}>
                {selected.event.title}
              </h2>
              <p className="t-caption muted">
                {formatDay(selected.event.start)} · {formatTime(selected.event.start)}–{formatTime(selected.event.end)}
                {selected.event.calendarTitle ? ` · ${selected.event.calendarTitle}` : ''}
              </p>
            </div>
            <TripDetail trip={selected} now={now} />
          </>
        ) : (
          <div className="empty-state" style={{ height: '100%', justifyContent: 'center' }}>
            <Map size={36} color="var(--muted)" aria-hidden />
            <p>{loading ? 'Loading your trips…' : 'Trips show up here when an event has a location.'}</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function LoadingCard() {
  const block = (width: number | string, height: number) => <div className="skeleton" style={{ width, height }} />;
  return (
    <Card className="panel">
      <div className="stack g-md" role="progressbar" aria-label="Loading your next trip">
        {block(110, 24)}
        {block('40%', 52)}
        {block('70%', 18)}
        {block('50%', 18)}
      </div>
    </Card>
  );
}
