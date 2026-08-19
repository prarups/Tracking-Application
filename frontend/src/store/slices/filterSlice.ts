import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FilterState {
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  viewMode: 'ag-grid' | 'kanban' | 'calendar' | 'timeline';
  isSearchModalOpen: boolean;
}

const initialState: FilterState = {
  searchQuery: '',
  statusFilter: '',
  priorityFilter: '',
  viewMode: 'ag-grid',
  isSearchModalOpen: false,
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.statusFilter = action.payload;
    },
    setPriorityFilter: (state, action: PayloadAction<string>) => {
      state.priorityFilter = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'ag-grid' | 'kanban' | 'calendar' | 'timeline'>) => {
      state.viewMode = action.payload;
    },
    setIsSearchModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isSearchModalOpen = action.payload;
    },
  },
});

export const { setSearchQuery, setStatusFilter, setPriorityFilter, setViewMode, setIsSearchModalOpen } = filterSlice.actions;
export default filterSlice.reducer;
