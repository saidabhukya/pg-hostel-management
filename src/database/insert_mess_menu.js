/**
 * Script to insert weekly mess menu from uploaded image
 * Source: Vignan Vihar Boys Hostel menu board
 */

const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'hostel.sqlite');
const db = new Database(dbPath);

const menuData = [
  {
    day: 'Monday',
    breakfast: 'Idly, Vada, Pohal, Chutney, Sambar, Allam Chutney, Milk, Coffee',
    lunch: 'Dal, Sweet, Chutney, Sambar (ChakkarPongal / Bread Halwa / Ravva Kesari), Boiled Egg, Onion + Tomato Curry, Omlet, Guntuvankaya / Egg + Tomato Rice, Rasam, Curd, Porutu',
    snacks: 'Alu Baji (1), Full Mirchi Bajji (1), Thapala Chakkalu (1), Rice Flour Pakodi (1), Ragijava / Pulses, Tea, Milk',
    dinner: 'Rice, Pulka, Pappu, Potato Curry, Dosakai + Tomato, Chutney, Seasonal Fruits, Rasam, Pappu Charu, Plain Curd Rice, Curd'
  },
  {
    day: 'Tuesday',
    breakfast: 'Idly, Chapathi with Pappu, Upma, Chutney, Pudina Chutney, Milk, Coffee',
    lunch: 'Dal, Pulihora / Kichadi / Pudina Rice / Tomato Rice, Chutney, Akukura Pappu, Cabbage + Tomato, Goruchikkudu, Sambar, Rice, Rasam, Curd',
    snacks: 'Noodles (2), Chakka Pakodi with Mirchi (1), Karapoosa (1), Pulses, Tea, Milk',
    dinner: 'Rice, Pulka, Gravy, Seasonal Curry, Egg Fried Rice, Veg Fried Rice, Kakarakaya Curry, Bendakaya Fry, Rasam, Sambar, Curd'
  },
  {
    day: 'Wednesday',
    breakfast: 'Idly, Plain Dosa, Chutney, Koriyandar Chutney, Upma, Milk, Coffee',
    lunch: 'Dal, Tomato Pappu, Benda Iguru, Seasonal Curry, Chutney, Papada, Sambar, Rasam, Curd, Rice',
    snacks: 'Cream Cake (2), Dilpasand (1), Veg Puff (1), Pulses, Tea, Milk',
    dinner: 'Boiled Egg, Rice, Pulka, Pappu, Cabbage Pickle, Cauliflower Curry, Cabbage, Sambar Rice, Seasonal Fruits, Rasam, Curd'
  },
  {
    day: 'Thursday',
    breakfast: 'Idly, Utappa, Upma, Chutney, Allam Chutney, Milk, Coffee',
    lunch: 'Dal, Chutney, Seasonal Curry, Seasonal Frys, Chama Pulusu, Dosakaya Pappu, Rasam, Sambar, Curd, Rice',
    snacks: 'Uggani (1), All Mixture (1), Punugulu (2), Chutney, Rajijava, Pulses, Tea, Milk',
    dinner: 'Rice, Pulka, Kurma, Biryani, Chicken Fry, Chutney, Veg Curries + Sweet, Rasam, Curd'
  },
  {
    day: 'Friday',
    breakfast: 'Idly, Chapathi, Chutney, Tamota Bath, Pudina Chutney, Kurma, Milk, Coffee',
    lunch: 'Dal, Akukura Pappu, Chutney, Seasonal Curry, Iguru, Vadiyalu / Appadalu, Rasam, Sambar, Curd, Rice',
    snacks: 'Cream Bun (1), Cake (1), Biscuits (2), Tea, Pulses, Milk',
    dinner: 'Boiled Egg, Pulka / Alu Palak / Dondakaya / Bendakaya / Kakarikai, Fruit Rasam, Chutney, Fruit Curd Rice, Sambar, Curd'
  },
  {
    day: 'Saturday',
    breakfast: 'Idly, Masala Dosa, Upma, Koriyandar Chutney, Chutney, Milk, Coffee',
    lunch: 'Dal, Fry, Dosaakaya Pappu, Dondakai Iguru, Drumstick Tomato Oil Fry, Chutney, Rasam, Sambar, Curd, Rice',
    snacks: 'Jilebi (1), Badusha (1), Mysorepak (1), Fruit Salad (1), Pulses, Tea, Milk',
    dinner: 'Rice, Pulka, Biryani, Kurma, Chicken Fry, Raita, Gongora Chutney, Pappu Charu, Rasam, Veg Curries + Sweet, Curd'
  },
  {
    day: 'Sunday',
    breakfast: 'Idly, Bread Jam (2), Puri (1), Onion Dosa (1), Karam Podi, Chutney, Milk, Coffee',
    lunch: 'Mudda Pappu, Pickle, Alu Patchikaram, Milli Maker + Tomato / Pakodi Pulusu, Pachipulusu / Majighi Charu, Sambar, Curd, Rice',
    snacks: 'Cornflex Chat (2), Poha (1), Besibilli Bath (2), Payasam, Tea, Milk, Pulses',
    dinner: 'Rice, Pulka, Biryani, Kurma, Chicken Fry, Raita, Gongora Chutney, Pappu Charu, Rasam, Veg Curries + Sweet, Curd'
  }
];

// Upsert each day's menu
const upsert = db.prepare(`
  INSERT INTO mess_menu (day_of_week, breakfast, lunch, dinner, special_notes)
  VALUES (?, ?, ?, ?, ?)
  ON CONFLICT(day_of_week) DO UPDATE SET
    breakfast = excluded.breakfast,
    lunch = excluded.lunch,
    dinner = excluded.dinner,
    special_notes = excluded.special_notes,
    updated_at = CURRENT_TIMESTAMP
`);

const insertAll = db.transaction(() => {
  for (const item of menuData) {
    upsert.run(
      item.day,
      item.breakfast,
      item.lunch,
      item.dinner,
      `Snacks: ${item.snacks}`
    );
    console.log(`✅ Inserted/Updated: ${item.day}`);
  }
});

try {
  insertAll();
  console.log('\n🎉 All 7 days mess menu inserted successfully!');

  // Verify
  const rows = db.prepare('SELECT day_of_week, breakfast, lunch, dinner FROM mess_menu ORDER BY id').all();
  console.log(`\n📋 Total days in DB: ${rows.length}`);
  rows.forEach(r => console.log(`  → ${r.day_of_week}`));
} catch (err) {
  console.error('❌ Error:', err.message);
} finally {
  db.close();
}
