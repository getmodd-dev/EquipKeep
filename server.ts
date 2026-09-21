import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer in-memory storage for handling uploaded manuals, documents, and appliance images (up to 100MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseSchema {
  equipment: any[];
  serviceRecords: any[];
  projects?: any[];
  homeDocuments?: any[];
  settings: {
    pushoverUserKey: string;
    pushoverApiToken: string;
    defaultDevice: string;
    defaultPriority: number;
    defaultSound: string;
    notifyOnWarrantyDays: number;
    notifyOnMaintenanceDue: boolean;
    lastTestedAt?: string;
    storageLocation?: string;
  };
}

const DEFAULT_DATA: DatabaseSchema = {
  settings: {
    pushoverUserKey: process.env.PUSHOVER_USER_KEY || '',
    pushoverApiToken: process.env.PUSHOVER_API_TOKEN || '',
    defaultDevice: '',
    defaultPriority: 0,
    defaultSound: 'pushover',
    notifyOnWarrantyDays: 30,
    notifyOnMaintenanceDue: true,
    storageLocation: process.env.STORAGE_LOCATION || path.join(DATA_DIR, 'documents'),
  },
  equipment: [
    {
      id: 'eq-1',
      name: 'Central Heat Pump & Air Handler',
      brand: 'Carrier',
      modelNumber: '25VNA436A003',
      serialNumber: '2421E88392',
      category: 'hvac',
      locationRoom: 'Attic & East Side Yard',
      purchaseDate: '2023-05-15',
      purchasePrice: 11800,
      vendorStore: 'All-Star HVAC Heating & Cooling',
      status: 'operational',
      contractor: {
        name: 'Dave Miller',
        company: 'All-Star HVAC Heating & Cooling',
        phone: '(555) 382-9910',
        notes: 'Lead Carrier certified technician. Annual maintenance contract #HVAC-4401.',
      },
      contractorName: 'Dave Miller',
      contractorPhone: '(555) 382-9910',
      warranty: {
        type: 'extended',
        expirationDate: '2033-05-15',
        provider: 'Carrier 10-Year Limited Warranty',
        policyNumber: 'CAR-994208-TX',
        contactPhoneOrUrl: '1-800-227-7437',
        notes: '10-year parts and compressor warranty. Requires annual professional maintenance to maintain warranty status.',
        hasLifetimeWarranty: false,
      },
      specifications: {
        filterSize: '20x25x4 MERV 11 High Efficiency',
        powerRequirements: '208/230V 1-Phase 30A Breaker',
        fuelOrRefrigerant: 'Puron (R-410A) 10.4 lbs charge',
        customSpecs: {
          'SEER2 Rating': '19.5 SEER2',
          'Capacity': '3.0 Ton Variable Speed',
          'Filter Model': 'Honeywell FC100A1037',
        },
      },
      maintenanceTasks: [
        {
          id: 'task-101',
          title: 'Replace Media Air Filter (20x25x4)',
          intervalDays: 90,
          lastCompletedDate: '2026-06-25',
          nextDueDate: '2026-09-23',
          instructions: 'Slide out Honeywell filter box in attic return plenum. Arrow points toward air handler blower.',
          priority: 'high',
          filterOrPartSpecs: 'Honeywell FC100A1037 20x25x4 MERV 11',
        },
        {
          id: 'task-102',
          title: 'Condensate Drain Line Vinegar Flush',
          intervalDays: 60,
          lastCompletedDate: '2026-08-01',
          nextDueDate: '2026-10-01',
          instructions: 'Pour 1 cup distilled white vinegar into PVC T-cleanout pipe next to evaporator coil to prevent algae backup.',
          priority: 'normal',
        },
        {
          id: 'task-103',
          title: 'Annual Professional Tune-up & Coil Clean',
          intervalDays: 365,
          lastCompletedDate: '2026-04-10',
          nextDueDate: '2027-04-10',
          instructions: 'Call Carrier certified tech to measure static pressures, clean outdoor condenser coils, check subcooling.',
          priority: 'high',
        },
      ],
      documents: [
        {
          id: 'doc-1',
          title: 'Owner Operating Manual (PDF)',
          url: 'https://www.carrier.com/residential/en/us/products/heat-pumps/25vna4/',
          fileType: 'PDF Manual',
          notes: 'Infinity 24/20 series with Greenspeed intelligence.',
          dateAdded: '2023-05-15',
        },
        {
          id: 'doc-2',
          title: 'Installation Invoice & Commissioning Sheet',
          notes: 'Static pressure recorded at 0.42 in. w.g. Subcool 10.2F.',
          dateAdded: '2023-05-15',
        },
      ],
      notes: 'Cleaned outdoor unit debris in spring. Thermostat is Carrier Infinity Touch SYSTXCCITC01-C.',
      createdAt: '2023-05-15T12:00:00.000Z',
      updatedAt: '2026-08-01T15:30:00.000Z',
    },
    {
      id: 'eq-2',
      name: 'French Door Smart Refrigerator',
      brand: 'GE Profile',
      modelNumber: 'PVD28BYNFS',
      serialNumber: 'MD849201A',
      category: 'kitchen',
      locationRoom: 'Kitchen Main',
      purchaseDate: '2024-03-20',
      purchasePrice: 2899,
      vendorStore: 'Home Depot',
      status: 'operational',
      warranty: {
        type: 'manufacturer',
        expirationDate: '2026-10-15',
        provider: 'GE Appliances 2-Year Extended Plan',
        policyNumber: 'HD-GE-552109',
        contactPhoneOrUrl: '1-800-432-2737',
        notes: 'Extended warranty expires in October 2026. Sealed refrigeration system covered for 5 years.',
        hasLifetimeWarranty: false,
      },
      specifications: {
        filterSize: 'GE RPWFE Water Filter & GBE24B01 Air Filter',
        powerRequirements: '115V 60Hz 15A Dedicated',
        customSpecs: {
          'Capacity': '27.9 cu. ft.',
          'Finish': 'Fingerprint Resistant Stainless Steel',
          'Ice Maker': 'Dual Icemaker with Autofill Pitcher',
        },
      },
      maintenanceTasks: [
        {
          id: 'task-201',
          title: 'Replace Internal Water Filter (RPWFE)',
          intervalDays: 180,
          lastCompletedDate: '2026-03-15',
          nextDueDate: '2026-09-11',
          instructions: 'Open left door, press release tab on top filter compartment, rotate cartridge down to unlock.',
          priority: 'high',
          filterOrPartSpecs: 'GE Genuine RPWFE with RFID chip',
        },
        {
          id: 'task-202',
          title: 'Vacuum Rear Condenser Coils',
          intervalDays: 180,
          lastCompletedDate: '2026-05-20',
          nextDueDate: '2026-11-20',
          instructions: 'Pull unit out carefully, remove bottom rear access panel, brush and vacuum lint off coil.',
          priority: 'normal',
        },
      ],
      documents: [
        {
          id: 'doc-21',
          title: 'User Manual & Water Filter Quick Guide',
          url: 'https://www.geappliances.com/appliance/GE-Profile-Series-ENERGY-STAR-27-9-Cu-Ft-Smart-Fingerprint-Resistant-4-Door-French-Door-Refrigerator-PVD28BYNFS',
          fileType: 'Web Link',
          notes: 'Contains troubleshooting codes for door switches and autofill sensor.',
          dateAdded: '2024-03-20',
        },
      ],
      notes: 'Replaced water valve fitting under warranty in Dec 2024. Running cold and quiet.',
      createdAt: '2024-03-20T10:00:00.000Z',
      updatedAt: '2026-05-20T08:00:00.000Z',
    },
    {
      id: 'eq-3',
      name: 'Hybrid Heat Pump Water Heater 50-Gal',
      brand: 'Rheem',
      modelNumber: 'PROPH50 T2 RH375-30',
      serialNumber: 'RH20220911804',
      category: 'plumbing',
      locationRoom: 'Basement Utility Room',
      purchaseDate: '2022-11-05',
      purchasePrice: 1750,
      vendorStore: 'Ferguson Supply',
      status: 'operational',
      contractor: {
        name: 'Marcus Vance',
        company: 'Apex Plumbing & Water Solutions',
        phone: '(555) 749-2201',
        notes: 'Licensed hybrid heat pump water heater contractor. Fast emergency leak response.',
      },
      contractorName: 'Marcus Vance',
      contractorPhone: '(555) 749-2201',
      warranty: {
        type: 'manufacturer',
        expirationDate: '2032-11-05',
        provider: 'Rheem Prestige 10-Year Limited Warranty',
        policyNumber: 'RHM-22-0911-PRO',
        contactPhoneOrUrl: '1-866-279-4566',
        notes: '10-year tank and parts warranty. EcoNet WiFi connected.',
        hasLifetimeWarranty: false,
      },
      specifications: {
        filterSize: 'Washable Upper Air Filter',
        powerRequirements: '240V 30A Dual Pole Breaker',
        customSpecs: {
          'Capacity': '50 Gallons',
          'Efficiency': '3.75 UEF Energy Star',
          'Anode Rod Part': 'SP11526C 0.900 Dia x 44" Magnesium',
        },
      },
      maintenanceTasks: [
        {
          id: 'task-301',
          title: 'Wash Top Heat Pump Air Filter',
          intervalDays: 90,
          lastCompletedDate: '2026-07-10',
          nextDueDate: '2026-10-10',
          instructions: 'Slide filter off top cowl, rinse under sink with warm water, let dry before re-inserting.',
          priority: 'normal',
        },
        {
          id: 'task-302',
          title: 'Tank Sediment Flush & T&P Valve Test',
          intervalDays: 365,
          lastCompletedDate: '2025-11-01',
          nextDueDate: '2026-11-01',
          instructions: 'Hook garden hose to bottom brass drain valve, open full port valve for 5 minutes until water runs clear.',
          priority: 'high',
        },
        {
          id: 'task-303',
          title: 'Inspect Magnesium Anode Rod',
          intervalDays: 730,
          lastCompletedDate: '2024-11-05',
          nextDueDate: '2026-11-05',
          instructions: 'Turn off power, shut cold supply, relieve pressure. 1-1/16" socket to inspect remaining core wire.',
          priority: 'normal',
        },
      ],
      documents: [
        {
          id: 'doc-31',
          title: 'Rheem EcoNet Installation & Service Guide',
          notes: 'Includes dip-switch settings for compressor heating rate.',
          dateAdded: '2022-11-05',
        },
      ],
      notes: 'Set to "Energy Saver" hybrid mode (125°F). EcoNet module integrated into Home Assistant.',
      createdAt: '2022-11-05T09:00:00.000Z',
      updatedAt: '2026-07-10T14:00:00.000Z',
    },
    {
      id: 'eq-4',
      name: '800 Series Quiet Dishwasher',
      brand: 'Bosch',
      modelNumber: 'SHPM88Z75N',
      serialNumber: 'FD010408194',
      category: 'kitchen',
      locationRoom: 'Kitchen Island',
      purchaseDate: '2021-08-14',
      purchasePrice: 1249,
      vendorStore: 'Best Buy',
      status: 'operational',
      warranty: {
        type: 'lifetime',
        expirationDate: '',
        provider: 'Bosch Lifetime Rust-Through Warranty',
        policyNumber: 'BSH-880941',
        contactPhoneOrUrl: '1-800-944-2904',
        notes: 'Original 1-year general warranty expired, but stainless steel tub has lifetime warranty against rust-through.',
        hasLifetimeWarranty: true,
      },
      specifications: {
        powerRequirements: '120V 15A Plug / Direct Box',
        customSpecs: {
          'Sound Level': '40 dBA Ultra-Quiet',
          'Drying System': 'CrystalDry with Zeolite mineral',
          'Mesh Filter Part': 'Bosch 00645038 / 10002494',
        },
      },
      maintenanceTasks: [
        {
          id: 'task-401',
          title: 'Clean Triple Filtration System',
          intervalDays: 30,
          lastCompletedDate: '2026-08-15',
          nextDueDate: '2026-09-15',
          instructions: 'Rotate circular micro-filter counter-clockwise, remove cylindrical basket, rinse grease under hot water with dish soap.',
          priority: 'high',
          filterOrPartSpecs: 'Bosch 00645038 microfilter assembly',
        },
        {
          id: 'task-402',
          title: 'Run Dishwasher Descaler & Clean Cycle',
          intervalDays: 90,
          lastCompletedDate: '2026-06-15',
          nextDueDate: '2026-09-15',
          instructions: 'Add 1 pouch Bosch descaling powder to bottom of empty tub, run "Sanitize" wash cycle at max temperature.',
          priority: 'normal',
        },
      ],
      documents: [
        {
          id: 'doc-41',
          title: 'Bosch CrystalDry Operating Instructions',
          url: 'https://www.bosch-home.com',
          fileType: 'PDF Manual',
          dateAdded: '2021-08-14',
        },
      ],
      notes: 'Replaced drain pump impeller in 2024 after glass shard obstruction. Operates perfectly.',
      createdAt: '2021-08-14T09:00:00.000Z',
      updatedAt: '2026-08-15T18:00:00.000Z',
    },
    {
      id: 'eq-5',
      name: 'EU3000iS Portable Inverter Generator',
      brand: 'Honda',
      modelNumber: 'EU3000S1AG',
      serialNumber: 'EZGF-1940291',
      category: 'workshop',
      locationRoom: 'Garage Storage Rack B',
      purchaseDate: '2022-09-10',
      purchasePrice: 2399,
      vendorStore: 'Northern Tool & Equipment',
      status: 'operational',
      warranty: {
        type: 'manufacturer',
        expirationDate: '2025-09-10',
        provider: 'Honda 3-Year Residential Warranty',
        policyNumber: 'HND-EU3-1940291',
        contactPhoneOrUrl: '1-770-497-6400',
        notes: 'Original 3-year factory warranty expired in Sept 2025. Standard parts readily available.',
        hasLifetimeWarranty: false,
      },
      specifications: {
        filterSize: 'Honda Foam Dual-Element Air Filter 17211-ZS9-A02',
        fuelOrRefrigerant: 'Unleaded 87+ Ethanol-Free preferred (3.4 gal capacity)',
        customSpecs: {
          'Oil Type': 'SAE 10W-30 Full Synthetic (0.58 US qt)',
          'Spark Plug': 'NGK BPR6ES (Gap 0.028-0.031 in)',
          'Rated Watts': '2800W continuous / 3000W surge',
        },
      },
      maintenanceTasks: [
        {
          id: 'task-501',
          title: 'Engine Oil Change (10W-30 Synthetic)',
          intervalDays: 180,
          lastCompletedDate: '2026-04-15',
          nextDueDate: '2026-10-15',
          instructions: 'Run engine 3 mins to warm oil. Remove maintenance side cover, drain into pan, fill 18.6 oz 10W-30 synthetic.',
          priority: 'high',
          filterOrPartSpecs: 'Mobil 1 10W-30 (0.58 qt)',
        },
        {
          id: 'task-502',
          title: 'Monthly 20-Minute Exercise Run with Load',
          intervalDays: 30,
          lastCompletedDate: '2026-08-20',
          nextDueDate: '2026-09-20',
          instructions: 'Turn fuel valve on, electric start, plug in 1500W space heater to load generator for 20 mins to prevent carburetor varnish.',
          priority: 'normal',
        },
      ],
      documents: [
        {
          id: 'doc-51',
          title: 'Honda EU3000iS Shop & Maintenance Manual',
          notes: 'Includes carburetor jet cleaning diagrams and electric starter wiring.',
          dateAdded: '2022-09-10',
        },
      ],
      notes: 'Carburetor always drained with bowl drain screw if stored more than 30 days. Uses STA-BIL fuel stabilizer.',
      createdAt: '2022-09-10T11:00:00.000Z',
      updatedAt: '2026-08-20T16:00:00.000Z',
    },
    {
      id: 'eq-6',
      name: 'Super Recycler 21" Personal Pace Lawnmower',
      brand: 'Toro',
      modelNumber: '21386',
      serialNumber: '408920194',
      category: 'lawn_garden',
      locationRoom: 'Garden Shed',
      purchaseDate: '2024-04-18',
      purchasePrice: 749,
      vendorStore: 'Toro Dealer / Ace Hardware',
      status: 'operational',
      contractor: {
        name: 'Gary Henderson',
        company: 'Tri-County Small Engine & Power Equipment',
        phone: '(555) 912-4433',
        notes: 'Authorized Toro master dealer. Seasonal blade sharpening and carb tune-up.',
      },
      contractorName: 'Gary Henderson',
      contractorPhone: '(555) 912-4433',
      warranty: {
        type: 'manufacturer',
        expirationDate: '2029-04-18',
        provider: 'Toro 5-Year Full Coverage & Guaranteed-to-Start',
        policyNumber: 'TR-21386-408',
        contactPhoneOrUrl: '1-888-384-9939',
        notes: '5-year full warranty coverage including Cast Aluminum Deck and 5-Year GTS guarantee.',
        hasLifetimeWarranty: false,
      },
      specifications: {
        filterSize: 'Briggs & Stratton 593260 Air Filter',
        customSpecs: {
          'Engine': 'Briggs & Stratton 163cc EXi Series',
          'Blade Part': 'Toro 108-3762-03 Atomic Blade',
          'Deck Material': 'Cast Aluminum (Rust-Free)',
        },
      },
      maintenanceTasks: [
        {
          id: 'task-601',
          title: 'Sharpen or Replace Cutting Blade',
          intervalDays: 120,
          lastCompletedDate: '2026-05-10',
          nextDueDate: '2026-09-10',
          instructions: 'Disconnect spark plug wire! Tilt mower with air filter pointing UP. 5/8" socket to remove blade bolt.',
          priority: 'normal',
          filterOrPartSpecs: 'Toro 108-3762-03 Atomic Blade',
        },
      ],
      documents: [
        {
          id: 'doc-61',
          title: 'Toro 21386 Operator Manual & Parts List',
          dateAdded: '2024-04-18',
        },
      ],
      notes: 'Cast aluminum deck never rusts. High-lift accelerator installed.',
      createdAt: '2024-04-18T14:00:00.000Z',
      updatedAt: '2026-05-10T11:00:00.000Z',
    },
  ],
  serviceRecords: [
    {
      id: 'srv-1',
      equipmentId: 'eq-1',
      equipmentName: 'Central Heat Pump & Air Handler',
      date: '2026-06-25',
      type: 'routine',
      technicianOrCompany: 'Self (DIY Maintenance)',
      cost: 42.5,
      description: 'Replaced Honeywell 20x25x4 MERV 11 filter in attic plenum. Vacuumed return grill.',
      partsReplaced: 'Honeywell FC100A1037 Filter',
      nextServiceDueDate: '2026-09-23',
      invoiceOrReceiptNote: 'Purchased 2-pack from SupplyHouse #88194',
      createdAt: '2026-06-25T14:30:00.000Z',
    },
    {
      id: 'srv-2',
      equipmentId: 'eq-1',
      equipmentName: 'Central Heat Pump & Air Handler',
      date: '2026-04-10',
      type: 'inspection',
      technicianOrCompany: 'All-Star HVAC (Tech: Dave M.)',
      cost: 165.0,
      description: 'Annual spring check. Chemically washed outdoor condenser coil, checked amp draw on compressor and fan motor, verified R-410A charge and subcooling at 10.5F. Condensate safety float switch tested.',
      partsReplaced: 'None (System in peak condition)',
      nextServiceDueDate: '2027-04-10',
      invoiceOrReceiptNote: 'Invoice #HVAC-2026-4401 paid via check',
      createdAt: '2026-04-10T10:15:00.000Z',
    },
    {
      id: 'srv-3',
      equipmentId: 'eq-2',
      equipmentName: 'French Door Smart Refrigerator',
      date: '2024-12-18',
      type: 'warranty_claim',
      technicianOrCompany: 'GE Factory Certified Service',
      cost: 0.0,
      description: 'Slow drip observed behind lower ice maker valve. Tech replaced dual water inlet solenoid valve under warranty. Zero out-of-pocket cost.',
      partsReplaced: 'Dual Water Inlet Solenoid WR57X33326',
      nextServiceDueDate: '2025-06-18',
      invoiceOrReceiptNote: 'Warranty Claim #GE-99410 - covered in full',
      createdAt: '2024-12-18T16:00:00.000Z',
    },
    {
      id: 'srv-4',
      equipmentId: 'eq-2',
      equipmentName: 'French Door Smart Refrigerator',
      date: '2026-03-15',
      type: 'routine',
      technicianOrCompany: 'Self (DIY Maintenance)',
      cost: 54.0,
      description: 'Replaced genuine GE RPWFE filter and reset water filter button on control panel. Flushed 2 gallons of water through dispenser.',
      partsReplaced: 'GE RPWFE Water Filter Cartridge',
      nextServiceDueDate: '2026-09-11',
      invoiceOrReceiptNote: 'Amazon Order #114-9920194',
      createdAt: '2026-03-15T11:20:00.000Z',
    },
    {
      id: 'srv-5',
      equipmentId: 'eq-4',
      equipmentName: '800 Series Quiet Dishwasher',
      date: '2024-09-04',
      type: 'repair',
      technicianOrCompany: 'Self (DIY Repair)',
      cost: 38.0,
      description: 'Error code E24 triggered (drain pump blocked). Discovered tiny piece of broken wine glass wedged in drain impeller under white plastic cover. Cleared debris and replaced pump cover gasket.',
      partsReplaced: 'Pump cover gasket 00611322',
      nextServiceDueDate: '2024-10-04',
      invoiceOrReceiptNote: 'AppliancePartsPros gasket order',
      createdAt: '2024-09-04T19:00:00.000Z',
    },
    {
      id: 'srv-6',
      equipmentId: 'eq-5',
      equipmentName: 'EU3000iS Portable Inverter Generator',
      date: '2026-04-15',
      type: 'routine',
      technicianOrCompany: 'Self (DIY Maintenance)',
      cost: 22.0,
      description: 'Spring service. Drained old oil, added 18.5 oz Mobil 1 10W-30 Full Synthetic. Cleaned foam pre-filter in warm soapy water and re-oiled. Checked NGK spark plug gap at 0.029". Ran with space heater load test for 20 mins.',
      partsReplaced: 'Mobil 1 10W-30 Synthetic Oil',
      nextServiceDueDate: '2026-10-15',
      invoiceOrReceiptNote: 'AutoZone oil purchase',
      createdAt: '2026-04-15T15:45:00.000Z',
    },
  ],
  projects: [
    {
      id: 'proj-1',
      title: 'Clean Gutters & Flush Downspouts',
      category: 'gutters_roof',
      description: 'Clear leaves, pine needles, and roofing granules from all gutters and flush downspouts to prevent foundation overflow.',
      targetDate: '2026-10-25',
      season: 'fall',
      status: 'scheduled',
      priority: 'high',
      recurrence: 'seasonal_fall',
      estimatedCost: 0,
      actualCost: 0,
      assignedType: 'diy',
      checklist: [
        { id: 'c-1', text: 'Set up ladder standoff stabilizer safely on roof edge', completed: false },
        { id: 'c-2', text: 'Scoop leaf debris into bucket and bag for yard compost', completed: false },
        { id: 'c-3', text: 'Run garden hose through downspouts to verify clean drainage', completed: false },
        { id: 'c-4', text: 'Inspect gutter slope and re-secure loose fascia brackets', completed: false },
      ],
      materialsNeeded: 'Gloves, gutter scoop, bucket, garden hose, ladder standoff',
      notes: 'Clean both front porch and two-story rear roofline. Re-check before first heavy freeze.',
      lastCompletedDate: '2026-04-12',
      createdAt: '2026-04-12T10:00:00.000Z',
      updatedAt: '2026-04-12T10:00:00.000Z',
    },
    {
      id: 'proj-2',
      title: 'Exterior Trim, Fascia & Front Door Painting',
      category: 'painting_exterior',
      description: 'Scrape, prime, and apply two coats of exterior satin acrylic paint to front door, garage door trim, and window sills.',
      targetDate: '2026-11-10',
      season: 'fall',
      status: 'planned',
      priority: 'normal',
      recurrence: 'multi_year',
      estimatedCost: 180,
      actualCost: 0,
      assignedType: 'diy',
      checklist: [
        { id: 'c-21', text: 'Pressure wash trim and allow 48 hours dry time', completed: true },
        { id: 'c-22', text: 'Scrape peeling spots and spot prime with Zinsser 1-2-3', completed: false },
        { id: 'c-23', text: 'Caulk gaps around window trim with exterior polyurethane', completed: false },
        { id: 'c-24', text: 'Apply 2 coats Benjamin Moore Aura Exterior Satin (Iron Mountain)', completed: false },
      ],
      materialsNeeded: '2 gal BM Aura Exterior Satin (Color: Iron Mountain 2134-30), 2.5" angled sash brushes, drop cloths',
      notes: 'Paint only on dry days above 50°F and below 85% humidity.',
      createdAt: '2026-08-01T12:00:00.000Z',
      updatedAt: '2026-08-01T12:00:00.000Z',
    },
    {
      id: 'proj-3',
      title: 'Spring Landscaping, Lawn Aeration & Fresh Mulch',
      category: 'landscaping_grounds',
      description: 'Core aerate lawn, apply pre-emergent fertilizer, spade edge all perennial beds, and spread 4 yards of dark brown mulch.',
      targetDate: '2027-03-20',
      season: 'spring',
      status: 'planned',
      priority: 'normal',
      recurrence: 'seasonal_spring',
      estimatedCost: 320,
      actualCost: 0,
      assignedType: 'diy',
      checklist: [
        { id: 'c-31', text: 'Rent core aerator from local equipment yard', completed: false },
        { id: 'c-32', text: 'Aerate front, back, and side lawns', completed: false },
        { id: 'c-33', text: 'Trench crisp 3" edge along all perennial beds and tree rings', completed: false },
        { id: 'c-34', text: 'Order & spread 4 yards dark brown double-shredded mulch', completed: false },
        { id: 'c-35', text: 'Broadcast crabgrass pre-emergent lawn fertilizer', completed: false },
      ],
      materialsNeeded: '4 cu yd dark brown mulch, Scotts Halts pre-emergent, spade shovel, wheelbarrow',
      notes: 'Call 811 utility line locator before aerating near buried internet cables.',
      lastCompletedDate: '2026-03-28',
      createdAt: '2026-03-28T14:00:00.000Z',
      updatedAt: '2026-03-28T14:00:00.000Z',
    },
    {
      id: 'proj-4',
      title: 'Pressure Wash Driveway, Walkways & Patio',
      category: 'pressure_washing',
      description: 'Surface clean concrete driveway, sidewalk, and rear patio using 15" surface cleaner attachment.',
      targetDate: '2027-05-15',
      season: 'spring',
      status: 'planned',
      priority: 'normal',
      recurrence: 'annual',
      estimatedCost: 45,
      actualCost: 0,
      assignedType: 'diy',
      checklist: [
        { id: 'c-41', text: 'Pre-treat driveway oil stains with concrete degreaser', completed: false },
        { id: 'c-42', text: 'Connect 15" rotating surface cleaner to pressure washer wand', completed: false },
        { id: 'c-43', text: 'Rinse loose sediment toward street gutter with 40° fan tip', completed: false },
      ],
      materialsNeeded: '15" surface cleaner, degreaser, ear protection, goggles',
      createdAt: '2026-05-10T10:00:00.000Z',
      updatedAt: '2026-05-10T10:00:00.000Z',
    },
  ],
  homeDocuments: [
    {
      id: 'hdoc-1',
      title: 'Homeowners Insurance Policy & Declaration of Coverage',
      category: 'warranty_insurance',
      fileName: 'Homeowners_Policy_StateFarm.pdf',
      fileType: 'Insurance Policy',
      dateAdded: '2026-01-15',
      documentDate: '2026-01-15',
      amount: 1650,
      vendorOrIssuer: 'State Farm Insurance',
      roomOrArea: 'Whole House / Dwelling',
      notes: 'Annual policy renewal: includes $450k dwelling coverage, $100k liability, roof wind/hail endorsement. Policy #94-BQ-2911-3.',
      isLocal: false,
    },
    {
      id: 'hdoc-2',
      title: 'Main Electrical Panel Circuit Schedule & Breaker Map',
      category: 'utility_infrastructure',
      fileType: 'Diagram / Blueprint',
      dateAdded: '2025-09-10',
      documentDate: '2025-08-12',
      vendorOrIssuer: 'Apex Electric LLC',
      roomOrArea: 'Basement Utility Room',
      notes: 'Complete 200A 40-circuit Square D QO breaker index with EV charger sub-panel and solar interlock notes.',
      isLocal: false,
    },
    {
      id: 'hdoc-3',
      title: 'Property Boundary Survey, Plat Map & Fence Permit',
      category: 'permit_blueprint',
      fileType: 'Official Permit & Map',
      dateAdded: '2024-04-20',
      documentDate: '2024-04-18',
      amount: 420,
      vendorOrIssuer: 'County Building & Zoning Dept',
      roomOrArea: 'Property Lines & Rear Yard',
      notes: 'Stamped surveyor plat showing utility easements, setback lines, and approved 6ft privacy fence permit #PRM-2024-881.',
      isLocal: false,
    },
    {
      id: 'hdoc-4',
      title: 'Whole-House Exterior Paint Formulas & Trim Swatches',
      category: 'paint_materials',
      fileType: 'Formulas & Swatches',
      dateAdded: '2025-06-25',
      documentDate: '2025-06-22',
      amount: 620,
      vendorOrIssuer: 'Sherwin-Williams Store #3810',
      roomOrArea: 'Exterior Siding, Soffits & Trim',
      notes: 'Main Siding: SW 7005 Pure White (Emerald Exterior Satin). Front Door & Shutters: SW 7069 Iron Ore (Gloss). Porch Ceiling: SW 6483 Buxton Blue.',
      isLocal: false,
    },
    {
      id: 'hdoc-5',
      title: 'GAF Timberline HDZ Architectural Roof Contract & 50-Yr Warranty',
      category: 'receipt',
      fileType: 'Contract & Warranty',
      dateAdded: '2024-10-05',
      documentDate: '2024-10-02',
      amount: 12850,
      vendorOrIssuer: 'Summit Peak Roofing Contractors',
      roomOrArea: 'Roof & Gutters',
      notes: 'Paid in full receipt and transferrable GAF Golden Pledge 50-year material and 25-year workmanship warranty certificate.',
      isLocal: false,
    },
  ],
};

function readDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
      return DEFAULT_DATA;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    if (!parsed.equipment) parsed.equipment = [];
    if (!parsed.serviceRecords) parsed.serviceRecords = [];
    if (!parsed.projects) parsed.projects = DEFAULT_DATA.projects || [];
    if (!parsed.homeDocuments) parsed.homeDocuments = DEFAULT_DATA.homeDocuments || [];
    if (!parsed.settings) parsed.settings = DEFAULT_DATA.settings;
    return parsed;
  } catch (err) {
    console.error('Error reading database file, returning default:', err);
    return DEFAULT_DATA;
  }
}

