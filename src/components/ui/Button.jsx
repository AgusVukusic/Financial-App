import React from 'react';
import styles from './Button.module.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isIcon = false,
  ...props 
}) => {
  const baseClass = styles.btn;
  const variantClass = styles[`btn-${variant}`] || styles['btn-primary'];
  const sizeClass = styles[`size-${size}`] || styles['size-md'];
  const iconClass = isIcon ? styles.iconBtn : '';

  return (
    <button 
      className={`${baseClass} ${variantClass} ${sizeClass} ${iconClass} ${className}`.trim()} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
