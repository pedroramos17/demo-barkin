// src/features/parkingSlot/parkingSlotSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Booking } from "@/lib/db/idb";
import {
	addBooking,
	getOpenBookings,
	getBookings,
	getSlots,
	updateBooking,
	setSlots,
} from "@/lib/repositories/parkingSlotRepository";
interface OpenBookings {
	slotIndex: number;
	vehicleId: string | null;
}

interface ParkingSlotState {
	slots: boolean[];
	openBookings: OpenBookings[];
	bookings: Booking[];
	status: "idle" | "loading" | "failed";
	error: string | null;
}
const initialState: ParkingSlotState = {
	slots: [],
	openBookings: [],
	bookings: [],
	status: "idle",
	error: null,
};

export const initializeFromDB = createAsyncThunk(
	"parkingSlot/initializeFromDB",
	async () => {
		const [slots, openBookings, bookings] = await Promise.all([
			getSlots(),
			getOpenBookings(),
			getBookings(),
		]);
		return {
			slots,
			openBookings,
			bookings,
		};
	}
);

export const initializeSlotsAsync = createAsyncThunk(
	"parkingSlot/initializeSlots",
	async (slotCount: number) => {
		let slots = await getSlots();
		if (slots.length !== slotCount) {
			slots = new Array(slotCount).fill(false);
		}
		const openBookings = await getOpenBookings();
		await setSlots(slots);
		return { slots, openBookings };
	}
);

export const reserveSlotAsync = createAsyncThunk(
	"parkingSlot/reserveSlot",
	async ({ vehicleId }: { vehicleId: string }, { getState }) => {
		const state = getState() as { parkingSlot: ParkingSlotState };
		const index = state.parkingSlot.slots.findIndex(
			(isReserved) => !isReserved
		);
		if (index !== -1) {
			const newSlots = [...state.parkingSlot.slots];
			newSlots[index] = true;
			const newOpenBookings = [
				...state.parkingSlot.openBookings,
				{
					slotIndex: index,
					vehicleId: vehicleId,
				},
			];
			const newBooking: Booking = {
				id: Date.now().toString(),
				vehicleId,
				slotIndex: index,
				entryDate: new Date(),
				exitDate: null,
			};
			await Promise.all([setSlots(newSlots), addBooking(newBooking)]);
			return { index, vehicleId, newBooking, newOpenBookings };
		}
		throw new Error("No available slots");
	}
);

export const freeSlotAsync = createAsyncThunk(
	"parkingSlot/freeSlot",
	async (slotIndex: number, { getState }) => {
		const state = getState() as { parkingSlot: ParkingSlotState };
		if (state.parkingSlot.slots[slotIndex]) {
			const newSlots = [...state.parkingSlot.slots];
			newSlots[slotIndex] = false;
			// Create a new object without the slotIndex property
			const newOpenBookings = [...state.parkingSlot.openBookings].filter(
				(r) => r.slotIndex !== slotIndex
			);

			const vehicleId = state.parkingSlot.openBookings.find(
				(r) => r.slotIndex === slotIndex
			)?.vehicleId;
			const booking = state.parkingSlot.bookings.find(
				(r) =>
					r.vehicleId === vehicleId &&
					r.slotIndex === slotIndex &&
					r.exitDate === null
			);
			if (booking) {
				const updatedBooking = {
					...booking,
					exitDate: new Date(),
				};
				await Promise.all([
					setSlots(newSlots),
					updateBooking(updatedBooking),
				]);
				return {
					slotIndex,
					updatedBooking,
					newOpenBookings,
				};
			}
		}
		throw new Error("Slot not reserved or booking not found");
	}
);

export const parkingSlotSlice = createSlice({
	name: "parkingSlot",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(initializeFromDB.pending, (state) => {
				state.status = "loading";
			})
			.addCase(initializeFromDB.fulfilled, (state, action): any => {
				state.status = "idle";
				state.slots = action.payload.slots;
				state.openBookings = action.payload.openBookings;
				state.bookings = action.payload.bookings;
			})
			.addCase(initializeFromDB.rejected, (state, action) => {
				state.status = "failed";
				state.error =
					action.error.message ?? "Failed to initialize from DB";
			})
			.addCase(initializeSlotsAsync.fulfilled, (state, action) => {
				state.slots = action.payload.slots;
				state.openBookings = action.payload.openBookings;
			})
			.addCase(reserveSlotAsync.fulfilled, (state, action) => {
				state.slots[action.payload.index] = true;
				state.openBookings = action.payload.newOpenBookings;
				state.bookings.push(action.payload.newBooking);
			})
			.addCase(freeSlotAsync.fulfilled, (state, action) => {
				state.slots[action.payload.slotIndex] = false;
				state.openBookings = action.payload.newOpenBookings;
				const index = state.bookings.findIndex(
					(r) => r.id === action.payload.updatedBooking.id
				);
				if (index !== -1) {
					state.bookings[index] = action.payload.updatedBooking;
				}
			});
	},
});

export default parkingSlotSlice.reducer;
