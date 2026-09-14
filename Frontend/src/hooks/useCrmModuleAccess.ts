import { useModuleAccess } from './useModuleAccess';

/**
 * Convenience hook specifically for the CRM module, powered by the generic useModuleAccess hook.
 */
export const useCrmModuleAccess = (): { hasModuleAccess: boolean; isLoading: boolean } => {
  const { hasAccess, isLoading } = useModuleAccess('crm');
  return { hasModuleAccess: hasAccess, isLoading };
};
