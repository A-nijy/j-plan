import { useState } from 'react';
import { addDays, subDays, format } from 'date-fns';

export const useDateNavigation = (initialDate: Date = new Date()) => {
  const [selectedDate, setSelectedDate] = useState(initialDate);

  const moveDate = (offset: number) => {
    setSelectedDate(prev => offset > 0 ? addDays(prev, offset) : subDays(prev, -offset));
  };

  const setToday = () => {
    setSelectedDate(new Date());
  };

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  return {
    selectedDate,
    dateStr,
    moveDate,
    setToday,
    setSelectedDate,
  };
};
