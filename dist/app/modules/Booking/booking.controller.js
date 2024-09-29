"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingController = void 0;
const asynch_1 = __importDefault(require("../../middleware/asynch"));
const response_1 = __importDefault(require("../../utils/response"));
const booking_services_1 = require("./booking.services");
const booking_validation_1 = require("./booking.validation");
const http_status_codes_1 = require("http-status-codes");
const createBooking = (0, asynch_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Extracting flat structure from req.body
    const { facility, date, startTime, endTime, payableAmount } = req.body;
    // Validate booking data using your validation schema
    const validationResult = booking_validation_1.bookingValidationSchema.safeParse({
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
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            errors: validationErrors,
        });
    }
    // If validation succeeds, create booking in the database
    const result = yield booking_services_1.bookingServices.createBookingIntoDB({
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
    (0, response_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Booking created successfully",
        data: result,
    });
    // Optionally, initiate payment (if required)
    // await initiatePayment();
}));
const getAllBookings = (0, asynch_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // sendResponse(res, {
    //   statusCode: StatusCodes.OK,
    //   success: true,
    //   message: "Bookings retrieved successfully",
    //   data: result,
    // });
    try {
        const result = yield booking_services_1.bookingServices.getAllBookingsFromDB();
        if (!result || result.length === 0) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: "No bookings found",
                data: [],
            });
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Facility retrieved successfully",
            data: result,
        });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Server error",
                error: err.message,
            });
        }
        else {
            res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: "Unknown server error",
            });
        }
    }
}));
const getBookingsByEmail = (0, asynch_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { useremail } = req.user;
    const result = yield booking_services_1.bookingServices.findBookingsByUserId(useremail);
    if (result.length === 0) {
        return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
            success: false,
            message: "No bookings found",
            data: [],
        });
    }
    (0, response_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Bookings retrieved successfully",
        data: result,
    });
}));
const cancelBooking = (0, asynch_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield booking_services_1.bookingServices.BookingCancle(id);
    if (!result) {
        return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
            success: false,
            message: "Booking not found",
        });
    }
    (0, response_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Booking canceled successfully",
        data: result,
    });
}));
exports.bookingController = {
    createBooking,
    getAllBookings,
    getBookingsByEmail,
    cancelBooking,
};
