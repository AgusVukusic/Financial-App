import React from 'react';
import styles from './Select.module.css';

const Select = ({ className = '', fullWidth = false, children, ...props }) => {
  return (
    <select 
      className={`${styles.select} ${fullWidth ? styles.fullWidth : ''} ${className}`.trim()} 
      {...props}
    >
      {children}
    </select>
  );
};

export default Select;
