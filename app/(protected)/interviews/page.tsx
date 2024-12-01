"use client";

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-hot-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

import Particles from '@/components/ui/particles';
import { useTheme } from 'next-themes';
import ShinyButton from '@/components/ui/shiny-button';

export default function AIQuestionGenerator() {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('intermediate');
    const [count, setCount] = useState(5);
    const [response, setResponse] = useState('');
    const { resolvedTheme } = useTheme();
  const [color, setColor] = useState("#ffffff");
 
  useEffect(() => {
    setColor(resolvedTheme === "dark" ? "#ffffff" : "#000000");
  }, [resolvedTheme]);

    

    const generateQuestions = useMutation({
        mutationFn: async () => {
            const response = await axios.post('/api/interview-questions/generate', {
                topic,
                difficulty,
                count
            });
            return response.data;
        },
        onSuccess: (data) => {
            // Store the raw response
            setResponse(data);
            toast.success('Questions generated!');
        },
        onError: (error) => {
            console.error('Generation error:', error);
            toast.error('Failed to generate questions');
        }
    });

    return (
        
            <div className="p-6 w-full">
                <h2 className="text-xl font-semibold mb-4 text-white text-center">AI Question Generator</h2>
                
                <div className="space-y-4 md:space-y-0 w-full flex flex-col md:flex-row justify-center items-center md:space-x-4">
                    <Input
                        type="text"
                        placeholder="Enter topic (e.g., React Hooks, Node.js, Python)"
                        className="w-full md:w-2/5"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />

                    <Select
                        value={difficulty}
                        onValueChange={(value) => setDifficulty(value)}
                    >
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                    </Select>

                    <Input
                        type="number"
                        min="1"
                        max="10"
                        className="w-full md:w-[100px]"
                        placeholder="Questions"
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                    />

                    <ShinyButton
                        className="w-full md:w-[180px]"
                        onClick={() => generateQuestions.mutate()}
                        disabled={!topic || generateQuestions.isPending}
                    >
                        <h2 className="font-semibold py-0.5">
                        {generateQuestions.isPending ? 'Generating...' : 'Generate Questions'}
                        </h2>
                    </ShinyButton>
                </div>

                {/* Generated Questions */}
                {response && (
                    <div className="mt-8 max-w-4xl mx-auto px-4">
                        <ReactMarkdown
                            components={{
                                h3: ({ children }) => (
                                    <h3 className="text-xl text-white font-bold mt-8 mb-4 text-primary">{children}</h3>
                                ),
                                h4: ({ children }) => (
                                    <h4 className="text-lg text-white font-semibold mt-4 mb-2">{children}</h4>
                                ),
                                p: ({ children }) => (
                                    <p className="text-white my-2">{children}</p>
                                ),
                                ul: ({ children }) => (
                                    <ul className="list-disc pl-6 space-y-2 my-4">{children}</ul>
                                ),
                                li: ({ children }) => (
                                    <li className="text-white">{children}</li>
                                ),
                                em: ({ children }) => (
                                    <em className="block text-white my-2">{children}</em>
                                ),
                            }}
                        >
                            {response}
                        </ReactMarkdown>
                    </div>
                )}
                <Particles className="absolute inset-0"
        quantity={100}
        ease={80}
        color={color}
        refresh />
            </div>
            
       
    );
}
