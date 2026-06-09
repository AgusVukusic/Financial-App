export const calculateSettlements = (groupMembers, expenses) => {
  // Calculate Balances
  const balances = {}; // uid -> amount (positive means they are owed money, negative means they owe money)
  
  groupMembers.forEach(m => { balances[m.uid] = 0; });

  expenses.forEach(exp => {
    if (balances[exp.paidBy] !== undefined) {
      balances[exp.paidBy] += exp.amount;
    }
    
    Object.entries(exp.splits).forEach(([memberUid, splitAmount]) => {
      if (balances[memberUid] !== undefined) {
        balances[memberUid] -= splitAmount;
      }
    });
  });

  // Settlement Algorithm (Who owes whom)
  const settlements = [];
  const debtors = [];
  const creditors = [];

  Object.entries(balances).forEach(([mUid, bal]) => {
    if (bal < -0.01) debtors.push({ uid: mUid, amount: Math.abs(bal) });
    else if (bal > 0.01) creditors.push({ uid: mUid, amount: bal });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const amount = Math.min(debtor.amount, creditor.amount);
    
    settlements.push({
      fromUid: debtor.uid,
      toUid: creditor.uid,
      from: groupMembers.find(m => m.uid === debtor.uid)?.name,
      to: groupMembers.find(m => m.uid === creditor.uid)?.name,
      amount
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return { balances, settlements };
};
