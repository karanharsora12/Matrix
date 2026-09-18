import type { Request, Response } from "express";
import { geoService } from "../services/geo.service";
import {
  getPaginationOptions,
  buildPaginatedResponse,
  buildListResponse,
  buildMasterResponse,
} from "../utils/pagination";

// ─── Helper: parse optional boolean from request body ────────────────────────

function parseIsActive(body: any): boolean | undefined {
  if (body?.isActive === true || body?.isActive === "true") return true;
  if (body?.isActive === false || body?.isActive === "false") return false;
  return undefined;
}

// ─── Countries ────────────────────────────────────────────────────────────────

export class GeoController {
  // Countries
  async getCountries(req: Request, res: Response) {
    try {
      const options = getPaginationOptions(req);
      const isActive = parseIsActive(req.body);
      const result = await geoService.getCountries({ ...options, isActive });

      if (options.isPaginated) {
        return res.json(buildPaginatedResponse(req, "countries", result));
      }
      return res.json(buildListResponse(req, "countries", result.data));
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getCountryById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.getCountryById(id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "Country not found" });
      return res.json(buildMasterResponse(req, "country", data));
    } catch (error) {
      console.error("Error fetching country:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async createCountry(req: Request, res: Response) {
    try {
      const { name, code, phoneCode, isActive } = req.body;
      if (!name?.trim())
        return res
          .status(400)
          .json({ success: false, error: "Country name is required" });
      const data = await geoService.createCountry({
        name,
        code,
        phoneCode,
        isActive,
      });
      return res.status(201).json(
        buildMasterResponse(req, "country", data, {
          message: "Country created successfully",
        }),
      );
    } catch (error: any) {
      if (error?.code === "23505")
        return res
          .status(409)
          .json({ success: false, error: "Country already exists" });
      console.error("Error creating country:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async updateCountry(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.updateCountry(id, req.body);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "Country not found" });
      return res.json(
        buildMasterResponse(req, "country", data, {
          message: "Country updated successfully",
        }),
      );
    } catch (error) {
      console.error("Error updating country:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async deleteCountry(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.deleteCountry(id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "Country not found" });
      return res.json({
        success: true,
        message: "Country deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting country:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  // States
  async getStates(req: Request, res: Response) {
    try {
      const options = getPaginationOptions(req);
      const countryId = req.body?.countryId
        ? Number(req.body.countryId)
        : undefined;
      const isActive = parseIsActive(req.body);
      const result = await geoService.getStates({
        ...options,
        countryId,
        isActive,
      });

      if (options.isPaginated) {
        return res.json(buildPaginatedResponse(req, "states", result));
      }
      return res.json(buildListResponse(req, "states", result.data));
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getStateById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.getStateById(id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "State not found" });
      return res.json(buildMasterResponse(req, "state", data));
    } catch (error) {
      console.error("Error fetching state:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async createState(req: Request, res: Response) {
    try {
      const { name, countryId, code, isActive } = req.body;
      if (!name?.trim())
        return res
          .status(400)
          .json({ success: false, error: "State name is required" });
      if (!countryId)
        return res
          .status(400)
          .json({ success: false, error: "countryId is required" });
      const data = await geoService.createState({
        name,
        countryId: Number(countryId),
        code,
        isActive,
      });
      return res.status(201).json(
        buildMasterResponse(req, "state", data, {
          message: "State created successfully",
        }),
      );
    } catch (error) {
      console.error("Error creating state:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async updateState(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.updateState(id, req.body);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "State not found" });
      return res.json(
        buildMasterResponse(req, "state", data, {
          message: "State updated successfully",
        }),
      );
    } catch (error) {
      console.error("Error updating state:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async deleteState(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.deleteState(id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "State not found" });
      return res.json({ success: true, message: "State deleted successfully" });
    } catch (error) {
      console.error("Error deleting state:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  // Cities
  async getCities(req: Request, res: Response) {
    try {
      const options = getPaginationOptions(req);
      const stateId = req.body?.stateId ? Number(req.body.stateId) : undefined;
      const isActive = parseIsActive(req.body);
      const result = await geoService.getCities({
        ...options,
        stateId,
        isActive,
      });

      if (options.isPaginated) {
        return res.json(buildPaginatedResponse(req, "cities", result));
      }
      return res.json(buildListResponse(req, "cities", result.data));
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getCityById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.getCityById(id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "City not found" });
      return res.json(buildMasterResponse(req, "city", data));
    } catch (error) {
      console.error("Error fetching city:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async createCity(req: Request, res: Response) {
    try {
      const { name, stateId, isActive } = req.body;
      if (!name?.trim())
        return res
          .status(400)
          .json({ success: false, error: "City name is required" });
      if (!stateId)
        return res
          .status(400)
          .json({ success: false, error: "stateId is required" });
      const data = await geoService.createCity({
        name,
        stateId: Number(stateId),
        isActive,
      });
      return res.status(201).json(
        buildMasterResponse(req, "city", data, {
          message: "City created successfully",
        }),
      );
    } catch (error) {
      console.error("Error creating city:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async updateCity(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.updateCity(id, req.body);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "City not found" });
      return res.json(
        buildMasterResponse(req, "city", data, {
          message: "City updated successfully",
        }),
      );
    } catch (error) {
      console.error("Error updating city:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async deleteCity(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.deleteCity(id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "City not found" });
      return res.json({ success: true, message: "City deleted successfully" });
    } catch (error) {
      console.error("Error deleting city:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  // Areas
  async getAreas(req: Request, res: Response) {
    try {
      const options = getPaginationOptions(req);
      const cityId = req.body?.cityId ? Number(req.body.cityId) : undefined;
      const isActive = parseIsActive(req.body);
      const result = await geoService.getAreas({
        ...options,
        cityId,
        isActive,
      });

      if (options.isPaginated) {
        return res.json(buildPaginatedResponse(req, "areas", result));
      }
      return res.json(buildListResponse(req, "areas", result.data));
    } catch (error) {
      console.error("Error fetching areas:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getAreaById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.getAreaById(id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "Area not found" });
      return res.json(buildMasterResponse(req, "area", data));
    } catch (error) {
      console.error("Error fetching area:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async createArea(req: Request, res: Response) {
    try {
      const { name, cityId, isActive } = req.body;
      if (!name?.trim())
        return res
          .status(400)
          .json({ success: false, error: "Area name is required" });
      if (!cityId)
        return res
          .status(400)
          .json({ success: false, error: "cityId is required" });
      const data = await geoService.createArea({
        name,
        cityId: Number(cityId),
        isActive,
      });
      return res.status(201).json(
        buildMasterResponse(req, "area", data, {
          message: "Area created successfully",
        }),
      );
    } catch (error) {
      console.error("Error creating area:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async updateArea(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.updateArea(id, req.body);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "Area not found" });
      return res.json(
        buildMasterResponse(req, "area", data, {
          message: "Area updated successfully",
        }),
      );
    } catch (error) {
      console.error("Error updating area:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async deleteArea(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.deleteArea(id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "Area not found" });
      return res.json({ success: true, message: "Area deleted successfully" });
    } catch (error) {
      console.error("Error deleting area:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  // Pincodes
  async getPincodes(req: Request, res: Response) {
    try {
      const options = getPaginationOptions(req);
      const cityId = req.body?.cityId ? Number(req.body.cityId) : undefined;
      const areaId = req.body?.areaId ? Number(req.body.areaId) : undefined;
      const isActive = parseIsActive(req.body);
      const result = await geoService.getPincodes({
        ...options,
        cityId,
        areaId,
        isActive,
      });

      if (options.isPaginated) {
        return res.json(buildPaginatedResponse(req, "pincodes", result));
      }
      return res.json(buildListResponse(req, "pincodes", result.data));
    } catch (error) {
      console.error("Error fetching pincodes:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async getPincodeById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.getPincodeById(id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "Pincode not found" });
      return res.json(buildMasterResponse(req, "pincode", data));
    } catch (error) {
      console.error("Error fetching pincode:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async createPincode(req: Request, res: Response) {
    try {
      const { pincode, cityId, areaId, officeName, isActive } = req.body;
      if (!pincode?.trim())
        return res
          .status(400)
          .json({ success: false, error: "Pincode is required" });
      if (!cityId)
        return res
          .status(400)
          .json({ success: false, error: "cityId is required" });
      const data = await geoService.createPincode({
        pincode,
        cityId: Number(cityId),
        areaId: areaId ? Number(areaId) : undefined,
        officeName,
        isActive,
      });
      return res.status(201).json(
        buildMasterResponse(req, "pincode", data, {
          message: "Pincode created successfully",
        }),
      );
    } catch (error) {
      console.error("Error creating pincode:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async updatePincode(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.updatePincode(id, req.body);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "Pincode not found" });
      return res.json(
        buildMasterResponse(req, "pincode", data, {
          message: "Pincode updated successfully",
        }),
      );
    } catch (error) {
      console.error("Error updating pincode:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  async deletePincode(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id))
        return res.status(400).json({ success: false, error: "Invalid ID" });
      const data = await geoService.deletePincode(id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, error: "Pincode not found" });
      return res.json({
        success: true,
        message: "Pincode deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting pincode:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }

  // Master data for dropdowns
  async getMasterData(req: Request, res: Response) {
    try {
      const data = await geoService.getMasterData();
      return res.json(buildMasterResponse(req, "geoMasterData", data));
    } catch (error) {
      console.error("Error fetching geo master data:", error);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
}

export const geoController = new GeoController();
