import React from 'react';
import { X, Loader2, ChevronDown, Search } from 'lucide-react';

// ============ BUTTON ============
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  disabled = false,
  icon: Icon,
  className = '',
  ...props 
}) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    ghost: 'btn-ghost'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`btn ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={18} />
      ) : Icon ? (
        <Icon size={18} />
      ) : null}
      {children}
    </button>
  );
};

// ============ INPUT ============
export const Input = React.forwardRef(({ 
  label, 
  error, 
  hint,
  icon: Icon,
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" 
          />
        )}
        <input
          ref={ref}
          className={`input ${Icon ? 'pl-10' : ''} ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
      </div>
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
});

// ============ TEXTAREA ============
export const Textarea = React.forwardRef(({ 
  label, 
  error, 
  hint,
  className = '',
  rows = 4,
  ...props 
}, ref) => {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <textarea
        ref={ref}
        rows={rows}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        style={{ resize: 'vertical', minHeight: '100px' }}
        {...props}
      />
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && <span className="form-error">{error}</span>}
    </div>
  );
});

// ============ SELECT ============
export const Select = React.forwardRef(({ 
  label, 
  error, 
  options = [],
  placeholder = 'Seleccionar...',
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          className={`input appearance-none pr-10 ${error ? 'input-error' : ''} ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value || opt.id} value={opt.value || opt.id}>
              {opt.label || opt.name}
            </option>
          ))}
        </select>
        <ChevronDown 
          size={18} 
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" 
        />
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
});

// ============ CHECKBOX ============
export const Checkbox = ({ label, checked, onChange, className = '', ...props }) => {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
          {...props}
        />
        <div className="w-5 h-5 border-2 border-gray-600 rounded peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all">
          {checked && (
            <svg className="w-full h-full text-white p-0.5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          )}
        </div>
      </div>
      {label && <span className="text-sm text-gray-300">{label}</span>}
    </label>
  );
};

// ============ TOGGLE/SWITCH ============
export const Toggle = ({ checked, onChange, label, className = '' }) => {
  return (
    <label className={`flex items-center gap-3 cursor-pointer ${className}`}>
      <div 
        className={`switch ${checked ? 'switch-active' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <div className="switch-handle" />
      </div>
      {label && <span className="text-sm text-gray-300">{label}</span>}
    </label>
  );
};

// ============ MODAL ============
export const Modal = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-4xl'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content ${sizes[size]}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ============ CARD ============
export const Card = ({ children, className = '', hover = false, onClick }) => {
  return (
    <div 
      className={`card ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// ============ BADGE ============
export const Badge = ({ children, variant = 'neutral', className = '' }) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
};

// ============ AVATAR ============
export const Avatar = ({ name, src, size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-2xl'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (src) {
    return (
      <img 
        src={src} 
        alt={name} 
        className={`${sizes[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div className={`avatar ${sizes[size]} ${className}`}>
      {getInitials(name)}
    </div>
  );
};

// ============ LOADING SPINNER ============
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`loader ${sizes[size]} ${className}`} />
  );
};

// ============ LOADING STATE ============
export const LoadingState = ({ message = 'Cargando...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-400">{message}</p>
    </div>
  );
};

// ============ EMPTY STATE ============
export const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="empty-state">
      {Icon && <Icon className="empty-state-icon" size={64} />}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

// ============ SEARCH INPUT ============
export const SearchInput = ({ value, onChange, placeholder = 'Buscar...', className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-10"
      />
    </div>
  );
};

// ============ TABS ============
export const Tabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <tab.icon size={16} />}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

// ============ PROGRESS BAR ============
export const ProgressBar = ({ value, max = 100, className = '' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className={`progress ${className}`}>
      <div 
        className="progress-bar" 
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// ============ STAT CARD ============
export const StatCard = ({ icon: Icon, label, value, change, changeType, color = 'emerald' }) => {
  const colors = {
    emerald: 'bg-emerald-500/10 text-emerald-500',
    blue: 'bg-blue-500/10 text-blue-500',
    orange: 'bg-orange-500/10 text-orange-500',
    red: 'bg-red-500/10 text-red-500',
    purple: 'bg-purple-500/10 text-purple-500'
  };

  return (
    <div className="stat-card">
      <div className={`stat-icon ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {change && (
        <div className={`text-sm ${changeType === 'positive' ? 'text-emerald-500' : 'text-red-500'}`}>
          {changeType === 'positive' ? '+' : ''}{change}
        </div>
      )}
    </div>
  );
};

// ============ CONFIRM DIALOG ============
export const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-300 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

// ============ TOOLTIP ============
export const Tooltip = ({ children, content }) => {
  return (
    <div className="tooltip">
      {children}
      <div className="tooltip-content">{content}</div>
    </div>
  );
};

// ============ DROPDOWN ============
export const Dropdown = ({ trigger, children, align = 'right' }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="dropdown relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-20" 
            onClick={() => setIsOpen(false)} 
          />
          <div className={`dropdown-menu ${align === 'left' ? 'left-0 right-auto' : ''}`}>
            {children}
          </div>
        </>
      )}
    </div>
  );
};

export const DropdownItem = ({ icon: Icon, children, onClick, danger = false }) => {
  return (
    <div 
      className={`dropdown-item ${danger ? 'text-red-500 hover:bg-red-500/10' : ''}`}
      onClick={onClick}
    >
      {Icon && <Icon size={16} />}
      {children}
    </div>
  );
};

// ============ TABLE ============
export const Table = ({ columns, data, onRowClick, emptyMessage = 'No hay datos' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} style={{ width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr 
              key={row.id || idx}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============ SKELETON ============
export const Skeleton = ({ width, height, className = '' }) => {
  return (
    <div 
      className={`skeleton ${className}`}
      style={{ width, height }}
    />
  );
};

export const SkeletonCard = () => {
  return (
    <div className="card">
      <Skeleton height="20px" width="60%" className="mb-3" />
      <Skeleton height="14px" width="100%" className="mb-2" />
      <Skeleton height="14px" width="80%" />
    </div>
  );
};
