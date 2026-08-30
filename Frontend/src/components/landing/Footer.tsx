import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowUpRight 
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-900">
          
          {/* Brand Info (2 cols on md) */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1px]">
                <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <div className="w-3.5 h-3.5 rounded-sm bg-gradient-to-br from-indigo-500 to-cyan-400 transform rotate-45" />
                </div>
              </div>
              <span className="font-bold text-base text-white">Nebula Hub</span>
            </Link>
            
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              The unified business operating system that replaces disconnected SaaS stacks with one seamless data fabric for CRM, HRMS, Recruitment, Expenses, Inventory, and AI Analytics.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <Badge variant="emerald" size="sm" dot>System Status: 100% Operational</Badge>
            </div>
          </div>

          {/* Column 1: Core Modules */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">Core Modules</h4>
            <ul className="space-y-2">
              <li><a href="#modules" className="hover:text-white transition-colors">CRM & Pipeline</a></li>
              <li><a href="#modules" className="hover:text-white transition-colors">HRMS & People Ops</a></li>
              <li><a href="#modules" className="hover:text-white transition-colors">Recruitment (ATS)</a></li>
              <li><a href="#modules" className="hover:text-white transition-colors">Expense Approvals</a></li>
              <li><a href="#modules" className="hover:text-white transition-colors">Inventory & Stock</a></li>
              <li><a href="#analytics" className="hover:text-white transition-colors">Unified AI Analytics</a></li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">By Persona</h4>
            <ul className="space-y-2">
              <li><a href="#roles" className="hover:text-white transition-colors">For Founders & CEOs</a></li>
              <li><a href="#roles" className="hover:text-white transition-colors">For Sales Leaders</a></li>
              <li><a href="#roles" className="hover:text-white transition-colors">For People Ops & HR</a></li>
              <li><a href="#roles" className="hover:text-white transition-colors">For Finance & Ops</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Enterprise Security</a></li>
            </ul>
          </div>

          {/* Column 3: Platform & Auth */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">Account & Access</h4>
            <ul className="space-y-2">
              <li><Link to="/signup" className="hover:text-indigo-400 font-medium transition-colors flex items-center gap-1">Create Workspace <ArrowUpRight className="w-3 h-3" /></Link></li>
              <li><Link to="/signin" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><a href="#security" className="hover:text-white transition-colors">Multi-Tenant RBAC</a></li>
              <li><a href="#comparison" className="hover:text-white transition-colors">Migration Guide</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
          <div>
            © {new Date().getFullYear()} Nebula Hub Inc. All rights reserved. Manage → Analyze → Automate.
          </div>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-200 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Security Architecture</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Cookie Settings</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
