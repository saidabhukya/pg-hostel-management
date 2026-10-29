/**
 * Joining-Date Based Fee Cycle Calculator
 * Handles custom student billing cycles, next due dates, and status calculations.
 */

/**
 * Format Date object to YYYY-MM-DD
 */
function formatDateToISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format Date to Indian format DD-MM-YYYY (e.g. 16-09-2026)
 */
function formatDateDisplay(dateInput) {
  if (!dateInput) return '-';
  if (typeof dateInput === 'string') {
    const clean = dateInput.split('T')[0].trim();
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD -> DD-MM-YYYY
        return `${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[0]}`;
      } else if (parts[2].length === 4) {
        // DD-MM-YYYY
        return `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
      }
    }
  }
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

/**
 * Parse YYYY-MM-DD or DD-MM-YYYY to Date
 */
function parseDate(dateStr) {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  if (typeof dateStr === 'string' && dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else if (parts.length >= 3 && parts[2].length === 4) {
      // DD-MM-YYYY
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Calculate the Nth billing cycle for a student based on joining date
 * Cycle 1: [joining_date, joining_date + 1 month - 1 day]
 * Cycle 2: [cycle1_end + 1 day, cycle1_end + 1 day + 1 month - 1 day]
 */
function calculateCycle(joiningDateStr, cycleIndex = 1) {
  const startDateObj = parseDate(joiningDateStr);
  const startDay = startDateObj.getDate();
  const startMonth = startDateObj.getMonth();
  const startYear = startDateObj.getFullYear();

  // Target month and year for cycle start
  const cycleStartMonth = startMonth + (cycleIndex - 1);
  const cycleStartDate = new Date(startYear, cycleStartMonth, startDay);

  // Cycle end is exactly 1 month later minus 1 day
  // E.g. 16-09-2026 to 15-10-2026
  const nextMonthDate = new Date(startYear, cycleStartMonth + 1, startDay);
  const cycleEndDate = new Date(nextMonthDate.getTime() - (24 * 60 * 60 * 1000));

  return {
    cycleNumber: cycleIndex,
    startDate: formatDateToISO(cycleStartDate),
    endDate: formatDateToISO(cycleEndDate),
    dueDate: formatDateToISO(cycleEndDate),
    startDateDisplay: formatDateDisplay(cycleStartDate),
    endDateDisplay: formatDateDisplay(cycleEndDate),
    dueDateDisplay: formatDateDisplay(cycleEndDate)
  };
}

/**
 * Generate all billing cycles up to current date + upcoming cycle
 */
function generateCyclesForStudent(joiningDateStr, monthlyFee = 7000, referenceDate = new Date()) {
  const cycles = [];
  const ref = referenceDate instanceof Date ? referenceDate : parseDate(referenceDate);
  let cycleIdx = 1;
  let keepGenerating = true;

  while (keepGenerating) {
    const cycle = calculateCycle(joiningDateStr, cycleIdx);
    const startObj = parseDate(cycle.startDate);

    cycles.push({
      cycle_number: cycle.cycleNumber,
      start_date: cycle.startDate,
      end_date: cycle.endDate,
      due_date: cycle.dueDate,
      amount: monthlyFee,
      paid_amount: 0,
      status: 'pending'
    });

    // If this cycle covers or is beyond reference date, stop after 1 more ahead
    if (startObj > ref || cycleIdx >= 24) {
      keepGenerating = false;
    } else {
      cycleIdx++;
    }
  }

  return cycles;
}

/**
 * Evaluate reminder status based on due date:
 * - Paid: 🟢
 * - Due Soon (<= 7 days before due date): 🟡
 * - Due Today: 🔴
 * - Overdue: 🔴
 */
function evaluateDueStatus(dueDateStr, isPaid = false, referenceDate = new Date()) {
  if (isPaid) {
    return {
      status: 'paid',
      label: 'Paid',
      color: 'green',
      icon: 'check-circle',
      badgeClass: 'badge-success'
    };
  }

  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const due = parseDate(dueDateStr);
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffTime = dueMidnight.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'overdue',
      label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`,
      color: 'red',
      icon: 'alert-triangle',
      badgeClass: 'badge-danger',
      daysDifference: diffDays
    };
  } else if (diffDays === 0) {
    return {
      status: 'due_today',
      label: 'Due Today',
      color: 'red',
      icon: 'alert-circle',
      badgeClass: 'badge-danger',
      daysDifference: 0
    };
  } else if (diffDays <= 7) {
    return {
      status: 'due_soon',
      label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`,
      color: 'yellow',
      icon: 'clock',
      badgeClass: 'badge-warning',
      daysDifference: diffDays
    };
  } else {
    return {
      status: 'upcoming',
      label: `Due in ${diffDays} days`,
      color: 'blue',
      icon: 'calendar',
      badgeClass: 'badge-info',
      daysDifference: diffDays
    };
  }
}

module.exports = {
  formatDateToISO,
  formatDateDisplay,
  parseDate,
  calculateCycle,
  generateCyclesForStudent,
  evaluateDueStatus
};
