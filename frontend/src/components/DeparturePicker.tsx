import { useMemo, useState } from 'react';
import { IconButton, Popover } from '@mui/material';
import {
  AccessTime,
  CalendarMonth,
  ChevronLeft,
  ChevronRight,
  ExpandMore,
  Add,
  Remove,
} from '@mui/icons-material';

interface Props {
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const TIME_PRESETS = ['06:00', '07:00', '08:00', '09:00', '12:00', '14:00', '18:00', '20:00'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function toInputDate(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function todayInputDate() {
  return toInputDate(new Date());
}

function formatDateLabel(value: string) {
  if (!value) return 'Seleccionar fecha';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTimeLabel(value: string) {
  return value || 'Seleccionar hora';
}

function normalizeTimeEntry(value: string) {
  const clean = value.replace(/[^\d:]/g, '');

  if (/^\d{1,2}:\d{1,2}$/.test(clean)) {
    const [rawHour, rawMinute] = clean.split(':').map(Number);
    if (rawHour <= 23 && rawMinute <= 59) {
      return `${String(rawHour).padStart(2, '0')}:${String(rawMinute).padStart(2, '0')}`;
    }
  }

  const digits = clean.replace(/\D/g, '');
  if (digits.length === 1 || digits.length === 2) {
    const hour = Number(digits);
    if (hour <= 23) return `${String(hour).padStart(2, '0')}:00`;
  }

  if (digits.length === 3 || digits.length === 4) {
    const padded = digits.padStart(4, '0');
    const hour = Number(padded.slice(0, 2));
    const minute = Number(padded.slice(2, 4));
    if (hour <= 23 && minute <= 59) return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
  }

  return null;
}

function getTimeParts(value: string) {
  const normalized = normalizeTimeEntry(value);
  if (!normalized) return { hour: '', minute: '' };
  const [hour, minute] = normalized.split(':');
  return { hour, minute };
}

function clampPart(value: number, max: number) {
  if (Number.isNaN(value)) return '00';
  return String(Math.min(max, Math.max(0, value))).padStart(2, '0');
}

function getCalendarDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array(offset).fill(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function DeparturePicker({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
}: Props) {
  const [dateAnchor, setDateAnchor] = useState<HTMLButtonElement | null>(null);
  const [timeAnchor, setTimeAnchor] = useState<HTMLButtonElement | null>(null);
  const [draftTime, setDraftTime] = useState(timeValue);
  const [exactHourDraft, setExactHourDraft] = useState('');
  const [exactMinuteDraft, setExactMinuteDraft] = useState('');
  const [viewDate, setViewDate] = useState(() => {
    const base = dateValue || todayInputDate();
    const [year, month] = base.split('-').map(Number);
    return new Date(year, month - 1, 1);
  });

  const days = useMemo(() => getCalendarDays(viewDate), [viewDate]);

  const setDate = (nextDate: string) => {
    onDateChange(nextDate);
    setDateAnchor(null);
  };

  const setTime = (nextTime: string) => {
    onTimeChange(nextTime);
  };

  const openTimePicker = (anchor: HTMLButtonElement) => {
    const parts = getTimeParts(timeValue);
    setDraftTime(timeValue);
    setExactHourDraft(parts.hour);
    setExactMinuteDraft(parts.minute);
    setTimeAnchor(anchor);
  };

  const applyTime = (nextTime: string, close = false) => {
    const parts = getTimeParts(nextTime);
    setDraftTime(nextTime);
    setExactHourDraft(parts.hour);
    setExactMinuteDraft(parts.minute);
    setTime(nextTime);
    if (close) setTimeAnchor(null);
  };

  const handleDraftTimeChange = (nextValue: string) => {
    setDraftTime(nextValue);

    const normalized = normalizeTimeEntry(nextValue);
    if (normalized) {
      const parts = getTimeParts(normalized);
      setExactHourDraft(parts.hour);
      setExactMinuteDraft(parts.minute);
      setTime(normalized);
    }
  };

  const updateExactPart = (part: 'hour' | 'minute', rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 2);

    const nextHourDraft = part === 'hour' ? digits : exactHourDraft;
    const nextMinuteDraft = part === 'minute' ? digits : exactMinuteDraft;

    if (part === 'hour') setExactHourDraft(digits);
    if (part === 'minute') setExactMinuteDraft(digits);

    if (!nextHourDraft && !nextMinuteDraft) {
      setDraftTime('');
      onTimeChange('');
      return;
    }

    if (nextHourDraft.length === 2 && nextMinuteDraft.length === 2) {
      applyTime(`${clampPart(Number(nextHourDraft), 23)}:${clampPart(Number(nextMinuteDraft), 59)}`);
    }
  };

  const commitExactParts = () => {
    if (!exactHourDraft && !exactMinuteDraft) {
      setDraftTime('');
      onTimeChange('');
      return;
    }

    applyTime(`${clampPart(Number(exactHourDraft || 0), 23)}:${clampPart(Number(exactMinuteDraft || 0), 59)}`);
  };

  const shiftExactPart = (part: 'hour' | 'minute', delta: number) => {
    const nextHourNumber = Number(exactHourDraft || 0) + (part === 'hour' ? delta : 0);
    const nextMinuteNumber = Number(exactMinuteDraft || 0) + (part === 'minute' ? delta : 0);
    const nextHour = clampPart(nextHourNumber, 23);
    const nextMinute = clampPart(nextMinuteNumber, 59);

    applyTime(`${nextHour}:${nextMinute}`);
  };

  const commitDraftTime = () => {
    if (!draftTime.trim()) {
      onTimeChange('');
      setTimeAnchor(null);
      return;
    }

    const normalized = normalizeTimeEntry(draftTime);
    if (!normalized) return;

    applyTime(normalized, true);
  };

  const moveMonth = (delta: number) => {
    setViewDate(current => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  return (
    <div className="gc-datetime-panel">
      <div className="gc-datetime-title">
        <CalendarMonth fontSize="small" />
        <span>Salida</span>
      </div>

      <div className="gc-datetime-fields">
        <button
          type="button"
          className="gc-date-trigger"
          onClick={event => setDateAnchor(event.currentTarget)}
        >
          <CalendarMonth fontSize="small" />
          <span>
            <small>Fecha</small>
            <strong>{formatDateLabel(dateValue)}</strong>
          </span>
          <ExpandMore fontSize="small" />
        </button>

        <button
          type="button"
          className="gc-date-trigger"
          onClick={event => openTimePicker(event.currentTarget)}
        >
          <AccessTime fontSize="small" />
          <span>
            <small>Hora</small>
            <strong>{formatTimeLabel(timeValue)}</strong>
          </span>
          <ExpandMore fontSize="small" />
        </button>
      </div>

      <Popover
        open={Boolean(dateAnchor)}
        anchorEl={dateAnchor}
        onClose={() => setDateAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ className: 'gc-picker-popover' }}
      >
        <div className="gc-calendar-popover">
          <div className="gc-calendar-header">
            <IconButton size="small" onClick={() => moveMonth(-1)}>
              <ChevronLeft fontSize="small" />
            </IconButton>
            <strong>{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</strong>
            <IconButton size="small" onClick={() => moveMonth(1)}>
              <ChevronRight fontSize="small" />
            </IconButton>
          </div>

          <div className="gc-calendar-grid gc-calendar-weekdays">
            {WEEK_DAYS.map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>

          <div className="gc-calendar-grid">
            {days.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} />;

              const cellDate = toInputDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
              const isSelected = cellDate === dateValue;
              const isToday = cellDate === todayInputDate();

              return (
                <button
                  key={cellDate}
                  type="button"
                  className={`gc-calendar-day${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}`}
                  onClick={() => setDate(cellDate)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </Popover>

      <Popover
        open={Boolean(timeAnchor)}
        anchorEl={timeAnchor}
        onClose={() => setTimeAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ className: 'gc-picker-popover' }}
      >
        <div className="gc-time-popover">
          <div className="gc-time-preview">
            <AccessTime fontSize="small" />
            <input
              autoFocus
              inputMode="numeric"
              value={draftTime}
              placeholder="HH:MM"
              onChange={event => handleDraftTimeChange(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') commitDraftTime();
              }}
            />
          </div>

          <div className="gc-exact-time-selector">
            <div className="gc-time-column-title">Hora exacta</div>
            <div className="gc-exact-time-grid">
              <div className="gc-exact-time-part">
                <span>Hora</span>
                <div>
                  <button type="button" onClick={() => shiftExactPart('hour', -1)} aria-label="Restar hora">
                    <Remove fontSize="small" />
                  </button>
                  <input
                    inputMode="numeric"
                    maxLength={2}
                    value={exactHourDraft}
                    placeholder="HH"
                    onChange={event => updateExactPart('hour', event.target.value)}
                    onFocus={event => event.currentTarget.select()}
                    onClick={event => event.currentTarget.select()}
                    onBlur={commitExactParts}
                    onKeyDown={event => {
                      if (event.key === 'Enter') commitExactParts();
                    }}
                  />
                  <button type="button" onClick={() => shiftExactPart('hour', 1)} aria-label="Sumar hora">
                    <Add fontSize="small" />
                  </button>
                </div>
              </div>

              <div className="gc-exact-time-part">
                <span>Minuto</span>
                <div>
                  <button type="button" onClick={() => shiftExactPart('minute', -1)} aria-label="Restar minuto">
                    <Remove fontSize="small" />
                  </button>
                  <input
                    inputMode="numeric"
                    maxLength={2}
                    value={exactMinuteDraft}
                    placeholder="MM"
                    onChange={event => updateExactPart('minute', event.target.value)}
                    onFocus={event => event.currentTarget.select()}
                    onClick={event => event.currentTarget.select()}
                    onBlur={commitExactParts}
                    onKeyDown={event => {
                      if (event.key === 'Enter') commitExactParts();
                    }}
                  />
                  <button type="button" onClick={() => shiftExactPart('minute', 1)} aria-label="Sumar minuto">
                    <Add fontSize="small" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="gc-time-column-title">Frecuentes</div>
            <div className="gc-time-preset-grid">
              {TIME_PRESETS.map(option => (
                <button
                  key={option}
                  type="button"
                  className={`gc-time-chip${option === timeValue ? ' selected' : ''}`}
                  onClick={() => applyTime(option, true)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="gc-time-done"
            onClick={commitDraftTime}
          >
            Listo
          </button>
        </div>
      </Popover>
    </div>
  );
}
