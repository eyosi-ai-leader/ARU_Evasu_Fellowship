const images = (folder, names) =>
  names.map((name) => `/images/${folder}/${name}.jpg`);

export const eventsPage = {
  hero: {
    eyebrow: "Events & gallery",
    title: "What's happening on our campuses",
    description:
      "See what is coming up in every fellowship, and look back at the moments we have shared together.",
    image: "/images/events/NLS_3.jpg",
  },

  introduction: {
    subtitle: "What's on",
    title: "Upcoming events",
    description:
      "Choose a fellowship to see what is happening where you are.",
  },

  // "match" words are looked for in the campus name that comes from the
  // dashboard. Events with no campus are shown under General.
  filters: [
    { id: "all", label: "All" },
    { id: "main", label: "Main Campus", match: ["main"] },
    { id: "health", label: "Health Campus", match: ["health"] },
    { id: "agriculture", label: "Agriculture Campus", match: ["agri"] },
    { id: "bekoji", label: "Bekoji Campus", match: ["bekoji"] },
    { id: "general", label: "General" },
  ],

  // type: "announcement" | "ad". Examples: replace with your own, or leave
  // the list empty ([]) to hide this section.
  notices: [
    {
      type: "announcement", // "announcement" (gold) or "ad" (dark)
      title: "Welcome, students!",
      text: "New to the university? Find your fellowship and join us this week.",
      href: "/fellowships",
      cta: "Find your fellowship", // the link text; delete this line for no link
    },
    {
      type: "ad",
      title: "Arsi University Evasu Fellowship Official Website",
      text: "Visit our official website for more information about our fellowships, events, and community activities.",
      href: "/contact",
      cta: "Contact us",
    },
  ],

  gallery: {
    intro: {
      subtitle: "Gallery",
      title: "Moments we have shared",
      description:
        "Trainings, missions, family days and everyday joy from our fellowships. Tap a photo to see it larger.",
    },

    albums: [
      {
        id: "kairos",
        title: "Kairos Training",
        photos: [
          ...images("events", [
            "Kairos_1",
            "Kairos_3",
            "Kairos_4",
            "Kairos_5",
            "Kairos_9",
            "Kairos_10",
            "Kairos_12",
            "Kairos_14",
            "Kairos_15",

          ]),
          ...images("about", ["Kairos_2", "Kairos_8"]),
          ...images("Welcome", ["Kairos_6", "Kairos_13"]),
          ...images("ministries", ["Kairos_7", "Kairos_11"]),
        ],
      },
      {
        id: "dera",
        title: "Dera Mission",
        photos: images("events", [
          "Dera_mission_1",
          "Dera_mission_2",
          "Dera_mission_3",
          "Dera_mission_4",
          "Dera_mission_5",
          "Dera_mission_6",
          "Dera_mission_7",
          "Dera_mission_8",
        ]),
      },
      {
        id: "asela",
        title: "Asela Mission",
        photos: images("events", [
          "Asela_mission",
          "Asela_mission_1",
          "Asela_mission_2",
         
        ]),
      },
      {
        id: "eteya",
        title: "Eteya Mission",
        photos: [
          ...images("events", [
            "Eteya_mission_1",
            "Eteya_mission_2",
            "Eteya_mission_4",
            "Eteya_mission_5",

          ]),
          ...images("hero", ["Eteya_mission_3"]),
        ],
      },
      {
        id: "family",
        title: "Family Day",
        photos: [
          ...images("Welcome", ["Family_1", "Family_3"]),
          ...images("ministries", ["Family_2"]),
          ...images("events", ["Family_4", "Family_5", "Family_7"]),
          ...images("hero", ["Family_6" , "Family_E2"]),
        ],
      },
      {
        id: "football",
        title: "Football",
        photos: images("events", ["Football", "Football_1", "Football_2"]),
      },
      {
        id: "fellowship",
        title: "Conferences & Fellowship",
        photos: [
          ...images("about", ["GC_1", "NLS_2" , "Art_Ardu_1","Art_Ardu_2", "Art_Ardu_3" ]),
          ...images("events", [
            "GC_2",
            "GC_4",
            "GF_2",
            "NLS_1",
            "Fellowship_2",
            "Fellowship_3",
            "Fellowship_4",
            "Fellowship_5",
            "Images_3",
            "NLS_2", "NLS_3" ,"NLS_4", "NLS_5"

          ]),
          ...images("hero", ["GC_3", "Fellowship" ,"GF_2"]),
          ...images("sermons", ["GF_1" ]),
          ...images("Welcome", ["Fellowship_1", "Images_2"]),
          ...images("ministries", ["Images_1"]),
        ],
      },
    ],
  },
};

export default eventsPage;