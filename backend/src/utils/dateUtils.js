// src/utils/dateUtils.js
exports.getWeekStart = function(dateInput){
  const d = new Date(dateInput);
  // get Monday of the week (set to 00:00)
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
};
