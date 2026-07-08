import React, { useState, useEffect } from 'react';
import { useGroupDetails } from '../hooks/useGroups';
import { useAccounts } from '../hooks/useAccounts';
import { ArrowLeft, User, Plus, Trash2, Edit2, Clock } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { motion } from 'framer-motion';
import { useDialog } from '../contexts/DialogContext';
import { calculateSettlements } from '../utils/settlementAlgorithm';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Card from './ui/Card';

const GroupDetails = ({ groupId, onBack, uid, userName, accountBalances }) => {
  const { group, expenses, addSharedExpense, confirmSettlement, updateSharedExpense, deleteSharedExpense, deleteGroup } = useGroupDetails(groupId);
  const { accounts } = useAccounts(uid);
  const { confirm, alert } = useDialog();
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Comida');
  const [splitMethod, setSplitMethod] = useState('equal'); // 'equal' | 'custom'
  const [customSplits, setCustomSplits] = useState({});
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Modals for settlement
  const [settleModalData, setSettleModalData] = useState(null);
  const [settleAccountId, setSettleAccountId] = useState('');
  const [confirmReceiveData, setConfirmReceiveData] = useState(null);
  const [receiveAccountId, setReceiveAccountId] = useState('');
  const [payMyPartData, setPayMyPartData] = useState(null);

  useEffect(() => {
    if (accounts && accounts.length > 0) {
      if (!selectedAccountId) setSelectedAccountId(accounts[0].id);
      if (!settleAccountId) setSettleAccountId(accounts[0].id);
      if (!receiveAccountId) setReceiveAccountId(accounts[0].id);
    }
  }, [accounts]);

  if (!group) return <div>Cargando grupo...</div>;

  const isCashAccount = (acc) => acc?.type === 'cash' || acc?.name?.toLowerCase().includes('efectivo');

  const handleCustomSplitChange = (memberUid, value) => {
    setCustomSplits(prev => ({
      ...prev,
      [memberUid]: parseFloat(value) || 0
    }));
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description || !amount) return;
    if (!selectedAccountId) {
      await alert('Debes tener al menos una cuenta para registrar pagos.');
      return;
    }

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
      accountId: selectedAccountId,
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

  // Filter out pending settlements so they don't affect balances until confirmed
  const completedExpenses = expenses.filter(e => !e.isSettlement || e.status !== 'pending');
  const { balances, settlements } = calculateSettlements(group.members, completedExpenses);

  const handleConfirmSettleDebt = async (e) => {
    e.preventDefault();
    if (!settleModalData || !settleAccountId) return;
    
    const settlement = settleModalData;
    const settledExpensesToSave = [];
    const categoryAdjustmentsFrom = {};
    const categoryAdjustmentsTo = {};

    completedExpenses.forEach((exp) => {
      if (!exp.isSettlement) {
        if (exp.paidBy === settlement.toUid && exp.splits[settlement.fromUid] > 0 && !(exp.settledSplits && exp.settledSplits[settlement.fromUid])) {
          const amt = exp.splits[settlement.fromUid];
          settledExpensesToSave.push({ expId: exp.id, uidToSettle: settlement.fromUid });
          const cat = exp.category || 'Otros';
          categoryAdjustmentsFrom[cat] = (categoryAdjustmentsFrom[cat] || 0) + amt;
          categoryAdjustmentsTo[cat] = (categoryAdjustmentsTo[cat] || 0) - amt;
        }
        if (exp.paidBy === settlement.fromUid && exp.splits[settlement.toUid] > 0 && !(exp.settledSplits && exp.settledSplits[settlement.toUid])) {
          const amt = exp.splits[settlement.toUid];
          settledExpensesToSave.push({ expId: exp.id, uidToSettle: settlement.toUid });
          const cat = exp.category || 'Otros';
          categoryAdjustmentsFrom[cat] = (categoryAdjustmentsFrom[cat] || 0) - amt;
          categoryAdjustmentsTo[cat] = (categoryAdjustmentsTo[cat] || 0) + amt;
        }
      }
    });

    const selectedAcc = accounts.find(a => a.id === settleAccountId);
    const isCashPayment = isCashAccount(selectedAcc);

    await addSharedExpense({
      description: "Liquidación de deuda",
      incomeDescription: `Pago de deuda de ${settlement.from}`,
      expenseDescription: `Pago a ${settlement.to} por deuda compartida`,
      amount: settlement.amount,
      paidBy: settlement.fromUid,
      payerAccountId: settleAccountId,
      receiverUid: settlement.toUid,
      isSettlement: true,
      status: 'pending', // Async flow!
      isCashPayment: isCashPayment,
      splits: {
        [settlement.toUid]: settlement.amount
      },
      settledExpenses: settledExpensesToSave,
      categoryAdjustmentsPayer: categoryAdjustmentsFrom,
      categoryAdjustmentsReceiver: categoryAdjustmentsTo
    });

    // Mark splits as settled locally (they will un-settle if the settlement is deleted, handled in useGroups)
    completedExpenses.forEach(async (exp) => {
      if (!exp.isSettlement) {
        if (exp.paidBy === settlement.toUid && exp.splits[settlement.fromUid] > 0 && !(exp.settledSplits && exp.settledSplits[settlement.fromUid])) {
          await updateSharedExpense(exp.id, {
            settledSplits: { ...(exp.settledSplits || {}), [settlement.fromUid]: true }
          });
        }
        if (exp.paidBy === settlement.fromUid && exp.splits[settlement.toUid] > 0 && !(exp.settledSplits && exp.settledSplits[settlement.toUid])) {
          await updateSharedExpense(exp.id, {
            settledSplits: { ...(exp.settledSplits || {}), [settlement.toUid]: true }
          });
        }
      }
    });

    setSettleModalData(null);
  };

  const handleConfirmReceive = async (e) => {
    e.preventDefault();
    if (!confirmReceiveData || !receiveAccountId) return;
    
    await confirmSettlement(
      confirmReceiveData.id, 
      uid, 
      receiveAccountId, 
      confirmReceiveData.incomeDescription, 
      confirmReceiveData.categoryAdjustmentsReceiver
    );
    
    setConfirmReceiveData(null);
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
                    <Button variant="success" size="sm" onClick={() => setSettleModalData(s)}>
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

      {/* Settle Debt Modal */}
      {settleModalData && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 10000, alignItems: 'center' }}>
          <Card className="modal-content animate-slide-up" style={{ padding: 'var(--spacing-xl)' }}>
            <h3>Saldar Deuda</h3>
            <p>Estás a punto de pagar {formatCurrency(settleModalData.amount)} a {settleModalData.to}.</p>
            <form onSubmit={handleConfirmSettleDebt}>
              <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>¿De qué cuenta salió el dinero?</label>
                <Select value={settleAccountId} onChange={(e) => setSettleAccountId(e.target.value)} required>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(accountBalances?.[acc.id] ?? acc.initialBalance ?? 0)})</option>
                  ))}
                </Select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="submit" variant="primary" style={{ flex: 1 }}>Confirmar Pago</Button>
                <Button variant="outline" type="button" onClick={() => setSettleModalData(null)}>Cancelar</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Confirm Receive Modal */}
      {confirmReceiveData && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 10000, alignItems: 'center' }}>
          <Card className="modal-content animate-slide-up" style={{ padding: 'var(--spacing-xl)' }}>
            <h3>Confirmar Recepción</h3>
            <p>Recibiste {formatCurrency(confirmReceiveData.amount)} de un pago de deuda.</p>
            <form onSubmit={handleConfirmReceive}>
              <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>¿En qué cuenta lo recibiste?</label>
                <Select value={receiveAccountId} onChange={(e) => setReceiveAccountId(e.target.value)} required>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(accountBalances?.[acc.id] ?? acc.initialBalance ?? 0)})</option>
                  ))}
                </Select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="submit" variant="success" style={{ flex: 1 }}>Confirmar</Button>
                <Button variant="outline" type="button" onClick={() => setConfirmReceiveData(null)}>Cancelar</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {isAdding && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleAddExpense} style={{ marginBottom: 'var(--spacing-md)' }}>
          <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <Input type="text" placeholder="Descripción del gasto" value={description} onChange={(e) => setDescription(e.target.value)} required fullWidth />
            
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <Input type="number" placeholder="Monto Total" value={amount} onChange={(e) => setAmount(e.target.value)} required fullWidth style={{ flex: 1 }} />
              <Select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} required style={{ flex: 1 }}>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(accountBalances?.[acc.id] ?? acc.initialBalance ?? 0)})</option>
                ))}
              </Select>
            </div>
            
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
            const isPending = exp.isSettlement && exp.status === 'pending';

            return (
              <Card key={exp.id} style={{ padding: 'var(--spacing-sm) var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isPending ? 0.8 : 1 }}>
                <div>
                  <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {exp.description} 
                    {isPending && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--warning)', color: '#000', borderRadius: '12px' }}>Pendiente</span>}
                  </div>
                  {exp.isSettlement ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{payer?.name} pagó a {receiver?.name || 'alguien'}</div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pagado por {payer?.name} {exp.category && `• ${exp.category}`}</div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold' }}>{formatCurrency(exp.amount)}</div>
                    
                    {/* Receiver UI for Pending Settlement */}
                    {isPending && exp.receiverUid === uid && (
                      <Button variant="success" size="sm" onClick={() => setConfirmReceiveData(exp)} style={{ marginTop: '4px' }}>
                        Confirmar Recepción
                      </Button>
                    )}
                    {isPending && exp.paidBy === uid && (
                       <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                         <Clock size={12}/> Esperando confirmación
                       </span>
                    )}

                    {!isPending && (
                      <div style={{ fontSize: '0.8rem', color: exp.isSettlement ? 'var(--success)' : (mySplit > 0 ? 'var(--danger)' : 'var(--text-secondary)') }}>
                        {mySplit > 0 && (exp.isSettlement ? `Recibiste: ${formatCurrency(mySplit)}` : `Te toca: ${formatCurrency(mySplit)}`)}
                      </div>
                    )}
                    
                    {mySplit > 0 && exp.paidBy !== uid && !(exp.settledSplits && exp.settledSplits[uid]) && !exp.isSettlement && (
                      <Button 
                        variant="success"
                        size="sm"
                        onClick={() => {
                          setConfirmReceiveData(null);
                          setSettleModalData(null);
                          setPayMyPartData({
                            exp,
                            payer,
                            mySplit
                          });
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
                  {(exp.paidBy === uid && !isPending) && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <Button variant="ghost" size="sm" isIcon onClick={() => {
                          setEditingExpenseId(exp.id);
                          setDescription(exp.description);
                          setAmount(exp.amount.toString());
                          setCategory(exp.category || 'Comida');
                          setSplitMethod('custom');
                          setCustomSplits(exp.splits);
                          setIsAdding(true);
                        }} title="Editar gasto">
                        <Edit2 size={16} color="var(--accent-primary)" />
                      </Button>
                      <Button variant="ghost" size="sm" isIcon onClick={async () => { 
                          const isConfirmed = await confirm('¿Eliminar este gasto compartido?');
                          if (isConfirmed) deleteSharedExpense(exp.id); 
                        }} title="Eliminar gasto">
                        <Trash2 size={16} color="var(--danger)" />
                      </Button>
                    </div>
                  )}
                  {(exp.paidBy === uid && isPending) && (
                     <Button variant="ghost" size="sm" isIcon onClick={async () => { 
                          const isConfirmed = await confirm('¿Cancelar este pago pendiente?');
                          if (isConfirmed) deleteSharedExpense(exp.id); 
                        }} title="Cancelar pago">
                        <Trash2 size={16} color="var(--danger)" />
                      </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Pay My Part Modal */}
      {payMyPartData && (
        <div className="modal-overlay animate-fade-in" style={{ zIndex: 10000, alignItems: 'center' }}>
          <Card className="modal-content animate-slide-up" style={{ padding: 'var(--spacing-xl)' }}>
            <h3>Saldar Mi Parte</h3>
            <p>Pagarás {formatCurrency(payMyPartData.mySplit)} a {payMyPartData.payer?.name}.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!settleAccountId) return;
              
              const { exp, payer, mySplit } = payMyPartData;
              
              const selectedAcc = accounts.find(a => a.id === settleAccountId);
              const isCashPayment = isCashAccount(selectedAcc);

              await addSharedExpense({
                description: `Pago por: ${exp.description}`,
                incomeDescription: `${userName} pagó su parte de: ${exp.description}`,
                expenseDescription: `Pago a ${payer?.name} por ${exp.description}`,
                amount: mySplit,
                paidBy: uid,
                payerAccountId: settleAccountId,
                receiverUid: exp.paidBy,
                isSettlement: true,
                status: 'pending',
                isCashPayment: isCashPayment,
                splits: {
                  [exp.paidBy]: mySplit
                },
                settledExpenses: [{ expId: exp.id, uidToSettle: uid }],
                categoryAdjustmentsPayer: { [exp.category || 'Otros']: mySplit },
                categoryAdjustmentsReceiver: { [exp.category || 'Otros']: -mySplit }
              });
              
              await updateSharedExpense(exp.id, {
                settledSplits: { ...(exp.settledSplits || {}), [uid]: true }
              });
              
              setPayMyPartData(null);
            }}>
              <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>¿De qué cuenta salió el dinero?</label>
                <Select value={settleAccountId} onChange={(e) => setSettleAccountId(e.target.value)} required>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(accountBalances?.[acc.id] ?? acc.initialBalance ?? 0)})</option>
                  ))}
                </Select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button type="submit" variant="primary" style={{ flex: 1 }}>Confirmar Pago</Button>
                <Button variant="outline" type="button" onClick={() => setPayMyPartData(null)}>Cancelar</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </motion.div>
  );
};

export default GroupDetails;
