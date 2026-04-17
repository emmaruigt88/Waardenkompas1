export const MODULES = [
  {
    id: "vrij-van-invloed",
    title: "Vrij van invloed",
    subtitle: "18-jaar perspectief",
    icon: "🌱",
    color: "#5B8C5A",
    intro:
      "Stel je voor: je bent weer 18. Niemand heeft een mening over jou. Geen verwachtingen, geen druk. Alleen jij en je nieuwsgierigheid.",
    questions: [
      {
        id: "q1-1",
        prompt:
          "Als niemand een mening had gehad toen jij 18 was: waar zou je nieuwsgierig naar zijn geweest?",
        placeholder: "Laat je gedachten vrij stromen...",
      },
      {
        id: "q1-2",
        prompt: "Wat had je willen proberen, zonder dat het perfect hoefde?",
        placeholder: "Er is geen goed of fout antwoord...",
      },
      {
        id: "q1-3",
        prompt:
          "Welke richting had je op willen gaan als je puur op gevoel mocht kiezen?",
        placeholder: "Vertrouw je eerste gedachte...",
      },
    ],
  },
  {
    id: "sporen-van-jezelf",
    title: "Sporen van jezelf",
    subtitle: "Jouw verleden",
    icon: "🔍",
    color: "#8B6F4E",
    intro:
      "In je verleden liggen aanwijzingen. Momenten waarop je helemaal jezelf was, zonder dat je erbij nadacht.",
    questions: [
      {
        id: "q2-1",
        prompt: "Welke vakken vond je leuk op school? Wat trok je aan?",
        placeholder: "Denk aan wat je energie gaf...",
      },
      {
        id: "q2-2",
        prompt:
          "Wanneer voelde je je levendig of echt geïnteresseerd? Beschrijf een moment.",
        placeholder: "Een herinnering die opkomt...",
      },
      {
        id: "q2-3",
        prompt:
          "Wat deed je uit jezelf, zonder dat iemand het stuurde of vroeg?",
        placeholder: "Iets dat vanzelf ging...",
      },
    ],
  },
  {
    id: "kompas-in-het-nu",
    title: "Kompas in het nu",
    subtitle: "Waar je nu staat",
    icon: "🧭",
    color: "#4A7B9D",
    intro:
      "Laten we kijken naar het heden. Niet wat je zou moeten willen, maar wat er vanbinnen trekt.",
    questions: [
      {
        id: "q3-1",
        prompt: "Wat trekt je aan op dit moment in je leven?",
        placeholder: "Zonder filter...",
      },
      {
        id: "q3-2",
        prompt: "Waar krijg je energie van? Wat maakt je lichter?",
        placeholder: "Denk aan recente momenten...",
      },
      {
        id: "q3-3",
        prompt: "Waar ben je nieuwsgierig naar, ook al weet je niet waarom?",
        placeholder: "Laat het er gewoon zijn...",
      },
    ],
  },
];

export const KOMPAS_QUESTIONS = [
  { id: "k1", prompt: "Wat is je eerste impuls bij deze keuze?", label: "Eerste impuls" },
  { id: "k2", prompt: "Wat voelt als druk van buitenaf?", label: "Externe druk" },
  { id: "k3", prompt: "Wat zou je doen als niemand meekijkt?", label: "Zonder publiek" },
  { id: "k4", prompt: "Wat past bij wat jou energie geeft?", label: "Energie-check" },
];