function writeDatabase(data: DatabaseSchema): boolean {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// Helper to send Pushover message
async function sendPushoverMessage(params: {
  userKey: string;
  apiToken: string;
  title: string;
  message: string;
  priority?: number;
  sound?: string;
  url?: string;
  urlTitle?: string;
  device?: string;
}) {
  const { userKey, apiToken, title, message, priority = 0, sound, url, urlTitle, device } = params;

  if (!userKey || !apiToken) {
    throw new Error('Pushover User Key and Application API Token are required.');
  }

  const formData = new URLSearchParams();
  formData.append('token', apiToken.trim());
  formData.append('user', userKey.trim());
  formData.append('title', title);
  formData.append('message', message);
  formData.append('priority', priority.toString());

  if (sound) formData.append('sound', sound);
  if (url) formData.append('url', url);
  if (urlTitle) formData.append('url_title', urlTitle);
  if (device) formData.append('device', device);

  const response = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  const result = await response.json();
  if (!response.ok || result.status !== 1) {
    const errorMsg = result.errors ? result.errors.join(', ') : 'Failed to send Pushover notification';
    throw new Error(errorMsg);
  }

  return result;
}

// ==========================================
// STORAGE & LOCAL FILESYSTEM HELPERS
// ==========================================

// Format byte counts into clean human readable strings
function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Sanitize string for clean cross-platform folder and file names
function sanitizeName(name: string): string {
  if (!name) return 'unnamed';
  return name.replace(/[^a-zA-Z0-9_\-\.]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

// Get configured or default storage location root directory
function getStorageLocation(db: DatabaseSchema): string {
  const configured = db.settings?.storageLocation;
  if (configured && configured.trim()) {
    return path.resolve(configured.trim());
  }
  if (process.env.STORAGE_LOCATION && process.env.STORAGE_LOCATION.trim()) {
    return path.resolve(process.env.STORAGE_LOCATION.trim());
  }
  return path.join(DATA_DIR, 'documents');
}

// Ensure storage location directory exists and test write access
function ensureStorageLocationDir(storagePath: string): { exists: boolean; writable: boolean; error?: string } {
  try {
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
    // Test write permission by creating and immediately deleting a test file
    const testFile = path.join(storagePath, `.equipkeep_write_test_${Date.now()}`);
    fs.writeFileSync(testFile, 'ok', 'utf-8');
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    return { exists: true, writable: true };
  } catch (err: any) {
    return { exists: fs.existsSync(storagePath), writable: false, error: err.message };
  }
}

// Deterministic folder naming for an appliance: e.g. "Carrier_Central_Heat_Pump_eq-1"
function getEquipmentFolderName(eq: any): string {
  if (eq.folderName && eq.folderName.trim()) {
    return sanitizeName(eq.folderName.trim());
  }
  const brand = sanitizeName(eq.brand || 'Appliance');
  const name = sanitizeName(eq.name || 'Equipment');
  const id = sanitizeName(eq.id || 'id');
  return `${brand}_${name}_${id}`;
}

// Ensure an equipment's folder exists in the storage location with metadata
function ensureEquipmentFolder(eq: any, storagePath: string): { folderName: string; folderPath: string } {
  ensureStorageLocationDir(storagePath);
  const folderName = getEquipmentFolderName(eq);
  const folderPath = path.join(storagePath, folderName);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Write descriptive metadata in the folder for easy browsing in Unraid SMB / local file managers
  try {
    const infoPath = path.join(folderPath, 'appliance-info.json');
    const info = {
      equipmentId: eq.id,
      name: eq.name,
      brand: eq.brand,
      modelNumber: eq.modelNumber,
      serialNumber: eq.serialNumber,
      category: eq.category,
      locationRoom: eq.locationRoom,
      purchaseDate: eq.purchaseDate,
      warranty: eq.warranty,
      specifications: eq.specifications,
      folderPath,
      lastSyncedAt: new Date().toISOString(),
      readme: 'This directory stores local manuals, PDFs, documentation, and photos for this equipment in EquipKeep.',
    };
    fs.writeFileSync(infoPath, JSON.stringify(info, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal if info file cannot be written
  }

  return { folderName, folderPath };
}

const HOME_DOCS_FOLDER_NAME = 'General_Home_Documents';

// Ensure the general home documents & receipts folder exists in the storage location
function ensureHomeDocumentsFolder(storagePath: string): { folderName: string; folderPath: string } {
  ensureStorageLocationDir(storagePath);
  const folderPath = path.join(storagePath, HOME_DOCS_FOLDER_NAME);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  try {
    const infoPath = path.join(folderPath, 'home-documents-info.json');
    if (!fs.existsSync(infoPath)) {
      const info = {
        name: 'General Home Documents & Receipts',
        folderPath,
        lastSyncedAt: new Date().toISOString(),
        readme: 'This directory stores whole-home manuals, permits, blueprints, insurance policies, contractor receipts, paint codes, and general home documentation in EquipKeep.',
      };
      fs.writeFileSync(infoPath, JSON.stringify(info, null, 2), 'utf-8');
    }
  } catch (err) {
    // Non-fatal
  }

  return { folderName: HOME_DOCS_FOLDER_NAME, folderPath };
}

// Synchronize and ensure folders exist for all equipment in the DB
function syncAllEquipmentFolders(db: DatabaseSchema): { total: number; storagePath: string; folders: string[] } {
  const storagePath = getStorageLocation(db);
  ensureStorageLocationDir(storagePath);
  ensureHomeDocumentsFolder(storagePath);
  const folders: string[] = [HOME_DOCS_FOLDER_NAME];

  db.equipment.forEach((eq) => {
    const { folderName } = ensureEquipmentFolder(eq, storagePath);
    eq.folderName = folderName;
    folders.push(folderName);
  });

  return { total: folders.length, storagePath, folders };
}

// Inspect storage location and return full status, folder counts, and file lists
function getStorageStatusData(db: DatabaseSchema) {
  const storagePath = getStorageLocation(db);
  const defaultPath = path.join(DATA_DIR, 'documents');
  const dirCheck = ensureStorageLocationDir(storagePath);

  let totalFiles = 0;
  let totalBytes = 0;
  const folders: any[] = [];

  if (dirCheck.exists) {
    try {
      const entries = fs.readdirSync(storagePath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const folderName = entry.name;
          const fullFolderPath = path.join(storagePath, folderName);
          const eq = db.equipment.find(
            (e) => getEquipmentFolderName(e) === folderName || e.folderName === folderName || e.id === folderName
          );

          const fileEntries = fs.readdirSync(fullFolderPath, { withFileTypes: true });
          const files: any[] = [];
          let folderBytes = 0;

          for (const fe of fileEntries) {
            if (fe.isFile()) {
              const fileFullPath = path.join(fullFolderPath, fe.name);
              try {
                const stat = fs.statSync(fileFullPath);
                folderBytes += stat.size;
                totalBytes += stat.size;
                totalFiles += 1;

                const ext = path.extname(fe.name).toLowerCase();
                let mime = 'application/octet-stream';
                if (ext === '.pdf') mime = 'application/pdf';
                else if (['.jpg', '.jpeg'].includes(ext)) mime = 'image/jpeg';
                else if (ext === '.png') mime = 'image/png';
                else if (ext === '.webp') mime = 'image/webp';
                else if (['.txt', '.md'].includes(ext)) mime = 'text/plain';

                files.push({
                  fileName: fe.name,
                  fullPath: fileFullPath,
                  url: eq ? `/api/storage/files/${eq.id}/${encodeURIComponent(fe.name)}` : undefined,
                  sizeBytes: stat.size,
                  formattedSize: formatBytes(stat.size),
                  mimeType: mime,
                  updatedAt: stat.mtime.toISOString(),
                });
              } catch (e) {
                // Ignore stat error on single file
              }
            }
          }

          folders.push({
            folderName,
            fullPath: fullFolderPath,
            equipmentId: eq?.id,
            equipmentName: eq?.name || folderName,
            fileCount: files.length,
            totalBytes: folderBytes,
            formattedSize: formatBytes(folderBytes),
            files,
          });
        }
      }
    } catch (err) {
      console.error('Error scanning storage location:', err);
    }
  }

  return {
    storageLocation: storagePath,
    defaultLocation: defaultPath,
    exists: dirCheck.exists,
    writable: dirCheck.writable,
    error: dirCheck.error,
    totalApplianceFolders: folders.length,
    totalFiles,
    totalBytes,
    formattedTotalSize: formatBytes(totalBytes),
    folders,
  };
}

// API Routes

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    server: 'EquipKeep Local Node / Unraid Portal',
    timestamp: new Date().toISOString(),
  });
});

