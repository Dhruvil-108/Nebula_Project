import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * The CRM module is now composed of dedicated sub-pages
 * (Leads, Pipeline, Contacts, Companies, Deals).
 * This legacy route redirects to the default CRM view.
 */
const CrmPage: React.FC = () => <Navigate to="/dashboard/crm/leads" replace />;

export default CrmPage;
