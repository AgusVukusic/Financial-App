export const calculateNextPaymentDate = (dueDate, lastPaidDateISO, currentDate = new Date()) => {
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11
  
  // Si nunca se pagó, el próximo pago es en el mes actual
  let nextDate = new Date(currentYear, currentMonth, dueDate || 1);
  
  if (lastPaidDateISO) {
    const lastPaid = new Date(lastPaidDateISO);
    // Si la última vez que pagó fue este mes (o después), el próximo pago es el mes que viene
    if (lastPaid.getFullYear() >= currentYear && lastPaid.getMonth() >= currentMonth) {
      nextDate = new Date(currentYear, currentMonth + 1, dueDate || 1);
    }
  }

  return nextDate;
};

export const getSubscriptionStatus = (sub, currentDate = new Date()) => {
  const nextPayment = calculateNextPaymentDate(sub.dueDate, sub.lastPaidDate, currentDate);
  
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  const paymentDay = new Date(nextPayment.getFullYear(), nextPayment.getMonth(), nextPayment.getDate());
  
  const diffTime = paymentDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'overdue', days: Math.abs(diffDays), nextPayment };
  } else if (diffDays <= 5) {
    return { status: 'due_soon', days: diffDays, nextPayment };
  } else {
    // Si faltan muchos días, asumimos que está al día o falta bastante
    return { status: 'paid', days: diffDays, nextPayment }; 
  }
};

export const calculateTotalMonthlySubscriptions = (subscriptions) => {
  return subscriptions.reduce((total, sub) => {
    const monthlyAmount = sub.cycle === 'yearly' ? sub.amount / 12 : sub.amount;
    return total + monthlyAmount;
  }, 0);
};