// Equipment endpoints
app.get('/api/equipment', (req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.equipment);
});

app.post('/api/equipment', (req: Request, res: Response) => {
  const db = readDatabase();
  const storagePath = getStorageLocation(db);
  const id = req.body.id || `eq-${Date.now()}`;
  
  const newEquipment = {
    ...req.body,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    maintenanceTasks: req.body.maintenanceTasks || [],
    documents: req.body.documents || [],
  };

  // Automatically compute folder name and create folder on disk
  const { folderName } = ensureEquipmentFolder(newEquipment, storagePath);
  newEquipment.folderName = folderName;

  db.equipment.unshift(newEquipment);
  writeDatabase(db);
  res.status(201).json(newEquipment);
});

app.put('/api/equipment/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  const index = db.equipment.findIndex((eq) => eq.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Equipment not found' });
    return;
  }

  const updated = {
    ...db.equipment[index],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString(),
  };

  db.equipment[index] = updated;

  // Also update equipmentName on existing service records if name changed
  if (req.body.name && req.body.name !== db.equipment[index].name) {
    db.serviceRecords.forEach((sr) => {
      if (sr.equipmentId === req.params.id) {
        sr.equipmentName = req.body.name;
      }
    });
  }

  writeDatabase(db);
  res.json(updated);
});

