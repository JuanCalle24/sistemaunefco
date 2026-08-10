import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
import { formatDateVisual, formatDateISO } from '../utils/textUtils';
import { FERIADOS_BOLIVIA_2026 } from '../data/feriadosBolivia';

interface DatePickerPopupProps {
  selectedDate: Date | null;
  onSelectDate: (d: Date) => void;
  feriadosCustom?: string[];
  minDate?: Date | null;
  maxDate?: Date | null;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonClassName?: string;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = [
  { short: 'L', full: 'Lunes' },
  { short: 'M', full: 'Martes' },
  { short: 'X', full: 'Miércoles' },
  { short: 'J', full: 'Jueves' },
  { short: 'V', full: 'Viernes' },
  { short: 'S', full: 'Sábado' },
  { short: 'D', full: 'Domingo', isRed: true },
];

export const DatePickerPopup: React.FC<DatePickerPopupProps> = ({
  selectedDate,
  onSelectDate,
  feriadosCustom = [],
  minDate = null,
  maxDate = null,
  title = "INICIO DE FECHA",
  subtitle = "Selecciona una fecha hábil (Lun-Sáb)",
  placeholder = "Seleccionar fecha...",
  buttonClassName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(selectedDate ? selectedDate.getMonth() : new Date().getMonth());
  const [viewYear, setViewYear] = useState(selectedDate ? selectedDate.getFullYear() : 2026);

  // Sync view when selectedDate changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (selectedDate) {
        setViewMonth(selectedDate.getMonth());
        setViewYear(selectedDate.getFullYear());
      } else if (minDate) {
        setViewMonth(minDate.getMonth());
        setViewYear(minDate.getFullYear());
      } else {
        setViewMonth(new Date().getMonth());
        setViewYear(2026);
      }
    }
  }, [isOpen, selectedDate, minDate]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const baseHolidays = FERIADOS_BOLIVIA_2026.map(f => f.fecha);
  const allHolidays = [...baseHolidays, ...feriadosCustom];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const mondayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDateNormalized = minDate ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate(), 0, 0, 0, 0) : null;
  const maxDateNormalized = maxDate ? new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate(), 0, 0, 0, 0) : null;

  const days: React.ReactNode[] = [];

  // Empty leading slots for alignment (Monday-start grid)
  for (let i = 0; i < mondayOffset; i++) {
    days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
  }

  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(viewYear, viewMonth, d, 0, 0, 0, 0);
    const iso = formatDateISO(dayDate);
    const isSun = dayDate.getDay() === 0;
    const isHol = allHolidays.includes(iso);
    const isBeforeMin = minDateNormalized ? dayDate < minDateNormalized : false;
    const isAfterMax = maxDateNormalized ? dayDate > maxDateNormalized : false;
    const isDisabled = isSun || isHol || isBeforeMin || isAfterMax;

    const isSelected = selectedDate && selectedDate.toDateString() === dayDate.toDateString();
    const isToday = dayDate.toDateString() === today.toDateString();

    let cellClass = "h-9 w-9 text-xs font-bold font-numeric rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer ";

    if (isSelected) {
      cellClass += "bg-indigo-600 text-white font-extrabold shadow-md ring-2 ring-indigo-300 dark:ring-indigo-800 scale-105";
    } else if (isDisabled) {
      cellClass += "text-rose-400 dark:text-rose-500 bg-rose-50/60 dark:bg-rose-950/30 line-through cursor-not-allowed opacity-60";
    } else if (isToday) {
      cellClass += "border-2 border-indigo-600 dark:border-indigo-400 text-indigo-700 dark:text-indigo-300 font-extrabold bg-indigo-50/60 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900";
    } else {
      cellClass += "text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400";
    }

    const titleText = isBeforeMin 
      ? `No permitido: fecha anterior al mínimo (${minDateNormalized ? formatDateVisual(minDateNormalized, false) : ''})` 
      : isAfterMax
      ? `No permitido: excede el límite de 100 días de contrato (${maxDateNormalized ? formatDateVisual(maxDateNormalized, false) : ''})`
      : isHol ? "Feriado no hábil" 
      : isSun ? "Domingo no hábil" 
      : formatDateVisual(dayDate, true);

    days.push(
      <button
        type="button"
        key={`day-${d}`}
        disabled={isDisabled}
        onClick={() => {
          onSelectDate(dayDate);
          setIsOpen(false);
        }}
        className={cellClass}
        title={titleText}
      >
        {d}
      </button>
    );
  }

  const defaultBtnStyle = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-500 rounded-sm px-3 py-2 text-xs cursor-pointer flex items-center justify-between shadow-2xs transition-colors group";

  return (
    <div className="w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClassName || defaultBtnStyle}
      >
        <span className={selectedDate ? "font-bold font-numeric text-indigo-950 dark:text-indigo-200" : "text-slate-400 dark:text-slate-500 font-semibold"}>
          {selectedDate ? formatDateVisual(selectedDate, true) : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
      </button>

      {/* Modal Backdrop & Popup Calendar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop Overlay Click */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          {/* Modal Container */}
          <div className="relative z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 w-84 max-w-full space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/80 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    {title}
                  </h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {subtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Month / Year Navigator */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs transition-all cursor-pointer"
                title="Mes Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1.5 font-bold text-sm text-indigo-700 dark:text-indigo-300">
                <span>{MESES[viewMonth]}</span>
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="bg-transparent font-bold text-sm cursor-pointer focus:outline-none text-indigo-900 dark:text-indigo-200"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-2xs transition-all cursor-pointer"
                title="Mes Siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {DIAS_SEMANA.map((d, idx) => (
                <span
                  key={idx}
                  className={`text-[11px] font-bold py-1 ${d.isRed ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}
                  title={d.full}
                >
                  {d.short}
                </span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 justify-items-center">
              {days}
            </div>

            {/* Footer Legend & Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3 font-semibold">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" /> Selección
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> No Hábil
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setViewMonth(now.getMonth());
                  setViewYear(now.getFullYear());
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Ir a hoy</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};


