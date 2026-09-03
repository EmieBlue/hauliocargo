/** Shared surface colours for every 3D scene, kept in step with globals.css. */
export const MAT = {
  /* Classic hire-truck livery: white cab, yellow box. The white cab is what
     stops the two volumes merging into one mass at hero scale. */
  bodyCab: "#e4e5e9",
  bodyBox: "#ffc02b",

  /* Everything below the body: chassis, bumper, arches, mirrors, frames. */
  trim: "#121216",

  brand: "#ffc02b",
  brandDeep: "#f5a302",
  amber: "#ff9d1c",

  tyre: "#0b0b0d",
  rim: "#c8ccd4",
  chrome: "#c3c3cc",
  /* Extruded aluminium rails around the box edges — the detail that stops it
     reading as a plain rectangle. */
  alu: "#b9bdc6",
  /* Cool streak colour. Near-white trails cut a bright diagonal across the
     hero and fight the headline. */
  trail: "#5f6b80",
  glass: "#33465a",
  headlight: "#fff4d6",
  cabin: "#4a4f5a",
  ink: "#050505",
} as const;