app.delete('/api/equipment/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  const initialCount = db.equipment.length;
  db.equipment = db.equipment.filter((eq) => eq.id !== req.params.id);

  if (db.equipment.length === initialCount) {
    res.status(404).json({ error: 'Equipment not found' });
    return;
  }

  // Optionally remove associated service records or keep them
  writeDatabase(db);
  res.json({ success: true, deletedId: req.params.id });
});

// ==========================================
// HOME PROJECTS & SCHEDULING ENDPOINTS
// ==========================================

app.get('/api/projects', (req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.projects || []);
});

app.post('/api/projects', (req: Request, res: Response) => {
  const db = readDatabase();
  if (!db.projects) db.projects = [];

  const newProject = {
    ...req.body,
    id: req.body.id || `proj-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    checklist: req.body.checklist || [],
    status: req.body.status || 'planned',
  };

  db.projects.unshift(newProject);
  writeDatabase(db);
  res.status(201).json(newProject);
});

app.put('/api/projects/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  if (!db.projects) db.projects = [];

  const index = db.projects.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const updated = {
    ...db.projects[index],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString(),
  };

  db.projects[index] = updated;
  writeDatabase(db);
  res.json(updated);
});

app.delete('/api/projects/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  if (!db.projects) db.projects = [];

  const initialCount = db.projects.length;
  db.projects = db.projects.filter((p) => p.id !== req.params.id);

  if (db.projects.length === initialCount) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  writeDatabase(db);
  res.json({ success: true, deletedId: req.params.id });
});

// Mark project completed and advance recurrence if applicable
app.post('/api/projects/:id/complete', (req: Request, res: Response) => {
  const db = readDatabase();
  if (!db.projects) db.projects = [];

  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const completedDate = req.body.completedDate || new Date().toISOString().split('T')[0];
  project.lastCompletedDate = completedDate;
  project.updatedAt = new Date().toISOString();

  // Reset checklist completion if user desires, or mark complete
  if (Array.isArray(project.checklist)) {
    project.checklist.forEach((item: any) => {
      item.completed = true;
    });
  }

  // Calculate next recurrence date if recurring
  if (project.recurrence && project.recurrence !== 'one_time') {
    const baseDate = new Date(completedDate);
    if (project.recurrence === 'seasonal_spring') {
      baseDate.setFullYear(baseDate.getFullYear() + 1);
      baseDate.setMonth(2); // March
      baseDate.setDate(20);
    } else if (project.recurrence === 'seasonal_fall') {
      baseDate.setFullYear(baseDate.getFullYear() + 1);
      baseDate.setMonth(9); // October
      baseDate.setDate(20);
    } else if (project.recurrence === 'biannual') {
      baseDate.setMonth(baseDate.getMonth() + 6);
    } else if (project.recurrence === 'annual') {
      baseDate.setFullYear(baseDate.getFullYear() + 1);
    } else if (project.recurrence === 'multi_year') {
      baseDate.setFullYear(baseDate.getFullYear() + 3);
    }
    project.targetDate = baseDate.toISOString().split('T')[0];
    project.status = 'scheduled';
  } else {
    project.status = 'completed';
  }

  // Optionally log into service records
  if (req.body.logServiceRecord) {
    const srvRecord = {
      id: `srv-${Date.now()}`,
      equipmentId: 'general-property',
      equipmentName: `Property: ${project.title}`,
      date: completedDate,
      type: project.assignedType === 'contractor' ? 'repair' : 'routine',
      technicianOrCompany: project.contractorName || 'Self (DIY)',
      cost: Number(req.body.actualCost || project.actualCost || project.estimatedCost || 0),
      description: `Completed project: ${project.title}. ${project.description || ''}`,
      createdAt: new Date().toISOString(),
    };
    db.serviceRecords.unshift(srvRecord);
  }

  writeDatabase(db);
  res.json({ success: true, project });
});

// ==========================================
// GENERAL HOME DOCUMENTS & RECEIPTS ENDPOINTS
// ==========================================

// Get all home documents
app.get('/api/home-documents', (req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.homeDocuments || []);
});

// Upload a document or receipt to the General_Home_Documents storage folder
app.post('/api/home-documents/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file was provided for upload.' });
    return;
  }

  const db = readDatabase();
  const storagePath = getStorageLocation(db);
  const { folderName, folderPath } = ensureHomeDocumentsFolder(storagePath);

  const rawOriginalName = req.file.originalname || 'home_document';
  const cleanBase = sanitizeName(path.parse(rawOriginalName).name);
  const ext = path.extname(rawOriginalName) || '.pdf';
  let targetFileName = `${cleanBase}${ext}`;

  let targetPath = path.join(folderPath, targetFileName);
  if (fs.existsSync(targetPath)) {
    targetFileName = `${cleanBase}_${Date.now()}${ext}`;
    targetPath = path.join(folderPath, targetFileName);
  }

  fs.writeFileSync(targetPath, req.file.buffer);

  const isPdf = req.file.mimetype.includes('pdf') || ext.toLowerCase() === '.pdf';
  const isImage = req.file.mimetype.startsWith('image/');
  let fileType = req.body.fileType?.trim() || (isPdf ? 'PDF Document' : isImage ? 'Image / Photo' : 'Document');

  const newDoc = {
    id: `hdoc-${Date.now()}`,
    title: req.body.title?.trim() || cleanBase.replace(/_/g, ' '),
    category: req.body.category?.trim() || 'other',
    fileName: targetFileName,
    filePath: path.join(folderName, targetFileName),
    fileSize: req.file.size,
    mimeType: req.file.mimetype || (isPdf ? 'application/pdf' : 'application/octet-stream'),
    fileType,
    url: `/api/storage/home-files/${encodeURIComponent(targetFileName)}`,
    notes: req.body.notes?.trim() || undefined,
    dateAdded: new Date().toISOString().split('T')[0],
    documentDate: req.body.documentDate?.trim() || new Date().toISOString().split('T')[0],
    amount: req.body.amount !== undefined && req.body.amount !== '' ? parseFloat(req.body.amount) : undefined,
    vendorOrIssuer: req.body.vendorOrIssuer?.trim() || undefined,
    roomOrArea: req.body.roomOrArea?.trim() || undefined,
    tags: req.body.tags ? (typeof req.body.tags === 'string' ? req.body.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : req.body.tags) : undefined,
    isLocal: true,
  };

  if (!db.homeDocuments) db.homeDocuments = [];
  db.homeDocuments.unshift(newDoc);
  writeDatabase(db);

  res.json({
    success: true,
    document: newDoc,
    message: `Saved ${targetFileName} to ${folderName}/`,
  });
});

// Add a document web link or cloud manual URL
app.post('/api/home-documents/link', (req: Request, res: Response) => {
  const db = readDatabase();
  const { title, url, category, notes, documentDate, amount, vendorOrIssuer, roomOrArea, tags, fileType } = req.body;

  if (!title || !title.trim()) {
    res.status(400).json({ error: 'Document title is required.' });
    return;
  }

  const newDoc = {
    id: `hdoc-${Date.now()}`,
    title: title.trim(),
    category: category?.trim() || 'other',
    url: url?.trim() || undefined,
    fileType: fileType?.trim() || 'Web Link / Cloud Document',
    notes: notes?.trim() || undefined,
    dateAdded: new Date().toISOString().split('T')[0],
    documentDate: documentDate?.trim() || new Date().toISOString().split('T')[0],
    amount: amount !== undefined && amount !== '' ? parseFloat(amount) : undefined,
    vendorOrIssuer: vendorOrIssuer?.trim() || undefined,
    roomOrArea: roomOrArea?.trim() || undefined,
    tags: tags ? (typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : tags) : undefined,
    isLocal: false,
  };

  if (!db.homeDocuments) db.homeDocuments = [];
  db.homeDocuments.unshift(newDoc);
  writeDatabase(db);

  res.json({
    success: true,
    document: newDoc,
  });
});

// Update an existing home document metadata
app.put('/api/home-documents/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  if (!db.homeDocuments) db.homeDocuments = [];
  const index = db.homeDocuments.findIndex((d: any) => d.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  const existing = db.homeDocuments[index];
  const { title, category, notes, documentDate, amount, vendorOrIssuer, roomOrArea, tags, url, fileType } = req.body;

  db.homeDocuments[index] = {
    ...existing,
    title: title !== undefined ? title.trim() : existing.title,
    category: category !== undefined ? category.trim() : existing.category,
    fileType: fileType !== undefined ? fileType.trim() : existing.fileType,
    notes: notes !== undefined ? (notes.trim() || undefined) : existing.notes,
    documentDate: documentDate !== undefined ? (documentDate.trim() || undefined) : existing.documentDate,
    amount: amount !== undefined && amount !== '' ? parseFloat(amount) : (amount === '' ? undefined : existing.amount),
    vendorOrIssuer: vendorOrIssuer !== undefined ? (vendorOrIssuer.trim() || undefined) : existing.vendorOrIssuer,
    roomOrArea: roomOrArea !== undefined ? (roomOrArea.trim() || undefined) : existing.roomOrArea,
    tags: tags !== undefined ? (typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : tags) : existing.tags,
    url: url !== undefined ? (url.trim() || undefined) : existing.url,
  };

  writeDatabase(db);
  res.json({ success: true, document: db.homeDocuments[index] });
});

// Delete a home document (and local file if exists)
app.delete('/api/home-documents/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  if (!db.homeDocuments) db.homeDocuments = [];

  const doc = db.homeDocuments.find((d: any) => d.id === req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  if (doc.isLocal && doc.fileName) {
    try {
      const storagePath = getStorageLocation(db);
      const filePath = path.join(storagePath, HOME_DOCS_FOLDER_NAME, doc.fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.warn('Could not delete local file:', err);
    }
  }

  db.homeDocuments = db.homeDocuments.filter((d: any) => d.id !== req.params.id);
  writeDatabase(db);
  res.json({ success: true, deletedId: req.params.id });
});

// Serve local general home files directly
app.get('/api/storage/home-files/:fileName', (req: Request, res: Response) => {
  const db = readDatabase();
  const storagePath = getStorageLocation(db);
  const decodedFileName = path.basename(decodeURIComponent(req.params.fileName));
  const fullFolder = path.resolve(storagePath, HOME_DOCS_FOLDER_NAME);
  const resolvedFile = path.resolve(fullFolder, decodedFileName);

  if (!resolvedFile.startsWith(fullFolder)) {
    res.status(403).send('Forbidden file path access');
    return;
  }

  if (!fs.existsSync(resolvedFile)) {
    res.status(404).send('File not found on disk');
    return;
  }

  const ext = path.extname(decodedFileName).toLowerCase();
  if (ext === '.pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${decodedFileName}"`);
  } else if (['.jpg', '.jpeg'].includes(ext)) {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (ext === '.png') {
    res.setHeader('Content-Type', 'image/png');
  } else if (ext === '.webp') {
    res.setHeader('Content-Type', 'image/webp');
  } else {
    res.setHeader('Content-Disposition', `attachment; filename="${decodedFileName}"`);
  }

  res.sendFile(resolvedFile);
});

