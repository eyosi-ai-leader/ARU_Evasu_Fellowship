export const BRAND = {
  name: "Arsi University Evasu Fellowship",
  university: "Arsi University",
  shortName: "Evasu Fellowship",
  parentOrg: "Evangelical Students' and Graduates' Union of Ethiopia (EvaSUE)",
  tagline:
    "Students and graduates growing together in faith, love and service.",

  // File inside the /public folder. Change this if your file has a
  // different name or extension (.jpg, .svg, .webp ...).
  logo: "/images/aru_evasu_fellowship_logo.jpg",

  address: {
    lines: ["Arsi University", "Asella, Oromia, Ethiopia"],
    note: "About 175 km southeast of Addis Ababa",
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Arsi+University+Asella+Ethiopia",
    universityUrl: "https://arsiun.edu.et",
  },

  // The fellowship's own contact details. Leave "" to hide them.
  email: "",
  phone: "",

  // Add the link when you have it; entries with an empty href are hidden.
  socials: [
    { name: "Facebook", href: "" },
    { name: "Telegram", href: "" },
    { name: "YouTube", href: "" },
    { name: "Instagram", href: "" },
  ],

  campuses: [
    "Main Campus Fellowship",
    "Health Campus Fellowship",
    "Agriculture Campus Fellowship",
  ],

  // Shown in the footer so people can contact the developer.
  developer: {
    name: "Eyosiyas H/Michael",
    email: "eyosi4314@gmail.com",
    phone: "0923 078 426",
    phoneLink: "+251923078426",
    portfolioUrl: "https://eyosiyas-portifolio.vercel.app/", // e.g. "https://your-portfolio.vercel.app"
    pitch: "Need a website like this?",
  },
};