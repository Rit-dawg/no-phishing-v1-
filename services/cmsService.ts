export interface GithubContent {
  name: string;
  path: string;
  sha: string;
  content?: string;
}

export const githubCms = {
  getFiles: async (
    repo: string,
    path: string,
    token: string,
  ): Promise<GithubContent[]> => {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      {
        headers: { Authorization: `token ${token}` },
      },
    );
    if (!res.ok) throw new Error("Failed to fetch files from GitHub");
    return res.json();
  },

  getFileContent: async (
    repo: string,
    path: string,
    token: string,
  ): Promise<GithubContent> => {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      {
        headers: { Authorization: `token ${token}` },
      },
    );
    const data = await res.json();
    return {
      ...data,
      content: decodeURIComponent(
        atob(data.content)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join(""),
      ),
    };
  },

  saveFile: async (
    repo: string,
    path: string,
    content: string,
    sha: string | null,
    token: string,
  ) => {
    const body: any = {
      message: `Forensic Update: ${path.split("/").pop()}`,
      content: btoa(unescape(encodeURIComponent(content))),
    };
    if (sha) body.sha = sha;

    const res = await fetch(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to save to GitHub");
    }
    return res.json();
  },
};
