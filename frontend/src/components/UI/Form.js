import React, { forwardRef } from 'react';

// Input Component
const Input = forwardRef(({
  type = 'text',
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = false,
  size = 'default',
  variant = 'default',
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const baseClasses = 'block w-full rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    default: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };
  
  const variantClasses = {
    default: error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    filled: error
      ? 'bg-red-50 border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'bg-gray-50 border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    outlined: error
      ? 'bg-transparent border-2 border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'bg-transparent border-2 border-gray-300 focus:border-primary-500 focus:ring-primary-500'
  };
  
  const disabledClasses = disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : '';
  const fullWidthClass = fullWidth ? 'w-full' : '';
  
  const inputClasses = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabledClasses,
    leftIcon ? 'pl-10' : '',
    rightIcon ? 'pr-10' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={`${fullWidthClass} ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{leftIcon}</span>
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          disabled={disabled}
          required={required}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{rightIcon}</span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Textarea Component
const Textarea = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = false,
  rows = 4,
  resize = 'vertical',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const baseClasses = 'block w-full rounded-lg border border-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
  
  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  };
  
  const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '';
  const disabledClasses = disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : '';
  const fullWidthClass = fullWidth ? 'w-full' : '';
  
  const textareaClasses = [
    baseClasses,
    'px-4 py-3 text-base',
    resizeClasses[resize],
    errorClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={`${fullWidthClass} ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        rows={rows}
        className={textareaClasses}
        disabled={disabled}
        required={required}
        {...props}
      />
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

// Select Component
const Select = forwardRef(({
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = false,
  placeholder = 'Select an option',
  options = [],
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const baseClasses = 'block w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';
  
  const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '';
  const disabledClasses = disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : '';
  const fullWidthClass = fullWidth ? 'w-full' : '';
  
  const selectClasses = [
    baseClasses,
    errorClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={`${fullWidthClass} ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          className={selectClasses}
          disabled={disabled}
          required={required}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// Checkbox Component
const Checkbox = forwardRef(({
  label,
  error,
  helperText,
  disabled = false,
  size = 'default',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  const baseClasses = 'rounded border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2 focus:ring-offset-2 transition-colors duration-200';
  const errorClasses = error ? 'border-red-300 focus:ring-red-500' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  const checkboxClasses = [
    baseClasses,
    sizeClasses[size],
    errorClasses,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClassName}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="checkbox"
            className={checkboxClasses}
            disabled={disabled}
            {...props}
          />
        </div>
        
        {label && (
          <div className="ml-3 text-sm">
            <label className={`font-medium text-gray-700 ${disabledClasses}`}>
              {label}
            </label>
            {helperText && !error && (
              <p className="text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// Radio Component
const Radio = forwardRef(({
  label,
  error,
  helperText,
  disabled = false,
  size = 'default',
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6'
  };
  
  const baseClasses = 'border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2 focus:ring-offset-2 transition-colors duration-200';
  const errorClasses = error ? 'border-red-300 focus:ring-red-500' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  const radioClasses = [
    baseClasses,
    sizeClasses[size],
    errorClasses,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClassName}>
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="radio"
            className={radioClasses}
            disabled={disabled}
            {...props}
          />
        </div>
        
        {label && (
          <div className="ml-3 text-sm">
            <label className={`font-medium text-gray-700 ${disabledClasses}`}>
              {label}
            </label>
            {helperText && !error && (
              <p className="text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Radio.displayName = 'Radio';

// Radio Group Component
const RadioGroup = ({
  label,
  error,
  helperText,
  required = false,
  options = [],
  value,
  onChange,
  name,
  disabled = false,
  orientation = 'vertical',
  className = '',
  ...props
}) => {
  const orientationClasses = {
    vertical: 'space-y-3',
    horizontal: 'flex space-x-6'
  };
  
  return (
    <div className={className} {...props}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className={orientationClasses[orientation]}>
        {options.map((option, index) => (
          <Radio
            key={index}
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            label={option.label}
            disabled={disabled || option.disabled}
            error={error}
          />
        ))}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

// Switch Component
const Switch = forwardRef(({
  label,
  error,
  helperText,
  disabled = false,
  size = 'default',
  checked = false,
  onChange,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const sizeClasses = {
    sm: {
      switch: 'h-5 w-9',
      thumb: 'h-4 w-4',
      translate: 'translate-x-4'
    },
    default: {
      switch: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5'
    },
    lg: {
      switch: 'h-7 w-12',
      thumb: 'h-6 w-6',
      translate: 'translate-x-5'
    }
  };
  
  const config = sizeClasses[size];
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  return (
    <div className={containerClassName}>
      <div className="flex items-center">
        <button
          ref={ref}
          type="button"
          className={`${config.switch} relative inline-flex items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
            checked ? 'bg-primary-600' : 'bg-gray-200'
          } ${disabledClasses} ${className}`}
          disabled={disabled}
          onClick={() => onChange && onChange(!checked)}
          {...props}
        >
          <span
            className={`${config.thumb} inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              checked ? config.translate : 'translate-x-0'
            }`}
          />
        </button>
        
        {label && (
          <span className={`ml-3 text-sm font-medium text-gray-700 ${disabledClasses}`}>
            {label}
          </span>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Switch.displayName = 'Switch';

// Label Component
const Label = ({ children, required = false, className = '', htmlFor, ...props }) => {
  return (
    <label 
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 mb-2 ${className}`} 
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};

// FormGroup Component
const FormGroup = ({ children, className = '', ...props }) => {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Form Row Component
const FormRow = ({ children, className = '', ...props }) => {
  return (
    <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${className}`} {...props}>
      {children}
    </div>
  );
};

// Export all components
export {
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  Label,
  FormGroup,
  FormRow
};

export default {
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  Label,
  Group: FormGroup,
  FormGroup,
  FormRow
};