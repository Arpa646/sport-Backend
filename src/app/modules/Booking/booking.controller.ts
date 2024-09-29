import catchAsync from "../../middleware/asynch";
import sendResponse from "../../utils/response";
import { bookingServices } from "./booking.services";
import { bookingValidationSchema } from "./booking.validation";
import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import axios from "axios";

const createBooking = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Extracting flat structure from req.body
    const { facility, date, startTime, endTime, payableAmount } = req.body;

    // Validate booking data using your validation schema
    const validationResult = bookingValidationSchema.safeParse({
      facility,
      date,
      startTime,
      endTime,
      payableAmount,
    });

    // Handle validation errors
    if (!validationResult.success) {
      const validationErrors = validationResult.error.errors.map((error) => ({
        path: error.path.join("."), // Joining path for error clarity
        message: error.message,
      }));

      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        errors: validationErrors,
      });
    }

    // If validation succeeds, create booking in the database
    const result = await bookingServices.createBookingIntoDB(
      {
        facility,
        date,
        startTime,
        endTime,
        payableAmount,

        user: req.user.useremail,
      }
      // User email from request (assumed middleware for authentication)
    );

    console.log("Booking result:", result);

    // Send success response
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Booking created successfully",
      data: result,
    });

    // Optionally, initiate payment (if required)
    // await initiatePayment();
  }
);

const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  // sendResponse(res, {
  //   statusCode: StatusCodes.OK,
  //   success: true,
  //   message: "Bookings retrieved successfully",
  //   data: result,
  // });
  try {
    const result = await bookingServices.getAllBookingsFromDB();

    if (!result || result.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "No bookings found",
        data: [],
      });
    }
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Facility retrieved successfully",
      data: result,
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
});

const getBookingsByEmail = catchAsync(async (req: Request, res: Response) => {
  const { useremail } = req.user;

  const result = await bookingServices.findBookingsByUserId(useremail);

  if (result.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "No bookings found",
      data: [],
    });
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Bookings retrieved successfully",
    data: result,
  });
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await bookingServices.BookingCancle(id);

  if (!result) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "Booking not found",
    });
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Booking canceled successfully",
    data: result,
  });
});

export const bookingController = {
  createBooking,
  getAllBookings,
  getBookingsByEmail,
  cancelBooking,
};
