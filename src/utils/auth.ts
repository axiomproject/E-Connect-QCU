// Function to get the auth header for API requests

export const getAuthHeader = () => {

    const token = localStorage.getItem('token');
  
    return {
  
      headers: {
  
        Authorization: token ? `Bearer ${token}` : ''
  
      }
  
    };
  
  };

// Add a new function to calculate environmental impact

export const calculateEnvironmentalImpact = (carbonSaved: number) => {
  return {
    carbonSaved,
    waterSaved: carbonSaved * 50, // Rough estimate: 50L water per kg CO2
    wasteDiverted: carbonSaved * 0.2, // Rough estimate: 0.2kg waste per kg CO2
    energySaved: carbonSaved * 5, // Rough estimate: 5kWh per kg CO2
    treesEquivalent: Math.round(carbonSaved / 20) // Rough estimate: 1 tree absorbs ~20kg CO2/year
  };
};
