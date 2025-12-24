import React, { useState } from 'react';
import { Plus, DollarSign, Download, Filter, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button, Card, SearchInput, Modal, Badge, EmptyState, Input, Select, StatCard } from '../components/Common';
import { useToast } from '../contexts/ToastContext';
import { PAYMENT_METHODS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/helpers';

const Payments = () => {
  const { success } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const payments = [
    { id: '1', memberId: '1', memberName: 'María García', amount: 15000, date: new Date('2024-12-20'), method: 'transfer', status: 'completed', concept: 'Cuota Diciembre' },
    { id: '2', memberId: '2', memberName: 'Juan Pérez', amount: 15000, date: new Date('2024-12-19'), method: 'cash', status: 'completed', concept: 'Cuota Diciembre' },
    { id: '3', memberId: '3', memberName: 'Ana López', amount: 15000, date: new Date('2024-12-15'), method: 'mercadopago', status: 'pending', concept: 'Cuota Diciembre' },
    { id: '4', memberId: '4', memberName: 'Carlos Ruiz', amount: 12000, date: new Date('2024-12-10'), method: 'credit', status: 'completed', concept: 'Cuota Diciembre (Promo)' },
    { id: '5', memberId: '5', memberName: 'Laura Martínez', amount: 15000, date: new Date('2024-12-08'), method: 'debit', status: 'failed', concept: 'Cuota Diciembre' },
  ];

  const stats = {
    total: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    count: payments.filter(p => p.status === 'completed').length
  };

  const getStatusBadge = (status) => {
    const config = {
      completed: { variant: 'success', label: 'Completado', icon: CheckCircle },
      pending: { variant: 'warning', label: 'Pendiente', icon: Clock },
      failed: { variant: 'error', label: 'Fallido', icon: XCircle }
    };
    return config[status] || config.pending;
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.memberName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pagos</h1>
          <p className="text-gray-400">Control de pagos y facturación</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download}>Exportar</Button>
          <Button icon={Plus} onClick={() => setShowModal(true)}>Registrar Pago</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={DollarSign} label="Total Recaudado" value={formatCurrency(stats.total)} color="emerald" />
        <StatCard icon={Clock} label="Pendiente" value={formatCurrency(stats.pending)} color="orange" />
        <StatCard icon={CheckCircle} label="Pagos Completados" value={stats.count} color="blue" />
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Buscar por miembro..." className="flex-1" />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'completed', label: 'Completados' },
              { value: 'pending', label: 'Pendientes' },
              { value: 'failed', label: 'Fallidos' }
            ]}
          />
        </div>

        {filteredPayments.length === 0 ? (
          <EmptyState icon={DollarSign} title="No hay pagos" description="No se encontraron pagos" />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Miembro</th>
                  <th>Concepto</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                  <th>Método</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(payment => {
                  const statusConfig = getStatusBadge(payment.status);
                  return (
                    <tr key={payment.id}>
                      <td className="font-medium">{payment.memberName}</td>
                      <td className="text-gray-400">{payment.concept}</td>
                      <td className="font-semibold">{formatCurrency(payment.amount)}</td>
                      <td className="text-gray-400">{formatDate(payment.date)}</td>
                      <td>{PAYMENT_METHODS.find(m => m.id === payment.method)?.name}</td>
                      <td><Badge variant={statusConfig.variant}>{statusConfig.label}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Registrar Pago" size="md">
        <form className="space-y-4">
          <Input label="Miembro" placeholder="Buscar miembro..." required />
          <Input label="Monto" type="number" placeholder="15000" required />
          <Input label="Concepto" placeholder="Cuota Diciembre" required />
          <Select label="Método de Pago" options={PAYMENT_METHODS.map(m => ({ value: m.id, label: m.name }))} />
          <Input label="Fecha" type="date" />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button type="submit" onClick={() => { setShowModal(false); success('Pago registrado'); }}>Registrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payments;
