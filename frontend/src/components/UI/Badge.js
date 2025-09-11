import React from 'react';

// Badge Component
const Badge = ({
  children,
  variant = 'default',
  size = 'default',
  rounded = true,
  removable = false,
  onRemove,
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center font-medium';
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    dark: 'bg-gray-800 text-white',
    light: 'bg-white text-gray-800 border border-gray-300'
  };
  
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    default: 'px-3 py-1 text-sm',
    lg: 'px-3 py-1.5 text-sm',
    xl: 'px-4 py-2 text-base'
  };
  
  const roundedClass = rounded ? 'rounded-full' : 'rounded';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    roundedClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <span className={classes} {...props}>
      {children}
      {removable && (
        <button
          type="button"
          className="ml-1 inline-flex items-center justify-center w-4 h-4 text-current hover:bg-black hover:bg-opacity-10 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
          onClick={onRemove}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
};

// Dot Badge Component
const DotBadge = ({
  children,
  variant = 'default',
  size = 'default',
  position = 'top-right',
  showDot = true,
  count,
  maxCount = 99,
  className = '',
  ...props
}) => {
  const variantClasses = {
    default: 'bg-gray-500',
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500'
  };
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    default: 'w-3 h-3',
    lg: 'w-4 h-4'
  };
  
  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1'
  };
  
  const displayCount = count > maxCount ? `${maxCount}+` : count;
  const hasCount = count !== undefined && count > 0;
  
  return (
    <div className={`relative inline-block ${className}`} {...props}>
      {children}
      {(showDot || hasCount) && (
        <span
          className={`absolute ${positionClasses[position]} transform translate-x-1/2 -translate-y-1/2 ${
            hasCount
              ? `${variantClasses[variant]} text-white text-xs font-medium rounded-full px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center`
              : `${variantClasses[variant]} ${sizeClasses[size]} rounded-full`
          }`}
        >
          {hasCount ? displayCount : ''}
        </span>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({
  status,
  size = 'default',
  showIcon = true,
  className = '',
  ...props
}) => {
  const statusConfig = {
    active: {
      variant: 'success',
      label: 'Active',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    inactive: {
      variant: 'default',
      label: 'Inactive',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    },
    pending: {
      variant: 'warning',
      label: 'Pending',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
      )
    },
    completed: {
      variant: 'success',
      label: 'Completed',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )
    },
    failed: {
      variant: 'danger',
      label: 'Failed',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    cancelled: {
      variant: 'default',
      label: 'Cancelled',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )
    }
  };
  
  const config = statusConfig[status] || statusConfig.inactive;
  
  return (
    <Badge
      variant={config.variant}
      size={size}
      className={className}
      {...props}
    >
      {showIcon && (
        <span className="mr-1">{config.icon}</span>
      )}
      {config.label}
    </Badge>
  );
};

// Priority Badge Component
const PriorityBadge = ({
  priority,
  size = 'default',
  showIcon = true,
  className = '',
  ...props
}) => {
  const priorityConfig = {
    low: {
      variant: 'success',
      label: 'Low',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )
    },
    medium: {
      variant: 'warning',
      label: 'Medium',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    high: {
      variant: 'danger',
      label: 'High',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      )
    },
    urgent: {
      variant: 'danger',
      label: 'Urgent',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    }
  };
  
  const config = priorityConfig[priority] || priorityConfig.medium;
  
  return (
    <Badge
      variant={config.variant}
      size={size}
      className={className}
      {...props}
    >
      {showIcon && (
        <span className="mr-1">{config.icon}</span>
      )}
      {config.label}
    </Badge>
  );
};

// Export all components
Badge.Dot = DotBadge;
Badge.Status = StatusBadge;
Badge.Priority = PriorityBadge;

export { Badge, DotBadge, StatusBadge, PriorityBadge };
export default Badge;