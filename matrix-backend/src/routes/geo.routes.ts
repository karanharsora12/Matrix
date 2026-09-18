import { Router } from "express";
import { geoController } from "../controllers/geo.controller";

const router = Router();

// Countries
router.post("/countries", geoController.getCountries);
router.get("/countries/:id", geoController.getCountryById);
router.post("/countries/create", geoController.createCountry);
router.put("/countries/:id", geoController.updateCountry);
router.delete("/countries/:id", geoController.deleteCountry);

// States
router.post("/states", geoController.getStates);
router.get("/states/:id", geoController.getStateById);
router.post("/states/create", geoController.createState);
router.put("/states/:id", geoController.updateState);
router.delete("/states/:id", geoController.deleteState);

// Cities
router.post("/cities", geoController.getCities);
router.get("/cities/:id", geoController.getCityById);
router.post("/cities/create", geoController.createCity);
router.put("/cities/:id", geoController.updateCity);
router.delete("/cities/:id", geoController.deleteCity);

// Areas
router.post("/areas", geoController.getAreas);
router.get("/areas/:id", geoController.getAreaById);
router.post("/areas/create", geoController.createArea);
router.put("/areas/:id", geoController.updateArea);
router.delete("/areas/:id", geoController.deleteArea);

// Pincodes
router.post("/pincodes", geoController.getPincodes);
router.get("/pincodes/:id", geoController.getPincodeById);
router.post("/pincodes/create", geoController.createPincode);
router.put("/pincodes/:id", geoController.updatePincode);
router.delete("/pincodes/:id", geoController.deletePincode);

export default router;
