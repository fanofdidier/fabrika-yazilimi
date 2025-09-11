import React from 'react';
import Button from './Button';

// Alert Component
const Alert = ({
  children,
  type = 'info',
  title,
  dismissible = false,
  onDismiss,
  icon,
  actions,
  className = '',
  ...props
}) => {
  const typeConfig = {
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-400',
      defaultIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-400',
      defaultIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-400',
      defaultIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-400',
      defaultIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    }
  };
  
  const config = typeConfig[type];
  const displayIcon = icon !== null ? (icon || config.defaultIcon) : null;
  
  const alertClasses = [
    'rounded-lg border p-4',
    config.bgColor,
    config.borderColor,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={alertClasses} role="alert" {...props}>
      <div className="flex">
        {displayIcon && (
          <div className="flex-shrink-0">
            <div className={config.iconColor}>
              {displayIcon}
            </div>
          </div>
        )}
        
        <div className={`${displayIcon ? 'ml-3' : ''} flex-1`}>
          {title && (
            <h3 className={`text-sm font-medium ${config.textColor} mb-1`}>
              {title}
            </h3>
          )}
          
          <div className={`text-sm ${config.textColor} ${title ? 'opacity-90' : ''}`}>
            {children}
          </div>
          
          {actions && (
            <div className="mt-3 flex space-x-2">
              {actions}
            </div>
          )}
        </div>
        
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <Button.Icon
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className={`${config.iconColor} hover:bg-black hover:bg-opacity-10`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button.Icon>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Toast Component
const Toast = ({
  children,
  type = 'info',
  title,
  duration = 5000,
  position = 'top-right',
  onClose,
  icon,
  actions,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = React.useState(true);
  const timeoutRef = React.useRef(null);
  
  React.useEffect(() => {
    if (duration > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose && onClose(), 300);
      }, duration);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, onClose]);
  
  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    setTimeout(() => onClose && onClose(), 300);
  };
  
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4'
  };
  
  const typeConfig = {
    info: {
      bgColor: 'bg-white',
      borderColor: 'border-blue-200',
      textColor: 'text-gray-900',
      iconColor: 'text-blue-500',
      defaultIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    },
    success: {
      bgColor: 'bg-white',
      borderColor: 'border-green-200',
      textColor: 'text-gray-900',
      iconColor: 'text-green-500',
      defaultIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    warning: {
      bgColor: 'bg-white',
      borderColor: 'border-yellow-200',
      textColor: 'text-gray-900',
      iconColor: 'text-yellow-500',
      defaultIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    error: {
      bgColor: 'bg-white',
      borderColor: 'border-red-200',
      textColor: 'text-gray-900',
      iconColor: 'text-red-500',
      defaultIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    }
  };
  
  const config = typeConfig[type];
  const displayIcon = icon !== null ? (icon || config.defaultIcon) : null;
  
  const toastClasses = [
    'fixed z-50 max-w-sm w-full shadow-lg rounded-lg border pointer-events-auto transition-all duration-300 ease-in-out',
    config.bgColor,
    config.borderColor,
    positionClasses[position],
    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
    className
  ].filter(Boolean).join(' ');
  
  if (!isVisible && duration === 0) return null;
  
  return (
    <div className={toastClasses} {...props}>
      <div className="p-4">
        <div className="flex">
          {displayIcon && (
            <div className="flex-shrink-0">
              <div className={config.iconColor}>
                {displayIcon}
              </div>
            </div>
          )}
          
          <div className={`${displayIcon ? 'ml-3' : ''} flex-1`}>
            {title && (
              <p className={`text-sm font-medium ${config.textColor}`}>
                {title}
              </p>
            )}
            
            <div className={`text-sm ${config.textColor} ${title ? 'mt-1 opacity-90' : ''}`}>
              {children}
            </div>
            
            {actions && (
              <div className="mt-3 flex space-x-2">
                {actions}
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <Button.Icon
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button.Icon>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast Container Component
const ToastContainer = ({ children, position = 'top-right', className = '', ...props }) => {
  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-center': 'top-0 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-center': 'bottom-0 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-0 right-0'
  };
  
  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 p-4 space-y-4 pointer-events-none ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Banner Component
const Banner = ({
  children,
  type = 'info',
  dismissible = false,
  onDismiss,
  icon,
  actions,
  className = '',
  ...props
}) => {
  const typeConfig = {
    info: {
      bgColor: 'bg-blue-600',
      textColor: 'text-white',
      iconColor: 'text-blue-200',
      defaultIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    },
    success: {
      bgColor: 'bg-green-600',
      textColor: 'text-white',
      iconColor: 'text-green-200',
      defaultIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    warning: {
      bgColor: 'bg-yellow-600',
      textColor: 'text-white',
      iconColor: 'text-yellow-200',
      defaultIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    error: {
      bgColor: 'bg-red-600',
      textColor: 'text-white',
      iconColor: 'text-red-200',
      defaultIcon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    }
  };
  
  const config = typeConfig[type];
  const displayIcon = icon !== null ? (icon || config.defaultIcon) : null;
  
  const bannerClasses = [
    'p-4',
    config.bgColor,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={bannerClasses} role="banner" {...props}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {displayIcon && (
            <div className={`flex-shrink-0 ${config.iconColor} mr-3`}>
              {displayIcon}
            </div>
          )}
          
          <div className={`text-sm font-medium ${config.textColor}`}>
            {children}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {actions && (
            <div className="flex space-x-2">
              {actions}
            </div>
          )}
          
          {dismissible && (
            <Button.Icon
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className={`${config.iconColor} hover:bg-white hover:bg-opacity-20`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button.Icon>
          )}
        </div>
      </div>
    </div>
  );
};

// Export all components
Alert.Toast = Toast;
Alert.ToastContainer = ToastContainer;
Alert.Banner = Banner;

export { Alert, Toast, ToastContainer, Banner };
export default Alert;