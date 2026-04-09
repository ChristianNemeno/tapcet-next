import { db } from "./index.js";
import { quizzes, questions } from "./schema.js";
import { count } from "drizzle-orm";

const seedData = [
  {
    title: "General Knowledge",
    description: "Test your general knowledge across a range of topics.",
    timeLimitSeconds: 60,
    examTags: ["UPCAT", "ACET", "USTET", "DLSUCET", "PUPCET"],
    subject: "General Information",
    topic: "Mixed Topics",
    questions: [
      { text: "What is the capital of France?", options: ["Berlin", "Madrid", "Paris", "Rome"], answer: 2, orderIndex: 0 },
      { text: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], answer: 2, orderIndex: 1 },
      { text: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: 3, orderIndex: 2 },
      { text: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], answer: 1, orderIndex: 3 },
      { text: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], answer: 2, orderIndex: 4 },
      { text: "In which year did World War II end?", options: ["1943", "1944", "1945", "1946"], answer: 2, orderIndex: 5 },
    ],
  },
  {
    title: "Web Development",
    description: "How well do you know the web? HTML, CSS, JS and more.",
    timeLimitSeconds: 90,
    examTags: [],
    subject: null,
    topic: "Web Technologies",
    questions: [
      { text: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language", "Home Tool Markup Language"], answer: 0, orderIndex: 0 },
      { text: "Which CSS property controls text size?", options: ["font-weight", "text-size", "font-size", "text-style"], answer: 2, orderIndex: 1 },
      { text: "What does the 'typeof' operator return in JavaScript?", options: ["The value", "A number", "A string", "A boolean"], answer: 2, orderIndex: 2 },
      { text: "Which HTTP method is used to update a resource?", options: ["GET", "POST", "PUT", "DELETE"], answer: 2, orderIndex: 3 },
      { text: "What is the purpose of a CSS media query?", options: ["To query a database", "To apply styles based on screen size", "To import CSS files", "To select elements"], answer: 1, orderIndex: 4 },
      { text: "Which JavaScript method adds an element to the end of an array?", options: ["shift()", "unshift()", "pop()", "push()"], answer: 3, orderIndex: 5 },
    ],
  },
  {
    title: "Science & Nature",
    description: "Explore the world of science — biology, physics, and chemistry.",
    timeLimitSeconds: 75,
    examTags: ["UPCAT", "DOST-SEI", "JLSS"],
    subject: "Science",
    topic: "General Science",
    questions: [
      { text: "What is the speed of light?", options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "3,000 km/s"], answer: 0, orderIndex: 0 },
      { text: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Chloroplast"], answer: 2, orderIndex: 1 },
      { text: "What is the atomic number of carbon?", options: ["4", "6", "8", "12"], answer: 1, orderIndex: 2 },
      { text: "What planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Saturn", "Mars"], answer: 3, orderIndex: 3 },
      { text: "What is the most abundant gas in Earth's atmosphere?", options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"], answer: 2, orderIndex: 4 },
      { text: "What force keeps planets in orbit around the sun?", options: ["Magnetism", "Friction", "Gravity", "Electrostatics"], answer: 2, orderIndex: 5 },
    ],
  },
];

export async function seed() {
  const [{ count: existing }] = await db
    .select({ count: count() })
    .from(quizzes);

  if (Number(existing) > 0) return;

  for (const quiz of seedData) {
    const [inserted] = await db
      .insert(quizzes)
      .values({
        title: quiz.title,
        description: quiz.description,
        timeLimitSeconds: quiz.timeLimitSeconds,
        examTags: quiz.examTags,
        subject: quiz.subject,
        topic: quiz.topic,
      })
      .returning();

    await db.insert(questions).values(
      quiz.questions.map((q) => ({
        quizId: inserted.id,
        text: q.text,
        options: q.options,
        answer: q.answer,
        orderIndex: q.orderIndex,
      }))
    );
  }

  console.log("Database seeded.");
}
