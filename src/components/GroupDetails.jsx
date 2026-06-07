import React, { useState } from 'react';
import { useGroupDetails } from '../hooks/useGroups';
import { ArrowLeft, User, DollarSign, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { motion } from 'framer-motion';

const GroupDetails = ({ groupId, onBack, uid, userName }) => {
  const { group, expenses, addSharedExpense, deleteSharedExpense, deleteGroup } = useGroupDetails(groupId);
  const [isAdding, setIsAdding] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
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
        alert('La suma de las partes no coincide con el total.');
        return;
      }
    }

    await addSharedExpense({
      description,
      amount: totalAmount,
      paidBy: uid,
      splits
    });

    setIsAdding(false);
    setDescription('');
    setAmount('');
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
      from: group.members.find(m => m.uid === debtor.uid)?.name,
      to: group.members.find(m => m.uid === creditor.uid)?.name,
      amount
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  const handleDeleteGroup = async () => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este grupo de forma definitiva?")) {
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
                <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{formatCurrency(s.amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h3>Gastos Compartidos</h3>
        <button onClick={() => setIsAdding(!isAdding)} style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}><Plus size={20} /></button>
      </div>

      {isAdding && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAddExpense} className="glass-panel" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <input type="text" placeholder="Descripción del gasto" value={description} onChange={(e) => setDescription(e.target.value)} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)' }} />
          <input type="number" placeholder="Monto Total" value={amount} onChange={(e) => setAmount(e.target.value)} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)' }} />
          
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
            const mySplit = exp.splits[uid] || 0;
            return (
              <div key={exp.id} className="glass-panel" style={{ padding: 'var(--spacing-sm) var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '500' }}>{exp.description}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pagado por {payer?.name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>{formatCurrency(exp.amount)}</div>
                    <div style={{ fontSize: '0.8rem', color: mySplit > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {mySplit > 0 && `Te toca: ${formatCurrency(mySplit)}`}
                    </div>
                  </div>
                  {(exp.paidBy === uid) && (
                    <button 
                      onClick={() => { if(window.confirm('¿Eliminar este gasto compartido?')) deleteSharedExpense(exp.id); }}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                      title="Eliminar gasto"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
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
