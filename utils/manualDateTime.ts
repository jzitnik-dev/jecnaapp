// Manuální úprava času a dne pro testování
export const useCustomDate = false;

// Manuální hodnoty pro čas a den
export const customDay = 1; // den v týdnu (1-7, kde 1 = pondělí)
export const customHour = 10; // hodina (0-23)
export const customMinute = 4; // minuta (0-59)

// Funkce pro získání aktuálního nebo custom času
export const getCurrentDateTime = () => {
  if (useCustomDate) {
    const now = new Date();
    const customDate = new Date();
    
    // Nastav den v týdnu
    const currentDay = now.getDay();
    const targetDay = customDay;
    const daysDiff = targetDay - currentDay;
    customDate.setDate(now.getDate() + daysDiff);
    
    // Nastav čas
    customDate.setHours(customHour, customMinute, 0, 0);
    
    return customDate;
  }
  
  return new Date();
}; 