import { create } from "zustand";

const useLocationStore = create((set) => ({
    searchTerm: "",
    setSearchTerm: (term) => set({ searchTerm: term }),
    })
);

export default useLocationStore;