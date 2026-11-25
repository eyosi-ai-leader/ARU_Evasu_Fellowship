
const leaders = (members) => {
  return members.map(({ role, name, phone }) => ({
    role,
    name,
    phone,
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
    image: "/images/hero/Main_Campus.jpg",
    program: { day: "Thursday", time: "11:00", place: "Bethel Mekaneyesus Church" },
    contact: {
      name: "Bereket Hailu",
      phone: "+251 94 582 3539",
      email: "main@arsievasu.example",
      telegram: "https://t.me/Arsiufellow",
    },
    leaders: leaders([
      {
        name: "Bereket Hailu",
        role: "Chairman",
        phone: "+251 94 582 3539",
      },
      {
        name: "Tekalgn Bogale",
        role: "Vice Chairman",
        phone: "099 291 2263",
      },
      {
        name: "Alazar Adane",
        role: "Secretary",
        phone: "093 269 5737",
      },
      {
        name: "Yodahe Hailemichael",
        role: "Team Coordinator",
        phone: "0919045795",
      },
      {
        name: "Yididiya Tlahun",
        role: "Treasurer",
        phone: "093 581 1993",
      },
    ]),
  },
  {
    slug: "health-campus",
    name: "Health Campus Fellowship",
    short: "Health Campus",
    description:
      "Health science students growing in faith and serving with compassion.",
    about:
      "The Health Campus Fellowship brings health science students together to grow in faith, support one another through demanding studies, and serve with compassion.",
    image: "/images/hero/Health_Campus.jpg",
    program: { day: "Friday", time: "11:30", place: "Muluwengel Kuter 1" },
    contact: {
      name: "Tariku Lemesa",
      phone: "+251 945325534",
      email: "health@arsievasu.example",
      telegram: "https://t.me/your-health-campus",
    },
    leaders: leaders([
      {
        name: "Tariku Lemesa",
        role: "Chairman",
        phone: "0945325534",
      },
      {
        name: "Tsegaab Daniel",
        role: "Vice Chairman",
        phone: "0994287150",
      },
      {
        name: "Mideksa Habtamu",
        role: "Secretary",
        phone: "0928960961",
      },
      {
        name: "Nita Tsegaye",
        role: "Public Relations Officer",
        phone: "0976192681",
      },
      {
        name: "Lemi Emru",
        role: "Treasurer",
        phone: "0963317585",
      },
      {
        name: "Merkin Medhin",
        role: "Small Group Coordinator",
        phone: "0921369069",
      },
      {
        name: "Lemecha Tesema",
        role: "Small Group Coordinator",
        phone: "0919738834",
      },
    ]),
  },
  {
    slug: "agriculture-campus",
    name: "Agriculture Campus Fellowship",
    short: "Agriculture Campus",
    description:
      "Agriculture students meeting to worship, learn God's Word and encourage one another.",
    about:
      "The Agriculture Campus Fellowship is a warm community of students who worship, learn God's Word and encourage one another through campus life.",
    image: "/images/hero/Agri_Campus.jpg",
    program: { day: "Friday", time: "11:00", place: "Muluwengel Kuter 3" },
    contact: {
      name: "Melkamu Mengesha",
      phone: "+251 904430838",
      email: "agriculture@arsievasu.example",
      telegram: "https://t.me/arsiuniversityy",
    },
    leaders: leaders([
      {
        name: "Melkamu Mengesha",
        role: "Chairman",
        phone: "0904430838",
      },
      {
        name: "Abgiya Getachew",
        role: "Vice Chairman",
        phone: "0941753468",
      },
      {
        name: "Maru Ermias",
        role: "Secretary",
        phone: "+251 786 893 008",
      },
      {
        name: "Nat Wordshu",
        role: "Auditor",
        phone: "+251 994 020 066",
      },
      {
        name: "Debora Tamiru",
        role: "Treasurer",
        phone: "0991044920",
      },
      {
        name: "Zelalem Shibru",
        role: "General Coordinator",
        phone: "+251 924 662 072",
      },
    ]),
  },
  {
    slug: "bekoji-campus",
    name: "Bekoji Campus Fellowship",
    short: "Bekoji Campus",
    description:
      "Students at the Bekoji campus coming together in prayer, worship and fellowship.",
    about:
      "The Bekoji Campus Fellowship gathers students at the Bekoji campus for prayer, worship and fellowship, and is part of the same family as every other campus.",
    image: "/images/hero/Family_E.jpg",
    program: { day: "Thursday", time: "11:30", place: "Muluwengel" },
    contact: {
      name: "Contact Person Name",
      phone: "+251 900 000 104",
      email: "bekoji@arsievasu.example",
      telegram: "https://t.me/your-bekoji-campus",
    },
    leaders: leaders([
      {
        name: "Natnael Desta",
        role: "Chairperson",
        phone: "",
      },
      {
        name: "Rediet Amare",
        role: "Vice Chairperson",
        phone: "",
      },
      {
        name: "Fitsum Lakew",
        role: "Secretary",
        phone: "",
      },
      {
        name: "Mihret Yosef",
        role: "Treasurer",
        phone: "",
      },
      {
        name: "Elias Berhanu",
        role: "Auditor",
        phone: "",
      },
      {
        name: "Tigist Alem",
        role: "Team Coordinator",
        phone: "",
      },
      {
        name: "Kaleb Shiferaw",
        role: "Team Coordinator",
        phone: "",
      },
    ]),
  },
  {
    slug: "general",
    name: "General Fellowship",
    short: "General",
    description:
      "All the campus fellowships together: conferences, outreach and shared programs.",
    about:
      "The General Fellowship is all the campus fellowships together. We come together for conferences, outreach and shared programs, led by our staff and regional coordinator.",
    image: "/images/hero/GF.jpg",
    program: {
      day: "Special programs",
      time: "See Events",
      place: "All campuses",
    },
    contact: {
      name: "Tsegaab Daniel",
      phone: "0994287150",
      email: "",
      telegram: "https://t.me/your-general-fellowship",
    },
    leaders: leaders([
      {
        name: "Tsegaab Daniel",
        role: "Chairman",
        phone: "0994287150",
      },
      {
        name: "Melkamu Mengesha",
        role: "Vice Chairman",
        phone: "0904430838",
      },
      {
        name: "Bereket Hailu",
        role: "Secretary",
        phone: "0945823539",
      },
      {
        name: "Tariku Lemesa",
        role: "General Manager (GM) Coordinator",
        phone: "0945325534",
      },
      {
        name: "Yididya Tilahun",
        role: "Treasurer",
        phone: "0935811993",
      },
      {
        name: "Natnael Wordshu",
        role: "Public Relations Officer",
        phone: "0994020066",
      },
      {
        name: "Hana",
        role: "Member",
        phone: "0964643967",
      },
    ]),
  },
];

// Shared by all fellowships.
export const fullTimeStaff = [
  {
    name: "Mihret Kasu",
    role: "Full-Time Staff",
    phone: "0946965644",
  },
  {
    name: "Mihret Mesfen",
    role: "Full-Time Staff",
    phone: "0979368408",
  },
  {
    name: "Nardos Tafese",
    role: "Full-Time Staff",
    phone: "+251 98 807 0642",
  },
];

export const regionalCoordinator = {
  name: "Dawit Tadele",
  role: "Regional Coordinator",
  phone: "0982736436",
};

export const getFellowship = (slug) =>
  fellowships.find((item) => item.slug === slug);
