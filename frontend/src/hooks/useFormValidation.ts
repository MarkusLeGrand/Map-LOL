import { useState } from 'react';

export interface ValidationRule {
  required?: { value: boolean; message: string };
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  custom?: { validate: (value: string) => boolean; message: string };
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export function useFormValidation<T extends Record<string, string>>(rules: ValidationRules) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = (name: keyof T, value: string): string | null => {
    const rule = rules[name as string];
    if (!rule) return null;

    // Required validation
    if (rule.required?.value && !value.trim()) {
      return rule.required.message;
    }

    // Min length validation
    if (rule.minLength && value.length < rule.minLength.value) {
      return rule.minLength.message;
    }

    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength.value) {
      return rule.maxLength.message;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.value.test(value)) {
      return rule.pattern.message;
    }

    // Custom validation
    if (rule.custom && !rule.custom.validate(value)) {
      return rule.custom.message;
    }

    return null;
  };

  const validateField = (name: keyof T, value: string) => {
    const error = validate(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error || undefined
    }));
    return error === null;
  };

  const validateAll = (values: T): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(rules).forEach(key => {
      const error = validate(key as keyof T, values[key] || '');
      if (error) {
        newErrors[key as keyof T] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const clearErrors = () => setErrors({});

  const clearError = (name: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  return {
    errors,
    validateField,
    validateAll,
    clearErrors,
    clearError
  };
}
