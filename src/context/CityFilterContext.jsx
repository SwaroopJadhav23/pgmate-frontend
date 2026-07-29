import {createContext, useContext, useState} from "react";

const CityFilterContext = createContext(null);

export const CityFilterProvider = ({children}) => {
  const [selectedCity, setSelectedCity] = useState(
    localStorage.getItem("userCity") || "Pune",
  );

  return (
    <CityFilterContext.Provider value={{selectedCity, setSelectedCity}}>
      {children}
    </CityFilterContext.Provider>
  );
};

export const useCityFilter = () => useContext(CityFilterContext);
