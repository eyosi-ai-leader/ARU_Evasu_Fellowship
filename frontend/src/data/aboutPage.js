import {
  fullTimeStaff,
  getFellowship,
  regionalCoordinator,
} from "./fellowships";

// The students' representative: first leader of the General Fellowship.
// Change his name and phone in fellowships.js and it updates here too.
const generalChairperson = {
  ...getFellowship("general").leaders[0],
  role: "General Fellowship Chairperson",
};

// PLACEHOLDERS: replace each message with the real words from the person,
// and set image to their photo, for example "/images/staff/name.jpg".
// While image is "" the card shows their initials.
// Order: chairperson, regional coordinator, then the 3 full-time staff.
const peopleDetails = [
  {
    image: "",
    message:
      "As chairperson of the General Fellowship I represent students from every campus. Your voice matters here, so reach out to me or to any of your campus leaders.",
  },
  {
    image: "",
    message:
      "Every campus fellowship is part of one family. It is a joy to see students growing in Christ together, and whatever your story is, there is a place for you with us.",
  },
  {
    image: "",
    message:
      "University is a season that shapes the rest of your life. Come and meet people who will pray with you, study the Bible with you and walk beside you.",
  },
  {
    image: "",
    message:
      "You do not need to have everything figured out. Come as you are, ask your questions and let us grow in faith together.",
  },
  {
    image: "",
    message:
      "Our desire is to see students follow Jesus and then serve their campus, their families and their nation with love.",
  },
];

const aboutPage = {
  hero: {
    eyebrow: "About us",
    title: "Following Christ together on every campus",
    description:
      "We are students and graduates of Arsi University who follow Jesus Christ as Lord and Savior and witness to Him, together with the wider EvaSUE family.",
    image: "/images/about/GC_1.jpg",
  },

  story: {
    eyebrow: "Who we are",
    title: "A fellowship of students and graduates centered on Jesus Christ",
    paragraphs: [
      "Arsi University EvaSUE Fellowship is a community of students and graduates who follow Jesus Christ as Lord and Savior. We are part of EvaSUE, the Evangelical Students' and Graduates' Union of Ethiopia.",
      "EvaSUE began in 1963 with a small group of students at Addis Ababa University who gave themselves to Bible study, prayer, worship and sharing their faith with friends. Today it includes student and graduate fellowships across Ethiopia and abroad.",
      "At Arsi University that same story continues in our Main, Health, Agriculture and Bekoji campus fellowships, all joined together as the General Fellowship.",
    ],
    image: "/images/about/Kairos_8.jpg",
    stats: [
      { value: "5", label: "Fellowships" },
      { value: "4", label: "Campuses" },
      { value: "3", label: "Full-time staff" },
      { value: "1963", label: "EvaSUE began" },
    ],
  },

  foundations: {
    subtitle: "Why we exist",
    title: "Purpose, focus and values",
    description:
      "Everything we do comes from a few simple convictions about God, students and each other.",
    items: [
      {
        icon: "Target",
        title: "Our purpose",
        description:
          "To advance God's Kingdom by reaching and equipping students to influence their university, their nation and the world.",
      },
      {
        icon: "GraduationCap",
        title: "Our focus",
        description:
          "Students. The years spent in college shape the decades that follow, so we serve students with humility and love.",
      },
      {
        icon: "Users",
        title: "Our values",
        description:
          "The centrality of God's Word, a ministry that is focused on students, and a fellowship that unites us across denomination, ethnicity, language and background.",
      },
    ],
  },

  commitments: {
    subtitle: "Our commitments",
    title: "Four things we give ourselves to",
    description: "These four pillars shape our ministry on every campus.",
    items: [
      {
        icon: "Megaphone",
        title: "Evangelism",
        description:
          "Sharing the good news of Jesus Christ with students on our campuses.",
      },
      {
        icon: "BookOpen",
        title: "Discipleship",
        description:
          "Helping students grow to be more like Christ through God's Word.",
      },
      {
        icon: "Globe",
        title: "Mission",
        description:
          "Equipping students to take part in the mission of the Church around the world.",
      },
      {
        icon: "Compass",
        title: "Leadership",
        description:
          "Training students to lead in church and society with biblical values.",
      },
    ],
  },

  staffIntro: {
    subtitle: "Our leaders",
    title: "Words from the people who serve with us",
    description:
      "Meet the students' chairperson, our regional coordinator and our full-time staff. Choose a name to read their message.",
  },

  staff: [generalChairperson, regionalCoordinator, ...fullTimeStaff].map(
    (person, index) => ({
      ...person,
      ...peopleDetails[index],
    })
  ),
};

export default aboutPage;