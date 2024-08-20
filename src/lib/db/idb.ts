import { openDB, DBSchema, wrap } from "idb";

interface ParkingLotDB extends DBSchema {
	slots: {
		key: number;
		value: boolean;
	};
	reservations: {
		key: string;
		value: {
			id: string;
			vehicleId: string;
			slotIndex: number;
			entryDate: string;
			exitDate: string | null;
		};
		indexes: { "by-vehicle": string; "by-slot": number; "by-exit": string };
	};
	customers: {
		key: string;
		value: {
			id: string;
			name: string;
			email: string;
			phone: number;
			taxpayerRegistration: number;
		};
	};
	vehicles: {
		key: string;
		value: {
			id: string;
			brand: string;
			model: string;
			year: number;
			color: string;
			variant: string;
			licensePlate: string;
			driverId: string;
		};
		indexes: { "by-driver": string };
	};
	users: {
		key: string;
		value: {
			id: string;
			name: string;
			email: string;
			address: string;
			operatingHour: string;
		};
	};
}

const dbPromise = openDB<ParkingLotDB>("parSlotMapDB", 1, {
	upgrade(db) {
		db.createObjectStore("slots");
		const historyStore = db.createObjectStore("reservations", {
			keyPath: "id",
		});
		historyStore.createIndex("by-vehicle", "vehicleId");
		historyStore.createIndex("by-slot", "slotIndex");
		historyStore.createIndex("by-exit", "exitDate");
	},
});

export default dbPromise;

export async function getSlots() {
	const db = await dbPromise;
	return db.getAll("slots");
}

export async function setSlots(slots: boolean[]) {
	const db = await dbPromise;
	const tx = db.transaction("slots", "readwrite");
	await Promise.all(
		slots.map((isReserved, index) => tx.store.put(isReserved, index))
	);
	await tx.done;
}

export async function getOpenReservations() {
	const db = await dbPromise;
	const allReservations = await db.getAll("reservations");

	const allOpenReservations = allReservations.filter(
		(r) => r.exitDate === null
	);
	return allOpenReservations;
}

export async function getReservations() {
	const db = await dbPromise;
	return db.getAll("reservations");
}

export async function addReservation(reservation: Reservation) {
	const db = await dbPromise;
	await db.add("reservations", reservation);
}

export async function updateReservation(reservation: Reservation) {
	const db = await dbPromise;
	await db.put("reservations", reservation);
}

export type Reservation = ParkingLotDB["reservations"]["value"];
export type Customer = ParkingLotDB["customers"]["value"];

export enum Stores {
	ParkingLots = "parkingLots",
	Slots = "slots",
	Customers = "customers",
	Vehicles = "vehicles",
	Reserves = "reserves",
}