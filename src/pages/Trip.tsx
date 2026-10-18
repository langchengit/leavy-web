import { ArrowLeft } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';

import { TripDetail, TripMissing } from '../components/TripDetail';
import { useNow, useTitle, useWide } from '../hooks';
import { formatDay, formatTime } from '../lib/format';
import { useTrips } from '../lib/trips';

/** A trip on its own page for tablets and phones. Laptops show trips beside the list on Upcoming. */
export function TripPage() {
  const wide = useWide();
  const now = useNow();
  const { id = '' } = useParams();
  const { trips, refreshing } = useTrips();
  const trip = trips.find((x) => x.event.key === id);
  useTitle(trip?.event.title ?? 'Trip');

  if (wide) return <Navigate to={`/?trip=${encodeURIComponent(id)}`} replace />;

  return (
    <div className="page">
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Link to="/" className="link-btn row g-xs" style={{ display: 'inline-flex', textDecoration: 'none', marginBottom: 12 }}>
          <ArrowLeft size={18} aria-hidden />
          Upcoming
        </Link>
        {trip ? (
          <>
            <header className="page-header">
              <div className="stack g-xs">
                <h1 className="t-title">{trip.event.title}</h1>
                <p className="muted">
                  {formatDay(trip.event.start)} · {formatTime(trip.event.start)}–{formatTime(trip.event.end)}
                </p>
              </div>
            </header>
            <TripDetail trip={trip} now={now} />
          </>
        ) : (
          <TripMissing refreshing={refreshing} />
        )}
      </div>
    </div>
  );
}
