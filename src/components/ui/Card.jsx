import React from 'react';
import styles from './Card.module.css';

const Card = ({ children, className = '', noPadding = false, ...props }) => {
  return (
    <div 
      className={`${styles.card} ${noPadding ? '' : styles.withPadding} ${className}`.trim()} 
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
