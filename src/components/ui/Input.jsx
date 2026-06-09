import React from 'react';
import styles from './Input.module.css';

const Input = ({ className = '', fullWidth = false, ...props }) => {
  return (
    <input 
      className={`${styles.input} ${fullWidth ? styles.fullWidth : ''} ${className}`.trim()} 
      {...props}
    />
  );
};

export default Input;
