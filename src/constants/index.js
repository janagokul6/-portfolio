import {
  mobile,
  backend,
  web,
  javascript,
  typescript,
  html,
  css,
  reactjs,
  redux,
  tailwind,
  nodejs,
  mongodb,
  git,
  figma,
  // docker,
  // carrent,
  // jobit,
  // tripguide,
  threejs,
  strugend,
  Greatway,
  download,
  java,
  vsCode,
  postman,
  firebase,
  NextJs,
  kafka,
  Express,
  material,
  nuBeginnings,
  varroc,
  triyambakaMishra,
  adityaPrasun,
  WebScrapX,
  LetsMeet,
  socialMedia,
  GoBikes,
  MyTube,
} from "../assets";

export const navLinks = [
  {
    id: "cv",
    title: "CV",
    icon: download
  }, {
    id: "about",
    title: "About",
  },
  {
    id: "work",
    title: "Work",
  },
  {
    id: "contact",
    title: "Contact",
  },
];

const services = [
  {
    title: "Full-stack Developer",
    icon: web,
  },
  {
    title: "Frontend Developer",
    icon: mobile,
  },
  {
    title: "Backend Developer",
    icon: backend,
  },
  // {
  //   title: "Content Creator",
  //   icon: creator,
  // },
];

const technologies = [
  {
    name: "HTML 5",
    icon: html,
  },
  {
    name: "CSS 3",
    icon: css,
  },
  {
    name: "JavaScript",
    icon: javascript,
  },
  {
    name: "TypeScript",
    icon: typescript,
  },
  {
    name: "React JS",
    icon: reactjs,
  },
  {
    name: "Redux Toolkit",
    icon: redux,
  },
  {
    name: "Java",
    icon: java,
  },
  {
    name: "Tailwind CSS",
    icon: tailwind,
  },
  {
    name: "material UI",
    icon: material,
  },
  {
    name: "Node JS",
    icon: nodejs,
  },
  {
    name: "Express JS",
    icon: Express,
  },
  {
    name: "Kafka",
    icon: kafka,
  },
  {
    name: "MongoDB",
    icon: mongodb,
  },
  {
    name: "Next JS",
    icon: NextJs,
  },
  {
    name: "Three JS",
    icon: threejs,
  },
  {
    name: "Firebase",
    icon: firebase,
  },
  {
    name: "git",
    icon: git,
  },
  {
    name: "figma",
    icon: figma,
  },
  {
    name: "Postman",
    icon: postman,
  },
  {
    name: "VS Code",
    icon: vsCode,
  },
  // {
  //   name: "docker",
  //   icon: docker,
  // },
];

const experiences = [
  {
    title: "Quality Testing",
    company_name: "Varroc Eng pvt ltd.",
    icon: varroc,
    iconBg: "#383E56",
    date: "Oct 2021 - Feb 2022",
    points: [
      "Conducted quality testing on automotive components to ensure compliance with industry standards",
      "Improved testing speed, reducing product testing time by 20%, resulting in 8% more tested product at same time",
    ],
  },
  // {
  //   title: "React Native Developer",
  //   company_name: "Tesla",
  //   icon: tesla,
  //   iconBg: "#E6DEDD",
  //   date: "Jan 2021 - Feb 2022",
  //   points: [
  //     "Developing and maintaining web applications using React.js and other related technologies.",
  //     "Collaborating with cross-functional teams including designers, product managers, and other developers to create high-quality products.",
  //     "Implementing responsive design and ensuring cross-browser compatibility.",
  //     "Participating in code reviews and providing constructive feedback to other developers.",
  //   ],
  // },
  {
    title: "Full-stack Developer intern",
    company_name: "STRUGEND",
    icon: strugend,
    iconBg: "white",
    date: "Dec 2022 - Jun 2023",
    points: [
      "Developed a user-friendly bike and vehicle rental platform with a focus on seamless booking, renting, tracking and payment processes along with GPS integration.",
      "Build an engaging UI, functional booking calendar, and integrated Razorpay for secure transactions, ensuring optimal performance and stability.",
      "Optimized loading time by 60% with lazyLoading, which boosts UI performance by 25% for a smoother, seamless, faster and enhanced user experience.",
      "Troubleshooted, debugged applications and apart from all this as a co-team lead ensured seamless product development and idea discussion.",
    ],
  },
  {
    title: "Full stack Developer",
    company_name: "NuBeginnings Ind pvt. ltd.",
    icon: nuBeginnings,
    iconBg: "#E6DEDD",
    date: "Feb 2023 - Nov 2023",
    points: [
      "Co-developed a comprehensive end-to-end product, contributing to various parts like frontend, backend, authentication, validation and service setup etc.",
      "Deployed to a cloud VPS for global users and makes continuous upgrades.",
      "Reduced server response time by 40% with robust and scalable backend APIs.",
    ],
  },
];

