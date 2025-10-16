import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProjectCard from '../ProjectCard';
import { Project } from '../../api/projects';

const mockProject: Project = {
  id: 1,
  name: 'Test Project',
  description: 'Test Description',
  start_date: '2025-01-01',
  end_date: '2025-12-31',
  status: 'active',
  auto_scheduling: false,
  created_by: 1,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  user_role: 'owner',
  member_count: 5,
  task_count: 10,
};

describe('ProjectCard', () => {
  it('renders project name', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders project description', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('renders project status', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('renders member count', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('5 members')).toBeInTheDocument();
  });

  it('renders task count', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    expect(screen.getByText('10 tasks')).toBeInTheDocument();
  });

  it('links to project detail page', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} />
      </BrowserRouter>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/projects/1');
  });
});
