import React from 'react';
import { FloatingDropdown, type FloatingDropdownProps, type DropdownOption } from './FloatingDropdown';

export type { DropdownOption };
export interface SelectProps<T = string> extends FloatingDropdownProps<T> {}

export function Select<T = string>(props: SelectProps<T>) {
  return <FloatingDropdown<T> {...props} />;
}

export default Select;
