import React from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, icon }) => {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <div className="page-title-wrapper">
          {icon && <span className="page-header-icon">{icon}</span>}
          <h1 className="page-title">{title}</h1>
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
};

export default PageHeader;