// ==========================================
// STORAGE & LOCAL FILES ENDPOINTS
// ==========================================

// Get storage location status, health, disk usage, and appliance folder breakdown
app.get('/api/storage/status', (req: Request, res: Response) => {
  const db = readDatabase();
  res.json(getStorageStatusData(db));
});

// Update storage location root directory (with validation and option to migrate existing files)
app.post('/api/storage/config', (req: Request, res: Response) => {
  const { storageLocation, migrateExisting } = req.body;
  if (!storageLocation || typeof storageLocation !== 'string' || !storageLocation.trim()) {
    res.status(400).json({ error: 'A valid storage location path is required.' });
    return;
  }

  const targetPath = path.resolve(storageLocation.trim());
  const check = ensureStorageLocationDir(targetPath);
  if (!check.writable) {
    res.status(400).json({
      error: `Storage directory cannot be written to: ${check.error || 'Permission denied'}`,
    });
    return;
  }

  const db = readDatabase();
  const oldPath = getStorageLocation(db);

  // If migration requested and paths differ, copy directories over
  if (migrateExisting && oldPath !== targetPath && fs.existsSync(oldPath)) {
    try {
      const items = fs.readdirSync(oldPath, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          const srcDir = path.join(oldPath, item.name);
          const destDir = path.join(targetPath, item.name);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          const files = fs.readdirSync(srcDir);
          for (const f of files) {
            const srcFile = path.join(srcDir, f);
            const destFile = path.join(destDir, f);
            if (!fs.existsSync(destFile)) {
              fs.copyFileSync(srcFile, destFile);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error migrating files to new location:', err);
    }
  }

  db.settings.storageLocation = targetPath;
  syncAllEquipmentFolders(db);
  writeDatabase(db);

  res.json({
    success: true,
    message: `Storage location updated to: ${targetPath}`,
    status: getStorageStatusData(db),
  });
});

// Ensure and sync all appliance folders on disk
app.post('/api/storage/sync-folders', (req: Request, res: Response) => {
  const db = readDatabase();
  const result = syncAllEquipmentFolders(db);
  writeDatabase(db);
  res.json({
    success: true,
    message: `Synchronized ${result.total} appliance folders on disk.`,
    ...result,
    status: getStorageStatusData(db),
  });
});

// Inspect specific appliance's local folder
app.get('/api/equipment/:id/folder-info', (req: Request, res: Response) => {
  const db = readDatabase();
  const eq = db.equipment.find((e) => e.id === req.params.id);
  if (!eq) {
    res.status(404).json({ error: 'Equipment not found' });
    return;
  }

  const storagePath = getStorageLocation(db);
  const { folderName, folderPath } = ensureEquipmentFolder(eq, storagePath);

  const files: any[] = [];
  let totalBytes = 0;
  if (fs.existsSync(folderPath)) {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isFile()) {
        const full = path.join(folderPath, ent.name);
        const stat = fs.statSync(full);
        totalBytes += stat.size;
        files.push({
          fileName: ent.name,
          fullPath: full,
          url: `/api/storage/files/${eq.id}/${encodeURIComponent(ent.name)}`,
          sizeBytes: stat.size,
          formattedSize: formatBytes(stat.size),
          updatedAt: stat.mtime.toISOString(),
        });
      }
    }
  }

  res.json({
    equipmentId: eq.id,
    equipmentName: eq.name,
    folderName,
    folderPath,
    fileCount: files.length,
    totalBytes,
    formattedSize: formatBytes(totalBytes),
    files,
  });
});

// Upload manual, document, wiring schematic or receipt to an appliance's local folder
app.post('/api/equipment/:id/upload-document', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file was provided for upload.' });
    return;
  }

  const db = readDatabase();
  const eq = db.equipment.find((e) => e.id === req.params.id);
  if (!eq) {
    res.status(404).json({ error: 'Equipment not found' });
    return;
  }

  const storagePath = getStorageLocation(db);
  const { folderName, folderPath } = ensureEquipmentFolder(eq, storagePath);

  const rawOriginalName = req.file.originalname || 'uploaded_document';
  const cleanBase = sanitizeName(path.parse(rawOriginalName).name);
  const ext = path.extname(rawOriginalName) || '.pdf';
  let targetFileName = `${cleanBase}${ext}`;

  // If a file with same name exists, append timestamp
  let targetPath = path.join(folderPath, targetFileName);
  if (fs.existsSync(targetPath)) {
    targetFileName = `${cleanBase}_${Date.now()}${ext}`;
    targetPath = path.join(folderPath, targetFileName);
  }

  fs.writeFileSync(targetPath, req.file.buffer);

  // Classify document type
  const isPdf = req.file.mimetype.includes('pdf') || ext.toLowerCase() === '.pdf';
  const isImage = req.file.mimetype.startsWith('image/');
  let fileType = req.body.fileType?.trim() || (isPdf ? 'PDF Manual' : isImage ? 'Image / Diagram' : 'Documentation');

  const newDoc = {
    id: `doc-${Date.now()}`,
    title: req.body.title?.trim() || cleanBase.replace(/_/g, ' '),
    fileName: targetFileName,
    filePath: path.join(folderName, targetFileName),
    fileSize: req.file.size,
    mimeType: req.file.mimetype || (isPdf ? 'application/pdf' : 'application/octet-stream'),
    fileType,
    notes: req.body.notes?.trim() || undefined,
    dateAdded: new Date().toISOString().split('T')[0],
    url: `/api/storage/files/${eq.id}/${encodeURIComponent(targetFileName)}`,
    isLocal: true,
  };

  if (!eq.documents) eq.documents = [];
  eq.documents.unshift(newDoc);
  eq.folderName = folderName;
  eq.updatedAt = new Date().toISOString();

  writeDatabase(db);

  res.json({
    success: true,
    document: newDoc,
    equipment: eq,
    message: `Saved ${targetFileName} to ${folderName}/`,
  });
});

