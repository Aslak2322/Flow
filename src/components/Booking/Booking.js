import React, { useState } from 'react';
import './Booking.css';

function Booking({ addToCart, cart}) {
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeSlots = [
    { startTime: '9:00', endTime: '10:00' },
    { startTime: '10:00', endTime: '11:00' },
    { startTime: '11:00', endTime: '12:00' },
    { startTime: '12:00', endTime: '13:00'},
    {startTime: '13:00', endTime: '14:00'},
    {startTime: '14:00', endTime: '15:00'},
    {startTime: '15:00', endTime: '16:00'},
    {startTime: '16:00', endTime: '17:00'},
    {startTime: '17:00', endTime: '18:00'}
  ];

  // Track selected slots, for example as an array of strings 'row-col'
  const [selectedSlots, setSelectedSlots] = useState([]);

  const toggleSlot = (rowIndex, colIndex) => {
    const dateKey = weekDates[colIndex].toISOString().split('T')[0];
    const slotId = `${dateKey}-${rowIndex}`;
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter(id => id !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };
  

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when Sunday
    d.setDate(diff);
    return d;
  }
  
  function getWeekDates(startDate) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(d);
    }
    return dates;
  }
  
  const weekDates = getWeekDates(currentWeekStart);

  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => {
      const prevMonday = new Date(prev);
      prevMonday.setDate(prev.getDate() - 7);
      return prevMonday;
    });
  };
  
  const goToNextWeek = () => {
    setCurrentWeekStart(prev => {
      const nextMonday = new Date(prev);
      nextMonday.setDate(prev.getDate() + 7);
      return nextMonday;
    });
  };

  const handleSubmit = async () => {
    if (selectedSlots.length === 0) {
      alert('No slots selected');
      return;
    }
  
    try {
      console.log("Trying")
      for (let slotId of selectedSlots) {
        // Split slotId properly
        const parts = slotId.split('-');
        const rowIndex = parts.pop();        // last element is rowIndex
        const date = parts.join('-');        // the rest is the date
        console.log(date)
        console.log(slotId)
  
        const slot = timeSlots[parseInt(rowIndex)];
        if (!slot) continue; // safety check
        console.log(slot)
        console.log(slot.startTime)

        const bookingItem = {
          id: slotId,             // unique identifier
          starttime: slot.startTime,
          endtime: slot.endTime,
          type: 'Booking',
          date,
          user_id: 1,
          price: slot.price || 50 
        };
    
        addToCart(bookingItem); // add to cart    
      }
  
      alert('Bookings submitted successfully!');
      console.log(`Cart ${cart}`)
      setSelectedSlots([]); // clear selections
  
    } catch (error) {
      console.error(error);
      alert('Failed to submit bookings');
    }
  };  

  console.log("Number of timeSlots:", timeSlots.length);

  return (
    <div className="body">
      <h1>Booking</h1>
      <div className="gridContainer">
        <h2>Available Times</h2>
        <div className="mini">
          <button onClick={goToPreviousWeek}>Previous Week</button>
          <button onClick={goToNextWeek}>Next Week</button>
        </div>
        <table className="table">
        <thead>
          <tr>
            {weekdays.map((day, i) => (
            <th key={day}>
              {day}<br />
              {weekDates[i].toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
            </th>
            ))}
          </tr>
        </thead>

          <tbody>
            {timeSlots.map((slot, rowIndex) => (
              <tr key={rowIndex}>
                {weekdays.map((_, colIndex) => {
                  const dateKey = weekDates[colIndex].toISOString().split('T')[0];
                  const slotId = `${dateKey}-${rowIndex}`;
                  const isSelected = selectedSlots.includes(slotId);
                  return (
                    <td key={colIndex}>
                      <button
                        style={{
                          backgroundColor: isSelected ? 'lightgreen' : 'white',
                          cursor: 'pointer',
                          border: '1px solid gray',
                          padding: '5px 10px',
                        }}
                        onClick={() => toggleSlot(rowIndex, colIndex)}
                      >
                        {slot.startTime} - {slot.endTime}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <button className="submit" onClick={handleSubmit}>Book</button>
      </div>
    </div>
  );
}

export default Booking;

