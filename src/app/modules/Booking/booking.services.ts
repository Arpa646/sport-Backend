import { UserRegModel } from "./../Registration/user.model";
import { initiatePayment } from "./payment.utils";
import { startSession, ObjectId } from "mongoose";
import mongoose from "mongoose";

import { Booking } from "./booking.inteface";
import BookingModel from "./booking.model";

import FacilityModel from "../Facility/facility.model";
import { v4 as uuidv4 } from "uuid";

export const createBookingIntoDB = async (
  bookingData: Booking

) => {
  const session = await mongoose.startSession();
 

  const { facility, date, startTime, endTime,user } = bookingData;

  const userInfo = await UserRegModel.findOne({ _id: user });

 
  try {
    session.startTransaction();

   

  

    const facilitdata = await FacilityModel.findOne({ _id: facility }).session(
      session
    );






    if (!facilitdata) {
      throw new Error("No facility found");
    }

    const facilityprice = facilitdata.pricePerHour;
    const queryDate = typeof date === "string" ? new Date(date) : new Date();

    // Check for existing bookings
    const existingBookings = await BookingModel.find({
      facility,
      date: queryDate,
      startTime,
      endTime,
    }).session(session);

    if (existingBookings.length > 0) {
      throw new Error(
        "Facility is unavailable during the requested time slot."
      );
    }

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const durationInHours =
      (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60;
    const price = durationInHours * facilityprice;
    const transactionid = uuidv4();
    // Initialize booking object
    const newBooking = new BookingModel({
      facility,
      date: queryDate,
      startTime,
      endTime,
      user,
      payableAmount: price,
      isBooked: "confirmed",
    isPaid:"pending",
      transactionid,

      // Set to pending until payment is confirmed
    });
    const savedBooking = await newBooking.save({ session });
    // Initiate Aamarpay payment

  




    // Log payment response

    // Save booking to the database after payment

    await session.commitTransaction();
    session.endSession();

    return savedBooking;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

// Aamarpay payment initiation logic

const getAllBookingsFromDB = async () => {
  const io = await UserRegModel.findOne({ _id: "6675cac287245387ae84f79e" });

  console.log("this is ", io);

  const result = await BookingModel.find({ isBooked: "confirmed" })
    .populate("user")
    .populate("facility");

  if (!result) {
    throw new Error("No data Found");
  }
  return result;
};

const findBookingsByUserId = async (userId: string) => {
  console.log("this is id", userId);





  const result = await BookingModel.find({ isBooked: "confirmed" })
  .populate("user")
  .populate({
    path: "facility",
    match: { isDeleted: false }, // Only include facilities that are not deleted
  });


  console.log("this is booking", result);
  if (!result) {
    throw new Error("No data Found");
  }
  return result;
};
const BookingCancle = async (id: string) => {
  //const result1 = await FacilityModel.findOne(_id: id)
  console.log("this is data", id);

  const result = await BookingModel.findByIdAndUpdate(
    id,
    { isBooked: "cancelled" },
    {
      new: true,
    }
  ).populate({
    path: "facility",
    match: { isDeleted: false },
  });

  if (!result) {
    throw new Error("No data Found");
  }
  return result;
};

export const bookingServices = {
  createBookingIntoDB,
  getAllBookingsFromDB,
  findBookingsByUserId,
  BookingCancle,
};
