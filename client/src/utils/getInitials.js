/**
 * Get user initials from full name for avatar fallback
 * @param {string} name - Full name (e.g. "John Doe")
 * @returns {string} Initials (e.g. "JD") or "?" if no name
 */
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return "?";
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (
    parts[0].charAt(0).toUpperCase() + 
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
};

