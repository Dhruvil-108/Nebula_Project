# Nebula HRMS — Enterprise ERP Transformation Roadmap & Index

**Version:** 2.0.0 (Production-Verified)  
**Status:** All 6 Phases Completed  
**Design Standard:** Nebula Premium Light 2.0  

---

## 1. Overview of Completed ERP Phases

| Phase | Title | Key Deliverables | Status | Documentation |
|---|---|---|---|---|
| **Phase 0** | **Backend Foundation & Dual-Key Identity** | • Canonical `user` + `employee` dual-key resolver<br>• Automated data migration script<br>• Multi-tenant identity bridge | **Completed** | [Phase 0 Summary](file:///c:/Users/DHRUVIL/OneDrive/Documents/Charusat%20CSPIT/CSE%20SEM%207/Minor%20Project/Nebula_Project/docs/hrms-erp/phase-0-foundation/SUMMARY.md) |
| **Phase 1** | **Advanced Attendance & Multi-Shift Rostering** | • Multi-shift schemas & rotational shifts<br>• Grace periods & half-day cutoffs<br>• Missed punch dispute & regularization workflow<br>• Overtime compensatory off (comp-off) engine | **Completed** | [Phase 1 Summary](file:///c:/Users/DHRUVIL/OneDrive/Documents/Charusat%20CSPIT/CSE%20SEM%207/Minor%20Project/Nebula_Project/docs/hrms-erp/phase-1-attendance/SUMMARY.md) |
| **Phase 2** | **Enterprise Leave Policy & Accruals Engine** | • Sandwich policy rule detection<br>• Background monthly pro-rata accruals<br>• Leave encashment claims & payroll links<br>• Immutable transactional `LeaveLedger` | **Completed** | [Phase 2 Summary](file:///c:/Users/DHRUVIL/OneDrive/Documents/Charusat%20CSPIT/CSE%20SEM%207/Minor%20Project/Nebula_Project/docs/hrms-erp/phase-2-leave-policy/SUMMARY.md) |
| **Phase 3** | **360° Employee Dossier & Org Chart** | • 6-tab comprehensive personnel dossier<br>• Branch locations & global HQ management<br>• Standardized designations & `L1`–`L7` pay grade bands<br>• Historical career progression audit (`JobHistory`)<br>• Interactive visual hierarchical org chart | **Completed** | [Phase 3 Summary](file:///c:/Users/DHRUVIL/OneDrive/Documents/Charusat%20CSPIT/CSE%20SEM%207/Minor%20Project/Nebula_Project/docs/hrms-erp/phase-3-dossier-orgchart/SUMMARY.md) |
| **Phase 4** | **Enterprise Payroll & Statutory Compliance** | • Grade-aware CTC compensation structures<br>• Attendance-driven LOP (loss-of-pay) deductions<br>• Monthly batch payroll cycles (`draft → approved → paid`)<br>• Dynamic line-item bonus/deduction adjustments<br>• Native vector PDF payslip streaming via `pdfkit` | **Completed** | [Phase 4 Summary](file:///c:/Users/DHRUVIL/OneDrive/Documents/Charusat%20CSPIT/CSE%20SEM%207/Minor%20Project/Nebula_Project/docs/hrms-erp/phase-4-payroll/SUMMARY.md) |
| **Phase 5** | **Performance, OKRs & HR AI Copilot** | • Goals & OKRs with weighted key results<br>• 360° appraisal cycles (self, manager, peer reviews)<br>• Interactive 3×3 9-box talent calibration matrix<br>• Predictive attrition risk radar with driver alerts<br>• Embedded natural-language HR AI Copilot | **Completed** | [Phase 5 Summary](file:///c:/Users/DHRUVIL/OneDrive/Documents/Charusat%20CSPIT/CSE%20SEM%207/Minor%20Project/Nebula_Project/docs/hrms-erp/phase-5-performance-copilot/SUMMARY.md) |

---

## 2. Core Documentation Links

- **Main HRMS Module Architecture:** [HRMS_MODULE_DOCUMENTATION.md](file:///c:/Users/DHRUVIL/OneDrive/Documents/Charusat%20CSPIT/CSE%20SEM%207/Minor%20Project/Nebula_Project/HRMS_MODULE_DOCUMENTATION.md)
- **Overall Project Architecture:** [PROJECT_DOCUMENTATION.md](file:///c:/Users/DHRUVIL/OneDrive/Documents/Charusat%20CSPIT/CSE%20SEM%207/Minor%20Project/Nebula_Project/PROJECT_DOCUMENTATION.md)
- **UI Design System Guide:** [00-discovery.md](file:///c:/Users/DHRUVIL/OneDrive/Documents/Charusat%20CSPIT/CSE%20SEM%207/Minor%20Project/Nebula_Project/docs/hrms-erp/00-discovery.md)