// Upload appliance photo / image to its local folder
app.post('/api/equipment/:id/upload-image', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image file was provided.' });
    return;
  }

  const db = readDatabase();
  const eq = db.equipment.find((e) => e.id === req.params.id);
  if (!eq) {
    res.status(404).json({ error: 'Equipment not found' });
    return;
  }

  const storagePath = getStorageLocation(db);
  const { folderName, folderPath } = ensureEquipmentFolder(eq, storagePath);

  const rawOriginalName = req.file.originalname || 'equipment_photo.jpg';
  const ext = path.extname(rawOriginalName) || '.jpg';
  const targetFileName = `photo_${Date.now()}${ext}`;
  const targetPath = path.join(folderPath, targetFileName);

  fs.writeFileSync(targetPath, req.file.buffer);

  const imageUrl = `/api/storage/files/${eq.id}/${encodeURIComponent(targetFileName)}`;
  eq.imageUrl = imageUrl;
  eq.folderName = folderName;
  eq.updatedAt = new Date().toISOString();

  // Also add to documents so it shows up in file inventory
  if (!eq.documents) eq.documents = [];
  eq.documents.push({
    id: `doc-img-${Date.now()}`,
    title: 'Equipment Photo',
    fileName: targetFileName,
    filePath: path.join(folderName, targetFileName),
    fileSize: req.file.size,
    mimeType: req.file.mimetype || 'image/jpeg',
    fileType: 'Equipment Photo',
    dateAdded: new Date().toISOString().split('T')[0],
    url: imageUrl,
    isLocal: true,
  });

  writeDatabase(db);

  res.json({
    success: true,
    imageUrl,
    equipment: eq,
    message: `Equipment image saved to ${folderName}/${targetFileName}`,
  });
});

// Serve local equipment files directly (PDFs, images, documents) with security path verification
app.get('/api/storage/files/:equipmentId/:fileName', (req: Request, res: Response) => {
  const db = readDatabase();
  const eq = db.equipment.find((e) => e.id === req.params.equipmentId);
  if (!eq) {
    res.status(404).send('Equipment not found');
    return;
  }

  const storagePath = getStorageLocation(db);
  const folderName = getEquipmentFolderName(eq);
  const decodedFileName = path.basename(decodeURIComponent(req.params.fileName));
  const fullFolder = path.resolve(storagePath, folderName);
  const resolvedFile = path.resolve(fullFolder, decodedFileName);

  // Prevent directory traversal attacks
  if (!resolvedFile.startsWith(fullFolder)) {
    res.status(403).send('Forbidden file path access');
    return;
  }

  if (!fs.existsSync(resolvedFile)) {
    res.status(404).send('File not found on disk');
    return;
  }

  const ext = path.extname(decodedFileName).toLowerCase();
  if (ext === '.pdf') {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${decodedFileName}"`);
  } else if (['.jpg', '.jpeg'].includes(ext)) {
    res.setHeader('Content-Type', 'image/jpeg');
  } else if (ext === '.png') {
    res.setHeader('Content-Type', 'image/png');
  } else if (ext === '.webp') {
    res.setHeader('Content-Type', 'image/webp');
  } else {
    res.setHeader('Content-Disposition', `attachment; filename="${decodedFileName}"`);
  }

  res.sendFile(resolvedFile);
});

// Delete a document or file from an appliance's local folder
app.delete('/api/storage/files/:equipmentId/:fileName', (req: Request, res: Response) => {
  const db = readDatabase();
  const eq = db.equipment.find((e) => e.id === req.params.equipmentId);
  if (!eq) {
    res.status(404).json({ error: 'Equipment not found' });
    return;
  }

  const storagePath = getStorageLocation(db);
  const folderName = getEquipmentFolderName(eq);
  const decodedFileName = path.basename(decodeURIComponent(req.params.fileName));
  const fullFolder = path.resolve(storagePath, folderName);
  const resolvedFile = path.resolve(fullFolder, decodedFileName);

  // Prevent directory traversal attacks
  if (!resolvedFile.startsWith(fullFolder)) {
    res.status(403).json({ error: 'Forbidden file path access' });
    return;
  }

  if (fs.existsSync(resolvedFile)) {
    try {
      fs.unlinkSync(resolvedFile);
    } catch (err: any) {
      res.status(500).json({ error: `Could not delete file: ${err.message}` });
      return;
    }
  }

  // Remove from equipment documents
  if (eq.documents) {
    eq.documents = eq.documents.filter(
      (d: any) => d.fileName !== decodedFileName && !d.url?.includes(encodeURIComponent(decodedFileName))
    );
  }

  // Clear imageUrl if matching
  if (eq.imageUrl && eq.imageUrl.includes(encodeURIComponent(decodedFileName))) {
    eq.imageUrl = undefined;
  }

  eq.updatedAt = new Date().toISOString();
  writeDatabase(db);

  res.json({
    success: true,
    message: `File ${decodedFileName} deleted successfully.`,
    equipment: eq,
  });
});

