import mapData from "./data/data.json";

export type Question = {
  id: number;
  name: string;
};

export type Answer = Question & {
  status: "CORRECT" | "MEH" | "FAILED";
};

export type Feature = typeof mapData["features"][0];
