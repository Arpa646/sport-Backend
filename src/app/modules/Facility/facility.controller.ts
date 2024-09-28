import catchAsync from "../../middleware/asynch";
import sendResponse from "../../utils/response";
import { facilityServices } from "./facility.services";
import FacilityModel from "./facility.model";
import { facilityValidationSchema } from "./facility.validation";
import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
const createFacility = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Extracting flat structure from req.body
    const { name, description, pricePerHour, location, } = req.body;

    // Validate facility data using your validation schema
    const validationResult = facilityValidationSchema.safeParse({
      name,
      description,
      pricePerHour,
      location,
      
    });
    console.log(validationResult);

    // Handle validation errors
    if (!validationResult.success) {
      // Collect validation errors
      const validationErrors = validationResult.error.errors.map((error: any) => ({
        path: Array.isArray(error.path) ? error.path.join(".") : error.path,
        message: error.message,
      }));

      // Return validation errors as JSON response
      return res.status(400).json({
        success: false,
        errors: validationErrors,
      });
    }

    // If validation is successful, proceed to create the facility in the database
    const result = await facilityServices.createFacilityIntoDB({
      name,
      description,
      pricePerHour,
      location,
      isDeleted: false, 
    });
    console.log(result);

    // Send response
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Facility created successfully",
      data: result,
    });
  }
);




const getAllFacility = async (req: Request, res: Response) => {
  try {
    const result = await facilityServices.getAllFacilityFromDB();
    if (result && result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Data Found",
        data: [],
      });
    }
    res.status(200).json({
      success: true,
      statusCode: StatusCodes.NOT_FOUND,
      message: "Facility are retrieved succesfully",
      data: result,
    });
  } catch (err) {
    console.log(err);
  }
};

// Get single facility by ID
export const getSingleFacility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Get the facility ID from request params
    console.log(id);
    const facility = await facilityServices.getFacilityByIdFromDB(id);

    if (!facility) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Facility not found",
        data: null,
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Facility retrieved successfully",
      data: facility,
    });
  } catch (err) {
    if (err instanceof Error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Server error",
        error: err.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Unknown server error",
      });
    }
  }
};

const deleteFacility = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    console.log("this is id", id);
    try {
      const result = await facilityServices.deleteFacilityInDB(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          statusCode: StatusCodes.NOT_FOUND,
          message: "No Data Found",
          data: [],
        });
      }
      res.status(200).json({
        success: true,
        message: "Facility deleted successfully",
        data: result,
      });
    } catch (error: unknown) {
      // Type guard to check if error is an instance of Error
      if (error instanceof Error) {
        res.status(500).json({
          success: false,
          message: "Error deleting facility",
          error: error.message,
        });
      } else {
        // Handle unexpected error types
        res.status(500).json({
          success: false,
          message: "Error deleting facility",
          error: "An unexpected error occurred.",
        });
      }
    }
  }
);

const updateFacility = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const updateData = req.body;
    const result = await facilityServices.updateFacilityInDB(id, updateData);
    console.log("up", result);
    if (!result) {
      return res.status(404).json({
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        message: "No Data Found",
        data: [],
      });
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Facility updated successfully",
      data: result,
    });
  }
);

export const facilityController = {
  createFacility,
  getAllFacility,
  updateFacility,
  deleteFacility,
  getSingleFacility,
};
