import React, { useState } from 'react';
import { useGroupDetails } from '../hooks/useGroups';
import { ArrowLeft, User, Plus, Trash2, Edit2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { motion } from 'framer-motion';
import { useDialog } from '../contexts/DialogContext';
import { calculateSettlements } from '../utils/settlementAlgorithm';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Card from './ui/Card';

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

    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingExpenseId(null);
    setDescription('');
    setAmount('');
    setCategory('Comida');
    setCustomSplits({});
    setSplitMethod('equal');
  };

  const { balances, settlements } = calculateSettlements(group.members, expenses);

  const handleSettleDebt = async (settlement) => {
    const isConfirmed = await confirm(`¿Registrar que ${settlement.from} pagó ${formatCurrency(settlement.amount)} a ${settlement.to}?`);
    if (isConfirmed) {
      const settledExpensesToSave = [];
      const categoryAdjustmentsFrom = {};
      const categoryAdjustmentsTo = {};

      expenses.forEach((exp) => {
        if (!exp.isSettlement) {
          if (exp.paidBy === settlement.toUid && exp.splits[settlement.fromUid] > 0 && !(exp.settledSplits && exp.settledSplits[settlement.fromUid])) {
            const amount = exp.splits[settlement.fromUid];
            settledExpensesToSave.push({ expId: exp.id, uidToSettle: settlement.fromUid });
            const cat = exp.category || 'Otros';
            categoryAdjustmentsFrom[cat] = (categoryAdjustmentsFrom[cat] || 0) + amount;
            categoryAdjustmentsTo[cat] = (categoryAdjustmentsTo[cat] || 0) - amount;
          }
          if (exp.paidBy === settlement.fromUid && exp.splits[settlement.toUid] > 0 && !(exp.settledSplits && exp.settledSplits[settlement.toUid])) {
            const amount = exp.splits[settlement.toUid];
            settledExpensesToSave.push({ expId: exp.id, uidToSettle: settlement.toUid });
            const cat = exp.category || 'Otros';
            // from is receiving this part back from to
            categoryAdjustmentsFrom[cat] = (categoryAdjustmentsFrom[cat] || 0) - amount;
            categoryAdjustmentsTo[cat] = (categoryAdjustmentsTo[cat] || 0) + amount;
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
        settledExpenses: settledExpensesToSave,
        categoryAdjustmentsPayer: categoryAdjustmentsFrom,
        categoryAdjustmentsReceiver: categoryAdjustmentsTo
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
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ padding: 'var(--spacing-md) 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <Button variant="ghost" isIcon onClick={onBack}><ArrowLeft size={24} /></Button>
          <h2 style={{ margin: 0 }}>{group.name}</h2>
        </div>
        <Button variant="danger" isIcon onClick={handleDeleteGroup}>
          <Trash2 size={20} />
        </Button>
      </div>

      <Card style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="text-secondary" style={{ fontSize: '0.85rem' }}>Código de Invitación:</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '2px', color: 'var(--accent-primary)' }}>{group.inviteCode}</div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
        <Card>
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
        </Card>
        
        <Card>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Miembros</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {group.members.map(m => (
              <div key={m.uid} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={16} className="text-secondary" />
                <span style={{ fontSize: '0.9rem' }}>{m.name} {m.uid === uid && '(Tú)'}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: 'var(--spacing-lg)' }}>
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
                    <Button variant="success" size="sm" onClick={() => handleSettleDebt(s)}>
                      Saldar
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h3>Gastos Compartidos</h3>
        <Button isIcon onClick={() => {
          resetForm();
          setIsAdding(true);
        }}>
          <Plus size={20} />
        </Button>
      </div>

      {isAdding && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAddExpense} style={{ marginBottom: 'var(--spacing-md)' }}>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <Input type="text" placeholder="Descripción del gasto" value={description} onChange={(e) => setDescription(e.target.value)} required fullWidth />
            <Input type="number" placeholder="Monto Total" value={amount} onChange={(e) => setAmount(e.target.value)} required fullWidth />
            
            <Select value={category} onChange={(e) => setCategory(e.target.value)} fullWidth>
              <option value="Comida">Comida</option>
              <option value="Transporte">Transporte</option>
              <option value="Compras">Compras</option>
              <option value="Otros">Otros</option>
            </Select>
            
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
                    <Input type="number" value={customSplits[m.uid] || ''} onChange={(e) => handleCustomSplitChange(m.uid, e.target.value)} placeholder="0.00" style={{ width: '100px' }} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Button type="submit" style={{ flex: 1 }}>Guardar</Button>
              <Button variant="outline" type="button" onClick={resetForm}>Cancelar</Button>
            </div>
          </Card>
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
              <Card key={exp.id} style={{ padding: 'var(--spacing-sm) var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      <Button 
                        variant="success"
                        size="sm"
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
                              settledExpenses: [{ expId: exp.id, uidToSettle: uid }],
                              categoryAdjustmentsPayer: { [exp.category || 'Otros']: mySplit },
                              categoryAdjustmentsReceiver: { [exp.category || 'Otros']: -mySplit }
                            });
                            await updateSharedExpense(exp.id, {
                              settledSplits: {
                                ...(exp.settledSplits || {}),
                                [uid]: true
                              }
                            });
                          }
                        }}
                        style={{ marginTop: '4px' }}
                      >
                        Saldar mi parte
                      </Button>
                    )}
                    {mySplit > 0 && exp.paidBy !== uid && exp.settledSplits && exp.settledSplits[uid] && (
                       <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'block', marginTop: '4px' }}>✓ Parte pagada</span>
                    )}
                  </div>
                  {(exp.paidBy === uid) && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <Button 
                        variant="ghost"
                        size="sm"
                        isIcon
                        onClick={() => {
                          setEditingExpenseId(exp.id);
                          setDescription(exp.description);
                          setAmount(exp.amount.toString());
                          setCategory(exp.category || 'Comida');
                          setSplitMethod('custom');
                          setCustomSplits(exp.splits);
                          setIsAdding(true);
                        }}
                        title="Editar gasto"
                      >
                        <Edit2 size={16} color="var(--accent-primary)" />
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        isIcon
                        onClick={async () => { 
                          const isConfirmed = await confirm('¿Eliminar este gasto compartido?');
                          if (isConfirmed) deleteSharedExpense(exp.id); 
                        }}
                        title="Eliminar gasto"
                      >
                        <Trash2 size={16} color="var(--danger)" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export default GroupDetails;
