import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import Customer from "../models/customer.model.js";
import { connectDB } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const sampleProducts = [
  {
    name: "Noise Cancelling Headphones Pro",
    description: "Premium wireless over-ear headphones with custom active noise cancellation, 40-hour battery life, and crystal-clear acoustic transducers.",
    price: 4999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    stock: 25,
  },
  {
    name: "RGB Mechanical Gaming Keyboard",
    description: "Compact tenkeyless mechanical keyboard featuring tactile blue switches, per-key RGB backlighting, and aircraft-grade aluminum top frame.",
    price: 2999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
    stock: 15,
  },
  {
    name: "Ultra-Precision Wireless Mouse",
    description: "Ergonomic 16000 DPI wireless mouse with silent clicks, customizable macro buttons, and hyper-fast scroll wheel.",
    price: 1899,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80",
    stock: 30,
  },
  {
    name: "Smart Fitness Watch 2",
    description: "AMOLED fitness tracker with continuous heart rate monitoring, SpO2 sensor, built-in GPS, and 5ATM water resistance.",
    price: 3499,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
    stock: 18,
  },
  {
    name: "Classic Oxford Cotton Shirt",
    description: "Tailored 100% breathable combed cotton button-down shirt designed for all-day comfort, formal meetings, and casual outings.",
    price: 1499,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
    stock: 40,
  },
  {
    name: "Minimalist Canvas Sneakers",
    description: "Lightweight, eco-friendly vulcanized rubber sole sneakers offering superior grip, cushioned insoles, and timeless everyday style.",
    price: 2299,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80",
    stock: 22,
  },
  {
    name: "Vintage Genuine Leather Wallet",
    description: "Handcrafted bifold leather wallet featuring RFID blocking security, 8 card slots, and dual currency compartments.",
    price: 899,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
    stock: 35,
  },
  {
    name: "Clean Code: A Handbook of Agile Craftsmanship",
    description: "The seminal guide by Robert C. Martin on software craftsmanship, readable code paradigms, and professional refactoring practices.",
    price: 799,
    category: "Books",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
    stock: 50,
  },
  {
    name: "Atomic Habits by James Clear",
    description: "An easy and proven way to build good habits and break bad ones. Transform your daily routines with actionable, scientific insights.",
    price: 499,
    category: "Books",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80",
    stock: 60,
  },
  {
    name: "Ceramic Matte Coffee Dripper & Mug Set",
    description: "Hand-glazed artisan stoneware pour-over dripper set for the ultimate specialty coffee experience at home or workspace.",
    price: 1299,
    category: "Home",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    stock: 14,
  },
  {
    name: "Aroma Essential Oil Diffuser with LED Light",
    description: "Ultrasonic cool mist aromatherapy diffuser with 7 ambient soothing LED colors and whisper-quiet auto-shutoff timer.",
    price: 1199,
    category: "Home",
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80",
    stock: 20,
  },
  {
    name: "Modern Ergonomic Desk Lamp",
    description: "Dimmable LED architect desk lamp with flexible swing arm, touch sensor dimming, and integrated USB-C device charging port.",
    price: 1999,
    category: "Home",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
    stock: 12,
  },
];

const seedData = async () => {
  try {
    await connectDB();

    console.log("Clearing existing products...");
    await Product.deleteMany({});

    console.log("Seeding initial product catalog...");
    const createdProducts = await Product.insertMany(sampleProducts);

    console.log(`✅ Successfully seeded ${createdProducts.length} products!`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

if (process.argv[1] === __filename) {
  seedData();
}

export { sampleProducts, seedData };