// Scan appliance folder on disk and auto-catalog any manuals or files added externally (e.g. via Unraid share)
app.post('/api/equipment/:id/rescan-files', (req: Request, res: Response) => {
  const db = readDatabase();
  const eq = db.equipment.find((e) => e.id === req.params.id);
  if (!eq) {
    res.status(404).json({ error: 'Equipment not found' });
    return;
  }

  const storagePath = getStorageLocation(db);
  const { folderName, folderPath } = ensureEquipmentFolder(eq, storagePath);

  if (!eq.documents) eq.documents = [];
  const existingFiles = new Set(eq.documents.map((d: any) => d.fileName).filter(Boolean));

  let addedCount = 0;
  if (fs.existsSync(folderPath)) {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isFile() && ent.name !== 'appliance-info.json' && !ent.name.startsWith('.')) {
        if (!existingFiles.has(ent.name)) {
          const fullPath = path.join(folderPath, ent.name);
          const stat = fs.statSync(fullPath);
          const ext = path.extname(ent.name).toLowerCase();
          const isPdf = ext === '.pdf';
          const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);

          const newDoc = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: ent.name.replace(/_/g, ' ').replace(/\.[^/.]+$/, ''),
            fileName: ent.name,
            filePath: path.join(folderName, ent.name),
            fileSize: stat.size,
            mimeType: isPdf ? 'application/pdf' : isImage ? 'image/jpeg' : 'application/octet-stream',
            fileType: isPdf ? 'PDF Manual' : isImage ? 'Image / Photo' : 'Imported Document',
            dateAdded: new Date().toISOString().split('T')[0],
            url: `/api/storage/files/${eq.id}/${encodeURIComponent(ent.name)}`,
            isLocal: true,
          };
          eq.documents.push(newDoc);
          existingFiles.add(ent.name);
          addedCount++;
        }
      }
    }
  }

  if (addedCount > 0) {
    eq.updatedAt = new Date().toISOString();
    writeDatabase(db);
  }

  res.json({
    success: true,
    addedCount,
    message: addedCount > 0 ? `Imported ${addedCount} new file(s) from disk.` : 'All files on disk are already cataloged.',
    equipment: eq,
  });
});

// Service records endpoints
app.get('/api/service-records', (req: Request, res: Response) => {
  const db = readDatabase();
  const { equipmentId } = req.query;
  let records = db.serviceRecords || [];
  if (equipmentId) {
    records = records.filter((r) => r.equipmentId === equipmentId);
  }
  // Sort descending by date
  records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(records);
});

app.post('/api/service-records', (req: Request, res: Response) => {
  const db = readDatabase();
  const equipment = db.equipment.find((e) => e.id === req.body.equipmentId);

  const newRecord = {
    ...req.body,
    id: req.body.id || `srv-${Date.now()}`,
    equipmentName: equipment?.name || req.body.equipmentName || 'Unknown Appliance',
    createdAt: new Date().toISOString(),
  };

  db.serviceRecords.unshift(newRecord);

  // If nextServiceDueDate was provided or this was logged from a task, optionally update equipment
  if (equipment && req.body.taskId) {
    const task = equipment.maintenanceTasks?.find((t: any) => t.id === req.body.taskId);
    if (task) {
      task.lastCompletedDate = req.body.date;
      const nextDate = new Date(req.body.date);
      nextDate.setDate(nextDate.getDate() + (task.intervalDays || 90));
      task.nextDueDate = nextDate.toISOString().split('T')[0];
      equipment.updatedAt = new Date().toISOString();
    }
  }

  writeDatabase(db);
  res.status(201).json(newRecord);
});

app.delete('/api/service-records/:id', (req: Request, res: Response) => {
  const db = readDatabase();
  const initialCount = db.serviceRecords.length;
  db.serviceRecords = db.serviceRecords.filter((r) => r.id !== req.params.id);

  if (db.serviceRecords.length === initialCount) {
    res.status(404).json({ error: 'Service record not found' });
    return;
  }

  writeDatabase(db);
  res.json({ success: true, deletedId: req.params.id });
});

// Complete a maintenance task and auto-log service
app.post('/api/equipment/:id/tasks/:taskId/complete', (req: Request, res: Response) => {
  const db = readDatabase();
  const equipment = db.equipment.find((e) => e.id === req.params.id);
  if (!equipment) {
    res.status(404).json({ error: 'Equipment not found' });
    return;
  }

  const task = equipment.maintenanceTasks?.find((t: any) => t.id === req.params.taskId);
  if (!task) {
    res.status(404).json({ error: 'Maintenance task not found' });
    return;
  }

  const completionDate = req.body.date || new Date().toISOString().split('T')[0];
  const cost = Number(req.body.cost) || 0;
  const technician = req.body.technician || 'Self (Routine Maintenance)';
  const notes = req.body.notes || `Completed scheduled task: ${task.title}`;
  const parts = req.body.parts || task.filterOrPartSpecs || '';

  task.lastCompletedDate = completionDate;
  const nextDate = new Date(completionDate);
  nextDate.setDate(nextDate.getDate() + (task.intervalDays || 90));
  task.nextDueDate = nextDate.toISOString().split('T')[0];
  equipment.updatedAt = new Date().toISOString();

  // Create corresponding service record
  const newRecord = {
    id: `srv-${Date.now()}`,
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    date: completionDate,
    type: 'routine',
    technicianOrCompany: technician,
    cost,
    description: notes,
    partsReplaced: parts,
    nextServiceDueDate: task.nextDueDate,
    createdAt: new Date().toISOString(),
  };

  db.serviceRecords.unshift(newRecord);
  writeDatabase(db);

  res.json({
    success: true,
    task,
    serviceRecord: newRecord,
    equipment,
  });
});

// Settings & Pushover
app.get('/api/settings', (req: Request, res: Response) => {
  const db = readDatabase();
  res.json(db.settings);
});

app.post('/api/settings', (req: Request, res: Response) => {
  const db = readDatabase();
  db.settings = {
    ...db.settings,
    ...req.body,
  };
  writeDatabase(db);
  res.json(db.settings);
});

// Network host info (helps users scanning QR codes on local Wi-Fi / Unraid LAN)
app.get('/api/network/host-info', (req: Request, res: Response) => {
  try {
    const interfaces = os.networkInterfaces();
    const ips: string[] = [];
    for (const name of Object.keys(interfaces)) {
      const netList = interfaces[name];
      if (netList) {
        for (const net of netList) {
          if (net.family === 'IPv4' && !net.internal) {
            ips.push(net.address);
          }
        }
      }
    }
    res.json({
      ips,
      primaryIp: ips[0] || null,
      port: PORT,
    });
  } catch (err: any) {
    res.json({ ips: [], primaryIp: null, port: PORT });
  }
});

// Pushover Test endpoint
app.post('/api/pushover/test', async (req: Request, res: Response) => {
  const db = readDatabase();
  const userKey = req.body.userKey || db.settings.pushoverUserKey;
  const apiToken = req.body.apiToken || db.settings.pushoverApiToken;
  const sound = req.body.sound || db.settings.defaultSound || 'pushover';
  const device = req.body.device || db.settings.defaultDevice;

  if (!userKey || !apiToken) {
    res.status(400).json({
      error: 'Missing credentials. Please configure your Pushover User Key and Application API Token.',
    });
    return;
  }

  try {
    const result = await sendPushoverMessage({
      userKey,
      apiToken,
      title: 'EquipKeep • Unraid Node',
      message: '✅ Pushover alerts successfully connected! You will receive appliance maintenance and warranty expiration alerts here.',
      priority: 0,
      sound,
      device,
    });

    db.settings.lastTestedAt = new Date().toISOString();
    writeDatabase(db);

    res.json({
      success: true,
      message: 'Test notification sent successfully to your device!',
      pushoverResponse: result,
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Failed to send Pushover test message',
    });
  }
});

// Send custom or triggered Pushover alert
app.post('/api/pushover/send-alert', async (req: Request, res: Response) => {
  const db = readDatabase();
  const { title, message, priority, sound, equipmentId, device } = req.body;

  const userKey = db.settings.pushoverUserKey;
  const apiToken = db.settings.pushoverApiToken;

  if (!userKey || !apiToken) {
    res.status(400).json({
      error: 'Pushover is not configured yet. Please enter your User Key and API Token in Settings.',
    });
    return;
  }

  try {
    const result = await sendPushoverMessage({
      userKey,
      apiToken,
      title: title || 'EquipKeep Alert',
      message: message || 'Equipment maintenance notification',
      priority: priority !== undefined ? Number(priority) : (db.settings.defaultPriority ?? 0),
      sound: sound || db.settings.defaultSound || 'pushover',
      device: device || db.settings.defaultDevice,
    });

    res.json({
      success: true,
      message: 'Alert sent to your phone via Pushover!',
      result,
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Failed to dispatch alert to Pushover',
    });
  }
});

