const moment = require('moment-timezone');

exports.getWeekStart = function(dateInput){
  // Set timezone to America/Lima (Peru)
  const d = moment.tz(dateInput, 'America/Lima');
  // get Monday of the week (set to 00:00)
  const day = d.day(); // 0 = Sunday, 1 = Monday, ...
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  d.subtract(diff, 'days').startOf('day');
  return d.toDate();
};
