import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  padding = 'default',
  shadow = 'default',
  hover = false,
  onClick,
  ...props 
}) => {
  const baseClasses = 'bg-white rounded-xl border transition-all duration-200';
  
  const variantClasses = {
    default: 'border-gray-200',
    primary: 'border-primary-200 bg-primary-50',
    success: 'border-success-200 bg-success-50',
    warning: 'border-warning-200 bg-warning-50',
    danger: 'border-danger-200 bg-danger-50',
    gradient: 'border-transparent bg-gradient-to-br from-primary-500 to-primary-700 text-white'
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    default: 'shadow-soft',
    md: 'shadow-medium',
    lg: 'shadow-large',
    xl: 'shadow-xl'
  };
  
  const hoverClasses = hover ? 'hover:shadow-medium hover:-translate-y-1 cursor-pointer' : '';
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    shadowClasses[shadow],
    hoverClasses,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      className={classes} 
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`border-b border-gray-200 pb-4 mb-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '', size = 'default', ...props }) => {
  const sizeClasses = {
    sm: 'text-lg',
    default: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };
  
  return (
    <h3 
      className={`font-semibold text-gray-900 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

const CardSubtitle = ({ children, className = '', ...props }) => {
  return (
    <p 
      className={`text-gray-600 mt-1 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
};

const CardBody = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = '', variant = 'default', ...props }) => {
  const variantClasses = {
    default: 'border-t border-gray-200 pt-4 mt-6',
    flush: 'pt-4 mt-6',
    separated: 'border-t border-gray-200 pt-6 mt-6 bg-gray-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-xl'
  };
  
  return (
    <div 
      className={`${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon,
  color = 'primary',
  className = '',
  ...props 
}) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    gray: 'bg-gray-50 text-gray-600'
  };
  
  const changeTypeClasses = {
    positive: 'text-success-600',
    negative: 'text-danger-600',
    neutral: 'text-gray-600'
  };
  
  return (
    <Card className={`${className}`} {...props}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <p className={`ml-2 text-sm font-medium ${changeTypeClasses[changeType]}`}>
                {changeType === 'positive' && '+'}{change}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Feature Card Component
const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  action,
  className = '',
  ...props 
}) => {
  return (
    <Card 
      className={`text-center ${className}`} 
      hover={!!action}
      onClick={action}
      {...props}
    >
      <div className="w-16 h-16 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-4">
        <div className="text-primary-600 text-2xl">
          {icon}
        </div>
      </div>
      <CardTitle size="sm" className="mb-2">{title}</CardTitle>
      <CardSubtitle className="text-sm">{description}</CardSubtitle>
    </Card>
  );
};

// Export all components
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Subtitle = CardSubtitle;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Stats = StatsCard;
Card.Feature = FeatureCard;

export { Card, CardHeader, CardTitle, CardSubtitle, CardBody, CardFooter, StatsCard, FeatureCard };
export default Card;