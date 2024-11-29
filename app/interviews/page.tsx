"use client";

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { MagicCard } from "@/components/ui/magic-card";
import { toast } from 'react-hot-toast';

export default function AIQuestionGenerator() {
    const [topic, setTopic] = useState('');
    const [difficulty, setDifficulty] = useState('intermediate');
    const [count, setCount] = useState(5);
    const [response, setResponse] = useState('');

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
        <MagicCard>
            <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">AI Question Generator</h2>
                
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Enter topic (e.g., React Hooks, System Design, Leadership)"
                        className="w-full p-2 border rounded-md"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />

                    <select
                        className="w-full p-2 border rounded-md"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                    >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                    </select>

                    <input
                        type="number"
                        min="1"
                        max="10"
                        className="w-full p-2 border rounded-md"
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                    />

                    <button
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        onClick={() => generateQuestions.mutate()}
                        disabled={!topic || generateQuestions.isPending}
                    >
                        {generateQuestions.isPending ? 'Generating...' : 'Generate Questions'}
                    </button>

                    {/* Generated Questions */}
                    {response && (
                        <div className="prose dark:prose-invert max-w-none mt-6">
                            <ReactMarkdown>
                                {response}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </MagicCard>
    );
}
