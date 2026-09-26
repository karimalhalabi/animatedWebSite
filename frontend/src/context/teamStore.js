import { createContext, useContext } from "react";
export const TeamContext = createContext(null);
export const useTeam = () => useContext(TeamContext);
