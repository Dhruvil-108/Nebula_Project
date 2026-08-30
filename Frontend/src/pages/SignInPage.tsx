import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { SignInForm } from '../components/auth/SignInForm';

export const SignInPage: React.FC = () => {
  return (
    <AuthLayout
      title="Welcome back to Nebula"
      subtitle="Sign in with your work credentials to access your organization workspace."
      quote={{
        text: "Having CRM, HRMS, and Inventory in one single place gives us immediate cross-functional clarity. We can't imagine running operations any other way.",
        author: "Sarah Jenkins",
        role: "Chief Technology Officer",
        org: "Nexus Global Logistics"
      }}
    >
      <SignInForm />
    </AuthLayout>
  );
};
