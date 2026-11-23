const leaders = (names, phonePrefix) => {
  const roles = [
    "Chairperson",
    "Vice Chairperson",
    "Secretary",
    "Treasurer",
    "Auditor",
    "Team Coordinator",
    "Team Coordinator",
  ];

  return roles.map((role, i) => ({
    role,
    name: names[i],
    phone: `${phonePrefix}${i + 1}`,
  }));
};

export const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

export const fellowships = [
  {
    slug: "main-campus",
    name: "Main Campus Fellowship",
    short: "Main Campus",
    description:
      "Students on the main campus gathering to pray, study the Bible and serve together.",
    about:
      "The Main Campus Fellowship is where many students first meet the family. We worship, study the Bible in small groups and serve our campus together. New students are always welcome.",
    image: "/images/hero/Fellowship.jpg",
    program: { day: "Thursday", time: "11:00", place: "Bethel Mekaneyesus Church" },
    contact: {
      name: "Bereket Hailu",
      phone: "+251 94 582 3539",
      email: "main@arsievasu.example",
      telegram: "https://t.me/Arsiufellow",
    },
    leaders: leaders(
      ["Bereket Hailu", "Tekalgn Bogale", "Yodahe Hailemichael ", " Yididiya Tlahun", "Alazar Adane", "", ""],
      "+251 992912263"
    ),
  },
  {
    slug: "health-campus",
    name: "Health Campus Fellowship",
    short: "Health Campus",
    description:
      "Health science students growing in faith and serving with compassion.",
    about:
      "The Health Campus Fellowship brings health science students together to grow in faith, support one another through demanding studies, and serve with compassion.",
    image: "/images/hero/Family_6.jpg",
    program: { day: "Friday", time: "11:30", place: "Muluwengel Kuter 1" },
    contact: {
      name: "Tariku Lemesa",
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
    about:
      "The Agriculture Campus Fellowship is a warm community of students who worship, learn God's Word and encourage one another through campus life.",
    image: "/images/hero/Eteya_mission_3.jpg",
    program: { day: "Friday", time: "11:00", place: "Muluwengel Kuter 3" },
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
    about:
      "The Bekoji Campus Fellowship gathers students at the Bekoji campus for prayer, worship and fellowship, and is part of the same family as every other campus.",
    image: "/images/hero/GC_3.jpg",
    program: { day: "Thursday", time: "11:30", place: "Muluwengel" },
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
    about:
      "The General Fellowship is all the campus fellowships together. We come together for conferences, outreach and shared programs, led by our staff and regional coordinator.",
    image: "/images/about/GC_1.jpg",
    program: {
      day: "Special programs",
      time: "See Events",
      place: "All campuses",
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