// Scan all equipment and dispatch comprehensive maintenance & warranty summary alert
app.post('/api/pushover/check-and-notify', async (req: Request, res: Response) => {
  const db = readDatabase();
  const userKey = db.settings.pushoverUserKey;
  const apiToken = db.settings.pushoverApiToken;

  if (!userKey || !apiToken) {
    res.status(400).json({
      error: 'Pushover is not configured yet. Please configure your credentials in Settings.',
    });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks: { equipmentName: string; taskTitle: string; daysOverdue: number }[] = [];
  const dueSoonTasks: { equipmentName: string; taskTitle: string; daysLeft: number }[] = [];
  const expiringWarranties: { equipmentName: string; daysLeft: number; expirationDate: string }[] = [];

  db.equipment.forEach((eq) => {
    // Skip equipment if alerts are disabled for this item
    if (eq.disableAlerts) {
      return;
    }

    // Check maintenance tasks
    eq.maintenanceTasks?.forEach((task: any) => {
      if (task.nextDueDate) {
        const dueDate = new Date(task.nextDueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          overdueTasks.push({
            equipmentName: eq.name,
            taskTitle: task.title,
            daysOverdue: Math.abs(diffDays),
          });
        } else if (diffDays <= 7) {
          dueSoonTasks.push({
            equipmentName: eq.name,
            taskTitle: task.title,
            daysLeft: diffDays,
          });
        }
      }
    });

    // Check warranties (skip if disabled or no warranty)
    if (
      eq.warranty &&
      eq.warranty.type !== 'none' &&
      !eq.warranty.disableAlerts &&
      !eq.warranty.hasLifetimeWarranty &&
      eq.warranty.expirationDate
    ) {
      const expDate = new Date(eq.warranty.expirationDate);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const threshold = db.settings.notifyOnWarrantyDays || 30;
      if (diffDays >= 0 && diffDays <= threshold) {
        expiringWarranties.push({
          equipmentName: eq.name,
          daysLeft: diffDays,
          expirationDate: eq.warranty.expirationDate,
        });
      }
    }
  });

  const totalItems = overdueTasks.length + dueSoonTasks.length + expiringWarranties.length;
  if (totalItems === 0) {
    res.json({
      success: true,
      notified: false,
      message: 'All equipment is up to date! No maintenance overdue or warranties expiring soon.',
      summary: { overdueTasks: 0, dueSoonTasks: 0, expiringWarranties: 0 },
    });
    return;
  }

  // Build message
  let message = '';
  if (overdueTasks.length > 0) {
    message += `⚠️ OVERDUE MAINTENANCE (${overdueTasks.length}):\n`;
    overdueTasks.slice(0, 3).forEach((t) => {
      message += `• ${t.equipmentName}: ${t.taskTitle} (${t.daysOverdue}d overdue)\n`;
    });
    if (overdueTasks.length > 3) message += `+ ${overdueTasks.length - 3} more overdue\n`;
    message += '\n';
  }

  if (dueSoonTasks.length > 0) {
    message += `📅 DUE NEXT 7 DAYS (${dueSoonTasks.length}):\n`;
    dueSoonTasks.slice(0, 3).forEach((t) => {
      message += `• ${t.equipmentName}: ${t.taskTitle} (in ${t.daysLeft}d)\n`;
    });
    message += '\n';
  }

  if (expiringWarranties.length > 0) {
    message += `🛡️ EXPIRING WARRANTIES (${expiringWarranties.length}):\n`;
    expiringWarranties.forEach((w) => {
      message += `• ${w.equipmentName}: ${w.daysLeft === 0 ? 'Expires today' : `in ${w.daysLeft} days`} (${w.expirationDate})\n`;
    });
  }

  try {
    const pushoverResult = await sendPushoverMessage({
      userKey,
      apiToken,
      title: `EquipKeep: ${totalItems} Maintenance/Warranty Alert${totalItems > 1 ? 's' : ''}`,
      message: message.trim(),
      priority: overdueTasks.length > 0 ? 1 : 0,
      sound: db.settings.defaultSound || 'bike',
      device: db.settings.defaultDevice,
    });

    res.json({
      success: true,
      notified: true,
      message: `Pushover alert dispatched to your phone with ${totalItems} item(s)!`,
      summary: {
        overdueCount: overdueTasks.length,
        dueSoonCount: dueSoonTasks.length,
        expiringWarrantiesCount: expiringWarranties.length,
      },
      pushoverResponse: pushoverResult,
    });
  } catch (err: any) {
    res.status(500).json({
      error: err.message || 'Failed to dispatch alert to Pushover',
    });
  }
});

// Backup Export for Unraid
app.get('/api/backup/export', (req: Request, res: Response) => {
  const db = readDatabase();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=equipkeep-unraid-backup-${new Date().toISOString().split('T')[0]}.json`
  );
  res.send(JSON.stringify(db, null, 2));
});

// Download Unraid XML template
app.get('/api/unraid-template/download', (req: Request, res: Response) => {
  const templatePath = path.join(process.cwd(), 'unraid-template.xml');
  if (fs.existsSync(templatePath)) {
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename=my-EquipKeep.xml');
    res.send(fs.readFileSync(templatePath, 'utf-8'));
  } else {
    res.status(404).send('Template not found');
  }
});

// Backup Import
app.post('/api/backup/import', (req: Request, res: Response) => {
  const backupData = req.body;
  if (!backupData || !Array.isArray(backupData.equipment)) {
    res.status(400).json({ error: 'Invalid backup file format. Must contain equipment array.' });
    return;
  }

  const restored: DatabaseSchema = {
    equipment: backupData.equipment || [],
    serviceRecords: backupData.serviceRecords || [],
    settings: backupData.settings || DEFAULT_DATA.settings,
  };

  writeDatabase(restored);
  res.json({
    success: true,
    message: `Successfully restored ${restored.equipment.length} equipment items and ${restored.serviceRecords.length} service records!`,
  });
});

// AI Assistant for Appliance Maintenance Schedules & Filter Specs
app.post('/api/ai/suggest-maintenance', async (req: Request, res: Response) => {
  const { brand, modelNumber, name, category } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Return smart fallback heuristics if Gemini key is not configured
    res.json({
      success: true,
      isAi: false,
      suggestions: [
        {
          title: 'Clean / Replace Filter',
          intervalDays: 90,
          priority: 'high',
          instructions: 'Inspect and replace or clean primary air/water filter cartridge.',
        },
        {
          title: 'Deep Clean & Inspection',
          intervalDays: 180,
          priority: 'normal',
          instructions: 'Inspect seals, electrical connections, and vacuum dust from vents.',
        },
        {
          title: 'Annual Professional Service',
          intervalDays: 365,
          priority: 'normal',
          instructions: 'Check refrigerant/pressures, lubricate moving parts, verify safety cutoffs.',
        },
      ],
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a home appliance and equipment technician. The user has this equipment:
Name: ${name || 'Home Appliance'}
Brand: ${brand || 'Unknown'}
Model Number: ${modelNumber || 'Unknown'}
Category: ${category || 'General'}

Provide 2 to 4 realistic, recommended routine maintenance tasks with recommended intervals in days, priority (high or normal), recommended filter or replacement part specs, and step-by-step instructions.
Return ONLY valid JSON matching this schema:
[
  {
    "title": "Task title",
    "intervalDays": 90,
    "priority": "normal" | "high",
    "filterOrPartSpecs": "Part or filter details if applicable",
    "instructions": "Clear concise instructions"
  }
]`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text?.trim() || '[]';
    const suggestions = JSON.parse(text);
    res.json({ success: true, isAi: true, suggestions });
  } catch (err: any) {
    console.error('AI Suggestion error:', err);
    res.json({
      success: true,
      isAi: false,
      suggestions: [
        {
          title: 'Routine Inspection & Filter Clean',
          intervalDays: 90,
          priority: 'normal',
          instructions: 'Inspect for wear and clean dust or debris.',
        },
      ],
    });
  }
});

// AI Assistant: Find Manual & Documentation Resources Online
app.post('/api/ai/find-manuals', async (req: Request, res: Response) => {
  const { brand, modelNumber, name, category } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  const b = brand ? brand.trim() : '';
  const m = modelNumber ? modelNumber.trim() : '';
  const n = name ? name.trim() : 'Appliance';

  const searchQuery = `${b} ${m} ${n} user manual owner guide pdf`.replace(/\s+/g, ' ').trim();
  const directGoogleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  const manualslibSearchUrl = `https://www.manualslib.com/search.html?q=${encodeURIComponent(`${b} ${m}`.trim() || n)}`;

  if (!apiKey) {
    res.json({
      success: true,
      isAi: false,
      searchQuery,
      googleSearchUrl: directGoogleSearchUrl,
      manualslibSearchUrl,
      links: [
        {
          title: `Google Search: "${searchQuery}"`,
          url: directGoogleSearchUrl,
          source: 'Google Search',
          description: 'Instant web search for PDF owner guides, installation manuals, and wiring diagrams.',
        },
        {
          title: `ManualsLib Catalog Search: ${b} ${m || n}`,
          url: manualslibSearchUrl,
          source: 'ManualsLib Database',
          description: 'Free searchable library with thousands of appliance and power equipment manuals.',
        },
      ],
      tips: [
        'Look for results ending in .pdf or hosted directly on the manufacturer portal.',
        'Once downloaded, drag and drop the PDF into this equipment folder to keep it offline on your server.',
      ],
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are an expert appliance and equipment technical archivist.
Equipment:
Name: ${n}
Brand: ${b || 'Unknown'}
Model Number: ${m || 'Unknown'}
Category: ${category || 'General'}

Provide high-value guidance on where and how to find the official manufacturer PDF user manual, wiring schematics, and parts lists.
If known for this brand/model, provide realistic direct official support portal URLs (e.g. carrier.com/residential/en/us/technical-support, geappliances.com/ge/service-and-support/manuals.htm, rheem.com/support/product-literature, toro.com/en/parts).

Return ONLY valid JSON matching this schema:
{
  "recommendedPortals": [
    {
      "title": "Portal or document name",
      "url": "https://example.com/support",
      "source": "Manufacturer / Database name",
      "description": "Short explanation of what will be found here"
    }
  ],
  "exactSearchTerms": [
    "search query 1",
    "search query 2"
  ],
  "modelDecodingTips": "Short advice on where the model sticker is located or how to decode revision letters."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    const links = [
      {
        title: `Google Search: "${searchQuery}"`,
        url: directGoogleSearchUrl,
        source: 'Google PDF Search',
        description: 'Instant Google search targeted for downloadable manufacturer PDF manuals.',
      },
      {
        title: `ManualsLib: ${b} ${m || n}`,
        url: manualslibSearchUrl,
        source: 'ManualsLib',
        description: 'Search repository of over 5 million free user manuals and parts catalogs.',
      },
      ...(Array.isArray(parsed.recommendedPortals) ? parsed.recommendedPortals : []),
    ];

    res.json({
      success: true,
      isAi: true,
      searchQuery,
      googleSearchUrl: directGoogleSearchUrl,
      manualslibSearchUrl,
      links,
      exactSearchTerms: parsed.exactSearchTerms || [searchQuery],
      modelDecodingTips: parsed.modelDecodingTips || '',
      tips: [
        'Download the official PDF to your computer or phone.',
        'Drag and drop the file directly into EquipKeep to archive it permanently on your server array.',
      ],
    });
  } catch (err: any) {
    console.error('AI Find Manuals error:', err);
    res.json({
      success: true,
      isAi: false,
      searchQuery,
      googleSearchUrl: directGoogleSearchUrl,
      manualslibSearchUrl,
      links: [
        {
          title: `Google Search: "${searchQuery}"`,
          url: directGoogleSearchUrl,
          source: 'Google Search',
          description: 'Instant web search for PDF owner guides, installation manuals, and wiring diagrams.',
        },
        {
          title: `ManualsLib: ${b} ${m || n}`,
          url: manualslibSearchUrl,
          source: 'ManualsLib Database',
          description: 'Free searchable library with thousands of appliance and power equipment manuals.',
        },
      ],
      tips: [
        'Look for results ending in .pdf or hosted directly on the manufacturer portal.',
        'Once downloaded, drag and drop the PDF into this equipment folder to keep it offline on your server.',
      ],
    });
  }
});

// Vite middleware for development / static serving for production
async function startServer() {
  // Sync all appliance folders on disk at startup
  try {
    const db = readDatabase();
    const result = syncAllEquipmentFolders(db);
    writeDatabase(db);
    console.log(`[Storage] Initialized ${result.total} appliance folder(s) at: ${result.storagePath}`);
  } catch (err) {
    console.error('[Storage] Error synchronizing initial folders:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EquipKeep Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
