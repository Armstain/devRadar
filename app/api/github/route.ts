import { NextResponse } from "next/server";

async function getGithubUserData() {
    const token = localStorage.getItem('github_token');
    const response = await fetch('https://api.github.com/user', {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
        },
    });
    return response.json();
}

export async function GET() {
    try {
        const githubData = await getGithubUserData();
        return NextResponse.json(githubData);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
