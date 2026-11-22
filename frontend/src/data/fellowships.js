const leaders = (names, phonePrefix) => {
  const roles = [
    "Chairperson",
    "Vice Chairperson",
    "Secretary",
    "Treasurer",
    "Worship Leader",
    "Prayer Coordinator",
    "Evangelism Coordinator",
  ];

  return roles.map((role, i) => ({
    role,
    name: names[i],
    phone: `${phonePrefix}${i + 1}`,
  }));
};

export const fellowships = [
  {
    slug: "main-campus",
    name: "Main Campus Fellowship",
    short: "Main Campus",
    description:
      "Students on the main campus gathering to pray, study the Bible and serve together.",
    image: "/images/hero/Fellowship.jpg",
    meeting: {
      day: "Friday",
      time: "11:00 AM",
      place: "Main Campus Hall (example)",
    },
    contact: {
      name: "Contact Person Name",
      phone: "+251 900 000 101",
      email: "main@arsievasu.example",
      telegram: "https://t.me/your-main-campus",
    },
    leaders: leaders(
      ["Abel Tesfaye", "Selam Bekele", "Dawit Alemu", "Hana Girma", "Yonas Mulu", "Ruth Tadesse", "Samuel Haile"],
      "+251 900 000 11"
    ),
  },
  {
    slug: "health-campus",
    name: "Health Campus Fellowship",
    short: "Health Campus",
    description:
      "Health science students growing in faith and serving with compassion.",
    image: "/images/hero/Family_6.jpg",
    meeting: {
      day: "Thursday",
      time: "6:30 PM",
      place: "Health Campus Hall (example)",
    },
    contact: {
      name: "Contact Person Name",
      phone: "+251 900 000 102",
      email: "health@arsievasu.example",
      telegram: "https://t.me/your-health-campus",
    },
    leaders: leaders(
      ["Meron Asfaw", "Kidus Wolde", "Bethel Fikru", "Nahom Lemma", "Liya Seyoum", "Eden Kassa", "Biniam Teshome"],
      "+251 900 000 12"
    ),
  },
  {
    slug: "agriculture-campus",
    name: "Agriculture Campus Fellowship",
    short: "Agriculture Campus",
    description:
      "Agriculture students meeting to worship, learn God's Word and encourage one another.",
    image: "/images/hero/Eteya_mission_3.jpg",
    meeting: {
      day: "Wednesday",
      time: "6:30 PM",
      place: "Agriculture Campus Hall (example)",
    },
    contact: {
      name: "Contact Person Name",
      phone: "+251 900 000 103",
      email: "agriculture@arsievasu.example",
      telegram: "https://t.me/your-agriculture-campus",
    },
    leaders: leaders(
      ["Tsion Mekonnen", "Eyob Gashaw", "Mahlet Abera", "Robel Dessie", "Saron Negash", "Henok Worku", "Blen Tilahun"],
      "+251 900 000 13"
    ),
  },
  {
    slug: "bekoji-campus",
    name: "Bekoji Campus Fellowship",
    short: "Bekoji Campus",
    description:
      "Students at the Bekoji campus coming together in prayer, worship and fellowship.",
    image: "/images/hero/GC_3.jpg",
    meeting: {
      day: "Tuesday",
      time: "6:30 PM",
      place: "Bekoji Campus Hall (example)",
    },
    contact: {
      name: "Contact Person Name",
      phone: "+251 900 000 104",
      email: "bekoji@arsievasu.example",
      telegram: "https://t.me/your-bekoji-campus",
    },
    leaders: leaders(
      ["Natnael Desta", "Rediet Amare", "Fitsum Lakew", "Mihret Yosef", "Elias Berhanu", "Tigist Alem", "Kaleb Shiferaw"],
      "+251 900 000 14"
    ),
  },
  {
    slug: "general",
    name: "General Fellowship",
    short: "General",
    description:
      "All the campus fellowships together: conferences, outreach and shared programs.",
    image: "/images/about/GC_1.jpg",
    meeting: {
      day: "Saturday",
      time: "9:00 AM",
      place: "To be announced (example)",
    },
    contact: {
      name: "Contact Person Name",
      phone: "+251 900 000 105",
      email: "general@arsievasu.example",
      telegram: "https://t.me/your-general-fellowship",
    },
    leaders: leaders(
      ["Daniel Yilma", "Sara Getachew", "Mikias Ayele", "Lidya Hailu", "Amanuel Zewdu", "Betty Solomon", "Habtamu Kebede"],
      "+251 900 000 15"
    ),
  },
];

// Shared by all fellowships. Examples: change to the real people later.
export const fullTimeStaff = [
  { name: "Staff Member One", role: "Full-time Staff", phone: "+251 900 000 201" },
  { name: "Staff Member Two", role: "Full-time Staff", phone: "+251 900 000 202" },
  { name: "Staff Member Three", role: "Full-time Staff", phone: "+251 900 000 203" },
];

export const regionalCoordinator = {
  name: "Regional Coordinator Name",
  role: "Regional Coordinator",
  phone: "+251 900 000 200",
};

export const getFellowship = (slug) =>
  fellowships.find((item) => item.slug === slug);