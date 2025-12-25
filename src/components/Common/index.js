import React from 'react';
import { X, Loader2, ChevronDown, Search } from 'lucide-react';
import { getInitials } from '../../utils/helpers';

// ============ BUTTON ============
export const Button = ({ children, variant = 'primary', size = 'md', loading = false, disabled = false, icon: Icon, className = '', ...props }) => {
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-300'
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2', lg: 'px-6 py-3 text-lg' };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

// ============ INPUT ============
export const Input = React.forwardRef(({ label, error, hint, icon: Icon, className = '', ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
    <div className="relative">
      {Icon && <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />}
      <input
        ref={ref}
        className={`w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all ${Icon ? 'pl-10' : ''} ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
    </div>
    {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));

// ============ TEXTAREA ============
export const Textarea = React.forwardRef(({ label, error, rows = 4, className = '', ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
    <textarea
      ref={ref}
      rows={rows}
      className={`w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none ${error ? 'border-red-500' : ''} ${className}`}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));

// ============ SELECT ============
export const Select = React.forwardRef(({ label, error, options = [], placeholder = 'Seleccionar...', className = '', ...props }, ref) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-300">{label}</label>}
    <div className="relative">
      <select
        ref={ref}
        className={`w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white appearance-none focus:outline-none focus:border-emerald-500 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value ?? opt.id} value={opt.value ?? opt.id}>{opt.label ?? opt.name}</option>
        ))}
      </select>
      <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));

// ============ CHECKBOX ============
export const Checkbox = ({ label, checked, onChange, className = '' }) => (
  <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <div className="w-5 h-5 border-2 border-gray-600 rounded peer-checked:bg-emerald-500 peer-checked:border-emerald-500 flex items-center justify-center">
      {checked && <svg className="w-3 h-3 text-white" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>}
    </div>
    {label && <span className="text-sm text-gray-300">{label}</span>}
  </label>
);

// ============ MODAL ============
export const Modal = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className={`w-full ${sizes[size]} bg-slate-800 rounded-2xl shadow-2xl border border-gray-700 animate-fadeIn`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">{footer}</div>}
      </div>
    </div>
  );
};

// ============ CARD ============
export const Card = ({ children, className = '', hover = false, onClick }) => (
  <div className={`bg-slate-800/50 border border-gray-700/50 rounded-2xl p-4 ${hover ? 'hover:border-emerald-500/30 cursor-pointer transition-all' : ''} ${className}`} onClick={onClick}>
    {children}
  </div>
);

// ============ BADGE ============
export const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const variants = {
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    neutral: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>{children}</span>;
};

// ============ AVATAR ============
export const Avatar = ({ name, src, size = 'md', className = '' }) => {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg', xl: 'w-20 h-20 text-2xl' };
  if (src) return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover ${className}`} />;
  return <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center font-semibold text-white ${className}`}>{getInitials(name)}</div>;
};

// ============ SPINNER ============
export const Spinner = ({ size = 'md' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return <div className={`${sizes[size]} border-2 border-gray-700 border-t-emerald-500 rounded-full animate-spin`} />;
};

// ============ LOADING STATE ============
export const LoadingState = ({ message = 'Cargando...' }) => (
  <div className="flex flex-col items-center justify-center py-12">
    <Spinner size="lg" />
    <p className="mt-4 text-gray-400">{message}</p>
  </div>
);

// ============ EMPTY STATE ============
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {Icon && <Icon size={64} className="text-gray-600 mb-4" />}
    <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
    {description && <p className="text-gray-500 mt-1">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ============ SEARCH INPUT ============
export const SearchInput = ({ value, onChange, placeholder = 'Buscar...', className = '' }) => (
  <div className={`relative ${className}`}>
    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
    />
  </div>
);

// ============ TABS ============
export const Tabs = ({ tabs, activeTab, onChange }) => (
  <div className="flex gap-1 p-1 bg-gray-800/50 rounded-xl">
    {tabs.map(tab => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}
      >
        {tab.icon && <tab.icon size={16} />}
        {tab.label}
      </button>
    ))}
  </div>
);

// ============ CONFIRM DIALOG ============
export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', loading = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-gray-300 mb-6">{message}</p>
    <div className="flex gap-3">
      <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
      <Button variant="danger" onClick={onConfirm} loading={loading} className="flex-1">{confirmText}</Button>
    </div>
  </Modal>
);

// ============ DROPDOWN ============
export const Dropdown = ({ trigger, children, align = 'right' }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />
          <div className={`absolute z-30 mt-2 py-2 w-48 bg-slate-800 border border-gray-700 rounded-xl shadow-xl ${align === 'left' ? 'left-0' : 'right-0'}`}>
            {React.Children.map(children, child => child && React.cloneElement(child, { onClick: () => { child.props.onClick?.(); setIsOpen(false); } }))}
          </div>
        </>
      )}
    </div>
  );
};

export const DropdownItem = ({ icon: Icon, children, onClick, danger = false }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-700/50 ${danger ? 'text-red-400' : 'text-gray-300'}`}>
    {Icon && <Icon size={16} />}
    {children}
  </button>
);

// ============ STAT CARD ============
export const StatCard = ({ icon: Icon, label, value, subtitle, color = 'emerald' }) => {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-500',
    blue: 'bg-blue-500/10 text-blue-500',
    orange: 'bg-orange-500/10 text-orange-500',
    red: 'bg-red-500/10 text-red-500',
    purple: 'bg-purple-500/10 text-purple-500'
  };
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}><Icon size={24} /></div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-gray-400">{label}</p>
          {subtitle && <p className="text-xs text-emerald-500">{subtitle}</p>}
        </div>
      </div>
    </Card>
  );
};
