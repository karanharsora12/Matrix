import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Metal, RateType, CommonList } from "@/api/inventory";
import { getMasterData } from "@/api/inventory";

interface InventoryState {
  metals: Metal[];
  rateTypes: RateType[];
  commonLists: CommonList[];
  isMasterDataLoaded: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: InventoryState = {
  metals: [],
  rateTypes: [],
  commonLists: [],
  isMasterDataLoaded: false,
  status: "idle",
};

export const fetchMasterData = createAsyncThunk(
  "inventory/fetchMasterData",
  async () => {
    const data = await getMasterData();
    return data;
  }
);

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMasterData.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMasterData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.metals = action.payload.metals;
        state.rateTypes = action.payload.rateTypes;
        state.commonLists = action.payload.commonLists;
        state.isMasterDataLoaded = true;
      })
      .addCase(fetchMasterData.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default inventorySlice.reducer;
