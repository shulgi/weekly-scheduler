import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, Calendar } from 'lucide-react';

const WeeklyScheduler = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduleData, setScheduleData] = useState({});
  const [showTextOutput, setShowTextOutput] = useState(false);

  // Generate time options in 15-minute intervals (24h format)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Get the Monday of the current week
  const getMonday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit',
      year: 'numeric'
    });
  };

  // Get week string for storage key
  const getWeekKey = (date) => {
    const monday = getMonday(date);
    return formatDate(monday);
  };

  // Get dates for the current week
  const getWeekDates = (startDate) => {
    const dates = [];
    const monday = getMonday(startDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentWeek);
  const weekKey = getWeekKey(currentWeek);
  const currentWeekData = scheduleData[weekKey] || {};

  // Day names
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Add new entry to a day
  const addEntry = (dayIndex, startTime = '09:00') => {
    const newEntry = {
      id: `${Date.now()}-${Math.random()}`, // More unique ID
      startTime: startTime,
      endTime: '',
      description: ''
    };

    setScheduleData(prev => ({
      ...prev,
      [weekKey]: {
        ...prev[weekKey],
        [dayIndex]: [...(prev[weekKey]?.[dayIndex] || []), newEntry]
      }
    }));
  };

  // Find next available time slot
  const getNextAvailableTime = (dayEntries) => {
    if (dayEntries.length === 0) return '09:00'; // Default start if no entries
    
    // Convert time string to minutes
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    // Convert minutes back to time string
    const minutesToTime = (minutes) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };
    
    // Get all busy time slots
    const busySlots = dayEntries.map(entry => ({
      start: timeToMinutes(entry.startTime),
      end: entry.endTime ? timeToMinutes(entry.endTime) : timeToMinutes(entry.startTime) + 60 // Assume 1 hour if no end time
    })).sort((a, b) => a.start - b.start);
    
    // Check for gaps between entries (minimum 15 minutes)
    for (let i = 0; i < busySlots.length - 1; i++) {
      const gapStart = busySlots[i].end;
      const gapEnd = busySlots[i + 1].start;
      if (gapEnd - gapStart >= 15) { // At least 15 minutes gap
        return minutesToTime(gapStart);
      }
    }
    
    // If no gaps, suggest time after the last entry
    const lastEntry = busySlots[busySlots.length - 1];
    const nextTime = lastEntry.end;
    
    // Make sure it's not past 23:45
    if (nextTime >= 24 * 60) return '09:00'; // Loop back to morning
    
    return minutesToTime(nextTime);
  };

  // Check for time conflicts
  const hasTimeConflict = (currentEntry, allEntries) => {
    return allEntries.some(entry => {
      if (entry.id === currentEntry.id) return false; // Don't compare with itself
      
      // Convert times to minutes for easier comparison
      const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const currentStart = timeToMinutes(currentEntry.startTime);
      const currentEnd = currentEntry.endTime ? timeToMinutes(currentEntry.endTime) : null;
      const otherStart = timeToMinutes(entry.startTime);
      const otherEnd = entry.endTime ? timeToMinutes(entry.endTime) : null;
      
      // Check for same start time
      if (currentStart === otherStart) return true;
      
      // Check if current entry starts within another entry's range
      if (otherEnd && currentStart > otherStart && currentStart < otherEnd) return true;
      
      // Check if another entry starts within current entry's range
      if (currentEnd && otherStart > currentStart && otherStart < currentEnd) return true;
      
      // Check for overlapping ranges
      if (currentEnd && otherEnd) {
        return (currentStart < otherEnd && currentEnd > otherStart);
      }
      
      return false;
    });
  };

  // Generate dynamic placeholder text
  const getPlaceholderText = (startTime, endTime) => {
    const timeTemplates = {
      single: [
        `what am i doing at ${startTime}?`,
        `this is what happens at ${startTime}`,
        `at ${startTime} i will be...`,
        `${startTime} activity`,
        `something wonderful at ${startTime}`,
      ],
      range: [
        `between ${startTime} and ${endTime} i will...`,
        `from ${startTime} to ${endTime} i am...`,
        `${startTime}-${endTime} plans`,
        `what happens from ${startTime} until ${endTime}`,
        `my ${startTime} to ${endTime} activity`,
      ]
    };

    const templates = endTime ? timeTemplates.range : timeTemplates.single;
    return templates[Math.floor(Math.random() * templates.length)];
  };

  // Update entry
  const updateEntry = (dayIndex, entryId, field, value) => {
    setScheduleData(prev => ({
      ...prev,
      [weekKey]: {
        ...prev[weekKey],
        [dayIndex]: prev[weekKey]?.[dayIndex]?.map(entry =>
          entry.id === entryId ? { ...entry, [field]: value } : entry
        ) || []
      }
    }));
  };

  // Delete entry
  const deleteEntry = (dayIndex, entryId) => {
    setScheduleData(prev => ({
      ...prev,
      [weekKey]: {
        ...prev[weekKey],
        [dayIndex]: prev[weekKey]?.[dayIndex]?.filter(entry => entry.id !== entryId) || []
      }
    }));
  };

  // Navigate weeks
  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction * 7));
    setCurrentWeek(newDate);
  };

  // Generate text version
  const generateTextVersion = () => {
    let text = `Weekly Schedule ${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}\n\n`;
    
    weekDates.forEach((date, dayIndex) => {
      const dayEntries = currentWeekData[dayIndex] || [];
      text += `${dayNames[dayIndex]} ${date.getMonth() + 1}/${date.getDate()}\n`;
      
      if (dayEntries.length === 0) {
        text += 'No plans.\n';
      } else {
        dayEntries
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .forEach(entry => {
            const timeRange = entry.endTime ? 
              `${entry.startTime} - ${entry.endTime}` : 
              entry.startTime;
            text += `${timeRange} ${entry.description}\n`;
          });
      }
      text += '\n';
    });
    
    return text;
  };

  // Copy text to clipboard
  const copyToClipboard = () => {
    const textVersion = generateTextVersion();
    navigator.clipboard.writeText(textVersion).then(() => {
      alert('Schedule copied to clipboard!');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-light text-purple-800">Weekly Schedule</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTextOutput(!showTextOutput)}
                className="flex items-center gap-2 px-5 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 shadow-lg transition-all duration-200 border border-purple-200"
              >
                <Calendar size={20} />
                {showTextOutput ? 'Hide' : 'Show'} Text Version
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-5 py-3 bg-indigo-400 text-white rounded-xl hover:bg-indigo-500 shadow-lg transition-all duration-200"
              >
                <Copy size={20} />
                Copy Schedule
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mb-6">
            <button
              onClick={() => navigateWeek(-1)}
              className="px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 shadow-md transition-all duration-200 border border-purple-200"
            >
              ← Previous Week
            </button>
            <span className="text-2xl font-light text-purple-800 bg-white px-6 py-3 rounded-xl shadow-md border border-purple-200">
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </span>
            <button
              onClick={() => navigateWeek(1)}
              className="px-6 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 shadow-md transition-all duration-200 border border-purple-200"
            >
              Next Week →
            </button>
          </div>
        </div>

        {showTextOutput && (
          <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-purple-200">
            <h3 className="font-medium text-purple-800 mb-4 text-lg">Text Version for Messaging:</h3>
            <pre className="whitespace-pre-wrap text-sm font-mono bg-purple-50 p-4 rounded-xl border border-purple-200 text-purple-700">
              {generateTextVersion()}
            </pre>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {weekDates.map((date, dayIndex) => {
            const dayEntries = currentWeekData[dayIndex] || [];
            
            return (
              <div key={dayIndex} className="bg-white rounded-2xl p-6 shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-medium text-xl text-purple-800">
                    {dayNames[dayIndex]}
                  </h3>
                  <span className="text-sm text-purple-500 bg-purple-50 px-3 py-1 rounded-full">
                    {date.getMonth() + 1}/{date.getDate()}
                  </span>
                </div>

                <div className="space-y-4 mb-5">
                  {dayEntries
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map(entry => {
                      const hasConflict = hasTimeConflict(entry, dayEntries);
                      return (
                        <div key={entry.id} className={`p-4 rounded-xl border transition-all duration-200 ${
                          hasConflict 
                            ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-200' 
                            : 'bg-purple-50 border-purple-100'
                        }`}>
                          {hasConflict && (
                            <div className="flex items-center gap-2 mb-2 text-amber-700 text-xs">
                              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                              time conflict detected
                            </div>
                          )}
                          <div className="flex gap-2 mb-3">
                            <div className="flex items-center gap-1 flex-1">
                              <select
                                value={entry.startTime}
                                onChange={(e) => updateEntry(dayIndex, entry.id, 'startTime', e.target.value)}
                                className={`text-sm border rounded-lg px-2 py-1 bg-white focus:ring-2 transition-all ${
                                  hasConflict
                                    ? 'border-amber-300 text-amber-700 focus:ring-amber-200 focus:border-amber-400'
                                    : 'border-purple-200 text-purple-700 focus:ring-purple-200 focus:border-purple-400'
                                }`}
                              >
                                {timeOptions.map(time => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                              <span className={`text-sm ${hasConflict ? 'text-amber-400' : 'text-purple-400'}`}>to</span>
                              <select
                                value={entry.endTime}
                                onChange={(e) => updateEntry(dayIndex, entry.id, 'endTime', e.target.value)}
                                className={`text-sm border rounded-lg px-2 py-1 bg-white focus:ring-2 transition-all ${
                                  hasConflict
                                    ? 'border-amber-300 text-amber-700 focus:ring-amber-200 focus:border-amber-400'
                                    : 'border-purple-200 text-purple-700 focus:ring-purple-200 focus:border-purple-400'
                                }`}
                              >
                                <option value="">open</option>
                                {timeOptions.filter(time => time > entry.startTime).map(time => (
                                  <option key={time} value={time}>{time}</option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => deleteEntry(dayIndex, entry.id)}
                              className="text-rose-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all duration-200"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={entry.description}
                            onChange={(e) => updateEntry(dayIndex, entry.id, 'description', e.target.value)}
                            placeholder={getPlaceholderText(entry.startTime, entry.endTime)}
                            className={`w-full text-sm border rounded-lg px-3 py-2 bg-white focus:ring-2 transition-all ${
                              hasConflict
                                ? 'border-amber-300 text-amber-700 placeholder-amber-400 focus:ring-amber-200 focus:border-amber-400'
                                : 'border-purple-200 text-purple-700 placeholder-purple-400 focus:ring-purple-200 focus:border-purple-400'
                            }`}
                          />
                        </div>
                      );
                    })}
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-purple-600 mb-2">Add new time:</label>
                  <select
                    value={getNextAvailableTime(dayEntries)}
                    onChange={(e) => {
                      if (e.target.value) {
                        addEntry(dayIndex, e.target.value);
                        // The component will re-render and the value will reset to the new suggested time
                      }
                    }}
                    className="w-full text-sm border-2 border-dashed border-purple-300 rounded-xl px-3 py-2 bg-purple-50 text-purple-600 hover:border-purple-400 hover:bg-purple-100 transition-all duration-200 focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                  >
                    {(() => {
                      const nextAvailable = getNextAvailableTime(dayEntries);
                      const options = [];
                      
                      timeOptions.forEach((time, index) => {
                        // Add the clickable "suggested time" option right before the actual suggested time
                        if (time === nextAvailable) {
                          options.push(
                            <option 
                              key={`suggested-${time}`} 
                              value={time}
                              className="bg-purple-200 font-medium"
                            >
                              click to select a time and add an entry
                            </option>
                          );
                        }
                        
                        // Add the regular time option
                        options.push(
                          <option 
                            key={time} 
                            value={time}
                            className={time === nextAvailable ? 'bg-purple-100' : ''}
                          >
                            {time}
                          </option>
                        );
                      });
                      
                      return options;
                    })()}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center text-sm text-purple-500 bg-white p-4 rounded-xl shadow-sm border border-purple-200">
          <p className="mb-1">Schedule data is stored in your browser session and will be reset when you refresh the page.</p>
          <p>Make sure to copy your schedule text before closing the browser.</p>
        </div>
      </div>
    </div>
  );
};

export default WeeklyScheduler;