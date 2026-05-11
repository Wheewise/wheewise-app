export interface RtoVehicle {
  regNumber: string;
  make: string;
  model: string;
  year: number;
  fuelType: string;
  engineCc: number | null;
  color: string | null;
}

const mockRto: Record<string, RtoVehicle> = {
  MH02AB1234: {
    regNumber: "MH02AB1234",
    make: "Maruti Suzuki",
    model: "Swift VXI",
    year: 2019,
    fuelType: "PETROL",
    engineCc: 1197,
    color: "White",
  },
  DL01CD5678: {
    regNumber: "DL01CD5678",
    make: "Hyundai",
    model: "Creta SX",
    year: 2021,
    fuelType: "DIESEL",
    engineCc: 1493,
    color: "Phantom Black",
  },
  KA03EF9012: {
    regNumber: "KA03EF9012",
    make: "Honda",
    model: "City V",
    year: 2020,
    fuelType: "PETROL",
    engineCc: 1498,
    color: "Golden Brown",
  },
};

export async function fetchRto(regNumber: string): Promise<RtoVehicle | null> {
  const cleaned = regNumber.replace(/[\s-]/g, "").toUpperCase();
  const fromMock = mockRto[cleaned];
  if (fromMock) return fromMock;

  return null;
}
