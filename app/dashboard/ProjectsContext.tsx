"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Project {
    id: string;
    name: string;
    description: string;
    status: string;
    tone: string;
    color: string;
    theme: string;
    messages: number;
    satisfaction: string;
    createdAt: string;
}

interface ProjectsContextType {
    projects: Project[];
    isLoading: boolean;
    refreshProjects: () => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProjects = async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        try {
            const res = await fetch('/api/projects');
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            } else {
                console.error("Failed to fetch projects");
            }
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            if (!isBackground) setIsLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchProjects();
    }, []);

    const refreshProjects = async () => {
        // Refresh quietly in the background
        await fetchProjects(true);
    };

    return (
        <ProjectsContext.Provider value={{ projects, isLoading, refreshProjects }}>
            {children}
        </ProjectsContext.Provider>
    );
}

export function useProjects() {
    const context = useContext(ProjectsContext);
    if (context === undefined) {
        throw new Error("useProjects must be used within a ProjectsProvider");
    }
    return context;
}
