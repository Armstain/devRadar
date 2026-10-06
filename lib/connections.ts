import { getCollection } from "@/lib/db";
import { decryptToken, encryptToken } from "@/lib/crypto";

export interface GithubCredentials {
    token: string;
    username?: string;
}

export async function getGithubCredentials(userId: string): Promise<GithubCredentials | null> {
    const users = await getCollection("users");
    const user = await users.findOne({ userId });
    if (!user?.githubToken) {
        return null;
    }
    return { token: decryptToken(user.githubToken), username: user.githubUsername };
}

export async function saveGithubConnection(userId: string, token: string, username: string) {
    const users = await getCollection("users");
    await users.updateOne(
        { userId },
        {
            $set: {
                githubToken: encryptToken(token),
                githubTokenUpdatedAt: new Date(),
                githubUsername: username,
            },
        },
        { upsert: true }
    );
}
