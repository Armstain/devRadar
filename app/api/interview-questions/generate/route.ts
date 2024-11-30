import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
    try {
        const { topic, difficulty, count = 5, interviewType, companyStyle } = await request.json();
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Generate ${count} ${difficulty} level interview questions about ${topic}.
        For each question, provide:
        1. The question
        2. What the interviewer is looking for
        3. Key points that should be included in a good answer

        Format the response in markdown with clear headings and bullet points.`;

        const result = await model.generateContent(prompt);
        const response = result.response;

        return NextResponse.json(response.text());

    } catch (error) {
        console.error("AI generation error:", error);
        return NextResponse.json("Failed to generate questions. Please try again.", { status: 500 });
    }
} 