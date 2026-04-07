// Input validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

export const validatePassword = (password: string): boolean => {
  return password && password.length >= 6 && password.length <= 255;
};

export const validateLeaveType = (type: string): boolean => {
  const validTypes = ['Casual Leave', 'Sick Leave', 'Special Leave', 'Duty Leave'];
  return validTypes.includes(type);
};

export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate < endDate && startDate.getTime() >= Date.now() - 86400000; // Allow today or later
};

export const validateReason = (reason: string): boolean => {
  return reason && reason.trim().length > 0 && reason.length <= 2000;
};

export const validateAssignmentInput = (title: string, description: string, dueDate: string): boolean => {
  return (
    title && title.trim().length > 0 && title.length <= 255 &&
    description && description.length <= 5000 &&
    validateDate(dueDate) &&
    new Date(dueDate) > new Date()
  );
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '').slice(0, 255);
};

export const sanitizeReason = (str: string): string => {
  return str.trim().slice(0, 2000);
};
