import Payment from "../models/Payment.js";
import Appointment from "../models/Appointment.js";

const getNumberFromAgg = (agg, field) => {
  if (!Array.isArray(agg) || !agg.length) return 0;
  const v = agg[0]?.[field];
  return v == null ? 0 : Number(v);
};

const toISODateInKolkata = (d) => {
  // Produces YYYY-MM-DD in India timezone to keep "calendar day" grouping consistent.
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
};

export const getRevenueStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [totalPaidAgg, todayPaidAgg, monthPaidAgg, failedCount, pendingCount] =
      await Promise.all([
        Payment.aggregate([
          { $match: { status: "PAID" } },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
        Payment.aggregate([
          { $match: { status: "PAID", createdAt: { $gte: startOfDay, $lt: endOfDay } } },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
        Payment.aggregate([
          { $match: { status: "PAID", createdAt: { $gte: startOfMonth, $lt: endOfMonth } } },
          { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
        ]),
        Payment.countDocuments({ status: "FAILED" }),
        Payment.countDocuments({ status: "PENDING" }),
      ]);

    res.json({
      success: true,
      data: {
        totalRevenue: getNumberFromAgg(totalPaidAgg, "total"), // in paise
        todayRevenue: getNumberFromAgg(todayPaidAgg, "total"), // in paise
        thisMonthRevenue: getNumberFromAgg(monthPaidAgg, "total"), // in paise
        totalPaidBookings: getNumberFromAgg(totalPaidAgg, "count"),
        todayBookings: getNumberFromAgg(todayPaidAgg, "count"),
        thisMonthBookings: getNumberFromAgg(monthPaidAgg, "count"),
        failedPayments: failedCount,
        pendingPayments: pendingCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getRecentPaidBookings = async (req, res, next) => {
  try {
    const payments = await Payment.find({ status: "PAID" })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("patientId", "name profilePhoto")
      .populate("doctorId", "name department")
      .lean();

    res.json({ success: true, data: payments });
  } catch (err) {
    next(err);
  }
};

export const getRevenueChart = async (req, res, next) => {
  try {
    const now = new Date();

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6); // inclusive last 7 days

    const end = new Date(now);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1); // up to tomorrow 00:00

    const rows = await Appointment.aggregate([
      { $match: { appointmentDate: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$appointmentDate",
                timezone: "Asia/Kolkata",
              },
            },
            bookedBy: "$bookedBy",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.date",
          paid: {
            $sum: {
              $cond: [{ $eq: ["$_id.bookedBy", "PATIENT"] }, "$count", 0],
            },
          },
          walkIn: {
            $sum: {
              $cond: [{ $eq: ["$_id.bookedBy", "RECEPTIONIST"] }, "$count", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byDate = new Map((rows || []).map((r) => [r._id, r]));

    const chart = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = toISODateInKolkata(d);
      const row = byDate.get(dateStr);
      chart.push({
        date: dateStr,
        paid: row?.paid ?? 0,
        walkIn: row?.walkIn ?? 0,
      });
    }

    res.json({ success: true, data: chart });
  } catch (err) {
    next(err);
  }
};

export const getAppointmentsByDepartment = async (req, res, next) => {
  try {
    const rows = await Appointment.aggregate([
      {
        $lookup: {
          from: "doctors",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
      {
        $group: {
          _id: "$doctor.department",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const data = (rows || [])
      .filter((r) => r?._id)
      .map((r) => ({
        department: r._id,
        count: r.count,
      }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

