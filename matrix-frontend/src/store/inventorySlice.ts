import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Metal, RateType, CommonList, Attribute, DaybookGroup, Daybook } from "@/api/inventory";
import { getMasterData } from "@/api/inventory";

interface InventoryState {
  metals: Metal[];
  rateTypes: RateType[];
  commonLists: CommonList[];
  attributes: Attribute[];
  daybookGroups: DaybookGroup[];
  daybooks: Daybook[];
  isMasterDataLoaded: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: InventoryState = {
  metals: [],
  rateTypes: [],
  commonLists: [],
  attributes: [],
  daybookGroups: [],
  daybooks: [],
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
        state.metals = action.payload.metals || [];
        state.rateTypes = action.payload.rateTypes || [];
        state.commonLists = action.payload.commonLists || [];
        state.attributes = action.payload.attributes || [];
        state.daybookGroups = action.payload.daybookGroups || [];
        state.daybooks = action.payload.daybooks || [];
        state.isMasterDataLoaded = true;
      })
      .addCase(fetchMasterData.rejected, (state) => {
        state.status = "failed";
      });
  },
});

export default inventorySlice.reducer;
