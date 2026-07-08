import React from 'react';
import styles from './Input.module.css';

const Input = ({ className = '', fullWidth = false, ...props }) => {
  const handleWheel = (e) => {
    if (props.type === 'number') {
      e.target.blur();
    }
  };

  return (
    <input 
      className={`${styles.input} ${fullWidth ? styles.fullWidth : ''} ${className}`.trim()} 
      onWheel={handleWheel}
      {...props}
    />
  );
};

export default Input;
