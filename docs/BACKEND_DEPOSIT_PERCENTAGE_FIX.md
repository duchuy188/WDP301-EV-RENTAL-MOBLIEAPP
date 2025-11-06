# Backend Fix: Deposit Percentage trong Edit Booking

## 🔴 Vấn đề hiện tại

Khi edit booking, frontend không lấy được `deposit_percentage` chính xác của xe vì:

1. **API `/vehicles/:id` trả 404** khi xe đã được assign vào booking (không available)
2. **Booking response không có `deposit_percentage`** của xe
3. Frontend phải tính ngược từ `deposit_amount / total_price` → không chính xác nếu giá thay đổi

## ✅ Giải pháp đề xuất

### **Option 1: Lưu deposit_percentage vào Booking** (KHUYÊN DÙNG)

#### 1.1. Update Booking Schema
```javascript
// models/Booking.js
const bookingSchema = new Schema({
  // ... existing fields
  deposit_percentage: {
    type: Number,
    default: 30  // Default 30%
  }
});
```

#### 1.2. Khi tạo Booking, lưu deposit_percentage từ Vehicle
```javascript
// controllers/bookingController.js - createBooking
const vehicle = await Vehicle.findById(vehicleId);

const newBooking = new Booking({
  // ... other fields
  deposit_amount: calculateDeposit(totalPrice, vehicle.deposit_percentage),
  deposit_percentage: vehicle.deposit_percentage  // ← Lưu % vào booking
});
```

#### 1.3. Response trả về deposit_percentage
```javascript
// GET /bookings/:id response
{
  "booking": {
    "_id": "...",
    "total_price": 440000,
    "deposit_amount": 220000,
    "deposit_percentage": 50,  // ← Thêm field này
    "vehicle_id": {
      "_id": "...",
      "brand": "VinFast",
      "model": "Klara"
    }
  }
}
```

---

### **Option 2: Thêm deposit_percentage vào vehicle_id trong Booking populate**

#### 2.1. Update Vehicle populate khi query Booking
```javascript
// controllers/bookingController.js - getBookingById
const booking = await Booking.findById(id)
  .populate({
    path: 'vehicle_id',
    select: 'license_plate name brand model images deposit_percentage' // ← Thêm deposit_percentage
  })
  .populate('station_id');
```

#### 2.2. Response sẽ tự động có deposit_percentage
```json
{
  "booking": {
    "vehicle_id": {
      "_id": "...",
      "brand": "VinFast",
      "model": "Klara",
      "deposit_percentage": 50  // ← Tự động từ vehicle
    }
  }
}
```

---

### **Option 3: Fix endpoint GET /vehicles/:id**

Cho phép lấy thông tin vehicle kể cả khi không available:

```javascript
// routes/vehicleRoutes.js
// Endpoint riêng để lấy vehicle info (không check availability)
router.get('/vehicles/:id/info', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .select('brand model deposit_percentage price_per_day');
    
    if (!vehicle) {
      return res.status(404).json({ message: 'Không tìm thấy xe' });
    }
    
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

---

## 🎯 Khuyến nghị

**Dùng Option 1 hoặc Option 2** vì:
- ✅ Đơn giản, không cần endpoint mới
- ✅ Lưu trữ deposit_percentage chính xác tại thời điểm booking
- ✅ Không bị ảnh hưởng nếu vehicle bị xóa/update sau này
- ✅ Frontend tự động lấy được % đúng

**Option 1 tốt hơn Option 2** vì:
- Lưu deposit_percentage riêng trong booking → data consistency
- Không phụ thuộc vào vehicle hiện tại (vehicle có thể bị update/xóa)

---

## 📱 Frontend đã sẵn sàng

Frontend đã có logic nhận `deposit_percentage` theo thứ tự:

1. **Ưu tiên 1**: `booking.deposit_percentage` (Option 1)
2. **Ưu tiên 2**: `booking.vehicle_id.deposit_percentage` (Option 2)
3. **Ưu tiên 3**: Tính ngược từ deposit_amount/total_price
4. **Fallback**: Default 30%

---

## 🔄 Migration cho data cũ

Nếu dùng Option 1, cần update booking hiện có:

```javascript
// Migration script
const bookings = await Booking.find({ deposit_percentage: { $exists: false } });

for (const booking of bookings) {
  if (booking.deposit_amount && booking.total_price > 0) {
    booking.deposit_percentage = (booking.deposit_amount / booking.total_price) * 100;
    await booking.save();
  }
}
```

---

## 📞 Contact

Nếu có câu hỏi, liên hệ Frontend Team.




