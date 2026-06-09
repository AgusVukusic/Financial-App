import React, { useState } from 'react';
import { useGroupDetails } from '../hooks/useGroups';
import { ArrowLeft, User, DollarSign, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { motion } from 'framer-motion';
import { useDialog } from '../contexts/DialogContext';

const GroupDetails = ({ groupId, onBack, uid, userName }) => {
  const { group, expenses, addSharedExpense, updateSharedExpense, deleteSharedExpense, deleteGroup } = useGroupDetails(groupId);
  const { confirm, alert } = useDialog();
  const [isAdding, setIsAdding] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Comida');
  const [splitMethod, setSplitMethod] = useState('equal'); // 'equal' | 'custom'
  const [customSplits, setCustomSplits] = useState({});

  if (!group) return <div>Cargando grupo...</div>;

  const handleCustomSplitChange = (memberUid, value) => {
    setCustomSplits(prev => ({
      ...prev,
      [memberUid]: parseFloat(value) || 0
    }));
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description || !amount) return;

    const totalAmount = parseFloat(amount);
    let splits = {};

    if (splitMethod === 'equal') {
      const splitAmount = totalAmount / group.members.length;
      group.members.forEach(m => {
        splits[m.uid] = splitAmount;
      });
    } else {
      splits = customSplits;
      const totalCustom = Object.values(splits).reduce((a, b) => a + b, 0);
      if (Math.abs(totalCustom - totalAmount) > 0.01) {
        await alert('La suma de las partes no coincide con el total.');
        return;
      }
    }

    const expenseData = {
      description,
      amount: totalAmount,
      paidBy: uid,
      splits,
      category
    };

    if (editingExpenseId) {
      await updateSharedExpense(editingExpenseId, expenseData);
    } else {
      await addSharedExpense(expenseData);
    }

    setIsAdding(false);
    setEditingExpenseId(null);
    setDescription('');
    setAmount('');
    setCategory('Comida');
    setCustomSplits({});
  };

  // Calculate Balances
  const balances = {}; // uid -> amount (positive means they are owed money, negative means they owe money)
  group.members.forEach(m => { balances[m.uid] = 0; });

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
      from: group.members.find(m => m.uid === debtor.uid)?.name,
      to: group.members.find(m => m.uid === creditor.uid)?.name,
      amount
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  const handleSettleDebt = async (settlement) => {
    const isConfirmed = await confirm(`¿Registrar que ${settlement.from} pagó ${formatCurrency(settlement.amount)} a ${settlement.to}?`);
    if (isConfirmed) {
      const settledExpensesToSave = [];
      expenses.forEach((exp) => {
        if (!exp.isSettlement) {
          if (exp.paidBy === settlement.toUid && exp.splits[settlement.fromUid] > 0 && !(exp.settledSplits && exp.settledSplits[settlement.fromUid])) {
            settledExpensesToSave.push({ expId: exp.id, uidToSettle: settlement.fromUid });
          }
          if (exp.paidBy === settlement.fromUid && exp.splits[settlement.toUid] > 0 && !(exp.settledSplits && exp.settledSplits[settlement.toUid])) {
            settledExpensesToSave.push({ expId: exp.id, uidToSettle: settlement.toUid });
          }
        }
      });

      await addSharedExpense({
        description: "Liquidación de deuda",
        incomeDescription: `Pago de deuda de ${settlement.from}`,
        expenseDescription: `Pago a ${settlement.to} por deuda compartida`,
        amount: settlement.amount,
        paidBy: settlement.fromUid,
        receiverUid: settlement.toUid,
        isSettlement: true,
        splits: {
          [settlement.toUid]: settlement.amount
        },
        settledExpenses: settledExpensesToSave
      });

      expenses.forEach(async (exp) => {
        if (!exp.isSettlement) {
          if (exp.paidBy === settlement.toUid && exp.splits[settlement.fromUid] > 0 && !(exp.settledSplits && exp.settledSplits[settlement.fromUid])) {
            await updateSharedExpense(exp.id, {
              settledSplits: {
                ...(exp.settledSplits || {}),
                [settlement.fromUid]: true
              }
            });
          }
          if (exp.paidBy === settlement.fromUid && exp.splits[settlement.toUid] > 0 && !(exp.settledSplits && exp.settledSplits[settlement.toUid])) {
            await updateSharedExpense(exp.id, {
              settledSplits: {
                ...(exp.settledSplits || {}),
                [settlement.toUid]: true
              }
            });
          }
        }
      });
    }
  };

  const handleDeleteGroup = async () => {
    const isConfirmed = await confirm("¿Estás seguro de que quieres eliminar este grupo de forma definitiva?");
    if (isConfirmed) {
      await deleteGroup();
      onBack();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="group-details-container" style={{ padding: 'var(--spacing-md) 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}><ArrowLeft size={24} /></button>
          <h2 style={{ margin: 0 }}>{group.name}</h2>
        </div>
        <button onClick={handleDeleteGroup} style={{ background: 'var(--danger-bg)', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
          <Trash2 size={20} />
        </button>
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Código de Invitación:</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px', color: 'var(--accent-primary)' }}>{group.inviteCode}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <div className="glass-panel" style={{ padding: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Balances</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {group.members.map(m => {
              const bal = balances[m.uid] || 0;
              const isPositive = bal > 0.01;
              const isNegative = bal < -0.01;
              return (
                <div key={m.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: m.uid === uid ? 'bold' : 'normal' }}>{m.name}</span>
                  <span style={{ fontSize: '0.9rem', color: isPositive ? 'var(--success)' : (isNegative ? 'var(--danger)' : 'var(--text-secondary)') }}>
                    {isPositive ? '+' : ''}{formatCurrency(bal)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: 'var(--spacing-md)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Miembros</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {group.members.map(m => (
              <div key={m.uid} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} className="text-secondary" />
                <span style={{ fontSize: '0.9rem' }}>{m.name} {m.uid === uid && '(Tú)'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>¿Quién debe a quién?</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {settlements.length === 0 ? (
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Las cuentas están saldadas.</span>
          ) : (
            settlements.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span><strong>{s.from}</strong> le debe a <strong>{s.to}</strong></span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{formatCurrency(s.amount)}</span>
                  {s.fromUid === uid && (
                    <button 
                      onClick={() => handleSettleDebt(s)}
                      style={{ background: 'var(--success-bg)', color: 'var(--success)', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                    >
                      Saldar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h3>Gastos Compartidos</h3>
        <button onClick={() => {
          setEditingExpenseId(null);
          setDescription('');
          setAmount('');
          setCategory('Comida');
          setCustomSplits({});
          setSplitMethod('equal');
          setIsAdding(!isAdding);
        }} style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}><Plus size={20} /></button>
      </div>

      {isAdding && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAddExpense} className="glass-panel" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <input type="text" placeholder="Descripción del gasto" value={description} onChange={(e) => setDescription(e.target.value)} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)' }} />
          <input type="number" placeholder="Monto Total" value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)' }} />
          
          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
            <option value="Comida">Comida</option>
            <option value="Transporte">Transporte</option>
            <option value="Compras">Compras</option>
            <option value="Otros">Otros</option>
          </select>
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
              <input type="radio" checked={splitMethod === 'equal'} onChange={() => setSplitMethod('equal')} /> Dividir en partes iguales
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
              <input type="radio" checked={splitMethod === 'custom'} onChange={() => setSplitMethod('custom')} /> Personalizado
            </label>
          </div>

          {splitMethod === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', padding: '8px', backgroundColor: 'var(--bg-base)', borderRadius: '4px' }}>
              {group.members.map(m => (
                <div key={m.uid} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem' }}>{m.name} paga:</span>
                  <input type="number" value={customSplits[m.uid] || ''} onChange={(e) => handleCustomSplitChange(m.uid, e.target.value)} placeholder="0.00" style={{ width: '100px', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)' }} />
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button type="submit" style={{ flex: 1, background: 'var(--accent-primary)', color: 'white', padding: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Guardar</button>
            <button type="button" onClick={() => setIsAdding(false)} style={{ background: 'transparent', color: 'var(--text-secondary)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>Cancelar</button>
          </div>
        </motion.form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {expenses.length === 0 ? (
          <p className="text-secondary" style={{ fontSize: '0.9rem', textAlign: 'center' }}>No hay gastos en este grupo.</p>
        ) : (
          expenses.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()).map(exp => {
            const payer = group.members.find(m => m.uid === exp.paidBy);
            const receiverUid = exp.isSettlement ? (exp.receiverUid || Object.keys(exp.splits)[0]) : null;
            const receiver = receiverUid ? group.members.find(m => m.uid === receiverUid) : null;
            const mySplit = exp.splits[uid] || 0;
            return (
              <div key={exp.id} className="glass-panel" style={{ padding: 'var(--spacing-sm) var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '500' }}>{exp.description}</div>
                  {exp.isSettlement ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{payer?.name} pagó a {receiver?.name || 'alguien'}</div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pagado por {payer?.name} {exp.category && `• ${exp.category}`}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>{formatCurrency(exp.amount)}</div>
                    <div style={{ fontSize: '0.8rem', color: exp.isSettlement ? 'var(--success)' : (mySplit > 0 ? 'var(--danger)' : 'var(--text-secondary)') }}>
                      {mySplit > 0 && (exp.isSettlement ? `Recibiste: ${formatCurrency(mySplit)}` : `Te toca: ${formatCurrency(mySplit)}`)}
                    </div>
                    {mySplit > 0 && exp.paidBy !== uid && !(exp.settledSplits && exp.settledSplits[uid]) && !exp.isSettlement && (
                      <button 
                        onClick={async () => {
                          const isConfirmed = await confirm(`¿Pagar tu parte de ${formatCurrency(mySplit)} a ${payer?.name}?`);
                          if (isConfirmed) {
                            await addSharedExpense({
                              description: `Pago por: ${exp.description}`,
                              incomeDescription: `${userName} pagó su parte de: ${exp.description}`,
                              expenseDescription: `Pago a ${payer?.name} por ${exp.description}`,
                              amount: mySplit,
                              paidBy: uid,
                              receiverUid: exp.paidBy,
                              isSettlement: true,
                              splits: {
                                [exp.paidBy]: mySplit
                              },
                              settledExpenses: [{ expId: exp.id, uidToSettle: uid }]
                            });
                            await updateSharedExpense(exp.id, {
                              settledSplits: {
                                ...(exp.settledSplits || {}),
                                [uid]: true
                              }
                            });
                          }
                        }}
                        style={{ marginTop: '4px', background: 'var(--success-bg)', color: 'var(--success)', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}
                      >
                        Saldar mi parte
                      </button>
                    )}
                    {mySplit > 0 && exp.paidBy !== uid && exp.settledSplits && exp.settledSplits[uid] && (
                       <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'block', marginTop: '4px' }}>✓ Parte pagada</span>
                    )}
                  </div>
                  {(exp.paidBy === uid) && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => {
                          setEditingExpenseId(exp.id);
                          setDescription(exp.description);
                          setAmount(exp.amount.toString());
                          setCategory(exp.category || 'Comida');
                          setSplitMethod('custom');
                          setCustomSplits(exp.splits);
                          setIsAdding(true);
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '4px' }}
                        title="Editar gasto"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                      </button>
                      <button 
                        onClick={async () => { 
                          const isConfirmed = await confirm('¿Eliminar este gasto compartido?');
                          if (isConfirmed) deleteSharedExpense(exp.id); 
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                        title="Eliminar gasto"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default GroupDetails;