const testimonials = [
  {
    testimonial:
      "I thought it was impossible to make a website as beautiful as our product, but Rick proved me wrong.",
    name: "Triyambaka Mishra",
    designation: "CEO",
    company: "STRUGEND",
    image: triyambakaMishra,
  },
  {
    testimonial:
      "I've never met a web developer who truly cares about their clients' success like Gokul does.",
    name: "Aditya Prasun",
    designation: "CEO",
    company: "NuBeginnings",
    image: adityaPrasun,
  },
];

const projects = [
  {
    name: "Greatway",
    description:
      "Welcome to Greatway, the ultimate influencer portfolio powerhouse! Amplify your brand with a DIY showcase, engage fans, and streamline your online presence. Privacy-centric, achievement tracking, and seamless integration for a standout online influence. Elevate your impact now! 🚀🎨🌟",
    tags: [
      {
        name: "react",
        color: "blue-text-gradient",
      },
      {
        name: "mongodb",
        color: "green-text-gradient",
      },
      {
        name: "tailwind",
        color: "pink-text-gradient",
      },
    ],
    image: Greatway,
    live_link: "https://greatway.to/",
  },
  {
    name: "Social media",
    description:
      "Connects you globally! Share moments, join diverse communities, and discover new friends. Privacy-focused, gamified achievements, and seamless integration make it your go-to social experience. Join now! 🌐📸🤝",
    tags: [
      {
        name: "react",
        color: "blue-text-gradient",
      },
      {
        name: "mongodb",
        color: "green-text-gradient",
      },
      {
        name: "tailwind",
        color: "pink-text-gradient",
      },
    ],
    image: socialMedia,
    source_code_link: "https://github.com/janagokul6/social-media",

  },
  {
    name: "WebScrapX",
    description:
      "Introducing webScrapX, your ultimate tool for savvy shopping! Track prices, discover deals, and save money effortlessly. Join now for smart shopping and never miss a bargain! 💰🛍️📉",
    tags: [
      {
        name: "react",
        color: "blue-text-gradient",
      },
      {
        name: "restapi",
        color: "green-text-gradient",
      },
      {
        name: "scss",
        color: "pink-text-gradient",
      },
    ],
    image: WebScrapX,
    source_code_link: "https://github.com/janagokul6/WebScrapX",
    live_link: "https://webscrapx.vercel.app/"
  },
  {
    name: "GoBikes",
    description:
      "Embark on a journey with GoBikes, your ultimate vehicle and bike booking destination! Explore, ride, and discover the freedom of the open road. Start your adventure now! 🚗🏍️🌟",
    tags: [
      {
        name: "react",
        color: "blue-text-gradient",
      },
      {
        name: "restapi",
        color: "green-text-gradient",
      },
      {
        name: "scss",
        color: "pink-text-gradient",
      },
    ],
    image: GoBikes,
    source_code_link: "https://github.com/Janagokul/GoBikes",
    live_link: "https://gobikes-strugend-ehgdcpkf0-rudrakshikumar.vercel.app/"
  },
  {
    name: "LetsMeet",
    description:
      "LetsMeet is your passport to seamless video connections. Join meetings globally, share insights, and collaborate effortlessly. Privacy-centric, achievement-driven, and easy integration. Elevate your virtual experience now! 🌐",
    tags: [
      {
        name: "HTML",
        color: "blue-text-gradient",
      },
      {
        name: "WebServices",
        color: "green-text-gradient",
      },
      {
        name: "css",
        color: "pink-text-gradient",
      },
    ],
    image: LetsMeet,
    source_code_link: "https://github.com/janagokul6/LetsMeet",
    live_link: "https://janagokul6.github.io/LetsMeet/"
  },

  {
    name: "MyTube",
    description:
      "Dive into MyTube, a cinematic realm where stories unfold! 📽️ Share your narrative, connect with global creators, and immerse yourself in a world of diverse video content. Join the visual storytelling revolution now! 🚀🌍🎞️",
    tags: [
      {
        name: "React",
        color: "blue-text-gradient",
      },
      {
        name: "tailwind",
        color: "green-text-gradient",
      },
      {
        name: "redux",
        color: "pink-text-gradient",
      },
    ],
    image: MyTube,
    source_code_link: "https://github.com/janagokul6/MyTube",
  },
];

export { services, technologies, experiences, testimonials, projects };