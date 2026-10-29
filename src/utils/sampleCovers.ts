export interface SampleCover {
  id: string;
  title: string;
  category: string;
  badge: string;
  url: string;
  description: string;
}

export const SAMPLE_IT_COVERS: SampleCover[] = [
  {
    id: 'it-meeting-strategy',
    title: 'IT Strategy & Team Standup',
    category: 'IT Meeting',
    badge: 'IT Meeting',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    description: 'Modern collaborative technology meeting and team roadmap review'
  },
  {
    id: 'it-datacenter-cloud',
    title: 'Datacenter & Cloud Infrastructure',
    category: 'Infrastructure',
    badge: 'Infrastructure',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    description: 'High-availability server rack, fiber networking, and cloud storage'
  },
  {
    id: 'it-hospital-healthcare',
    title: 'Healthcare IT & Hospital Systems',
    category: 'Healthcare Tech',
    badge: 'Healthcare Tech',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    description: 'Hospital HIS, PACS imaging, and clinical diagnostics digital tools'
  },
  {
    id: 'it-ops-network',
    title: 'Operations & Network Monitoring',
    category: 'IT Operations',
    badge: 'Operations',
    url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
    description: '24/7 network uptime, telemetry metrics, and systems health'
  },
  {
    id: 'it-boardroom-exec',
    title: 'Executive Boardroom & Steering Committee',
    category: 'Executive Meeting',
    badge: 'Executive',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    description: 'High-level steering council, governance, and technology budget review'
  },
  {
    id: 'it-security-soc',
    title: 'Cybersecurity & Security Operations',
    category: 'Security',
    badge: 'Security',
    url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    description: 'Network defense, threat detection, SSL certificates, and firewall compliance'
  },
  {
    id: 'it-cloud-his',
    title: 'Digital Transformation & Cloud ERP',
    category: 'Cloud & ERP',
    badge: 'Cloud & ERP',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    description: 'Interconnected enterprise solutions, Dynamics 365, and API integration'
  },
  {
    id: 'it-agile-standup',
    title: 'Agile Project Sprint & Scrum',
    category: 'Sprint Meeting',
    badge: 'Sprint Planning',
    url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
    description: 'Cross-functional IT engineering sprint planning and backlog grooming'
  }
];

/**
 * Returns an automatic default sample cover image if user doesn't add a cover to the note.
 * Selects based on content keywords or a deterministic note hash.
 */
export function getDefaultCoverForNote(note?: {
  id?: string;
  title?: string;
  content?: string;
  thumbnailUrl?: string | null;
  meetingDate?: string;
}): string {
  if (note?.thumbnailUrl && note.thumbnailUrl.trim() !== '') {
    return note.thumbnailUrl;
  }

  const text = `${note?.title || ''} ${note?.content || ''}`.toLowerCase();

  // Keyword-based thematic detection
  if (
    text.includes('hospital') ||
    text.includes('khema') ||
    text.includes('clinic') ||
    text.includes('ehr') ||
    text.includes('his') ||
    text.includes('pacs') ||
    text.includes('patient') ||
    text.includes('medical')
  ) {
    return SAMPLE_IT_COVERS[2].url; // Healthcare IT & Hospital Systems
  }

  if (
    text.includes('server') ||
    text.includes('datacenter') ||
    text.includes('switch') ||
    text.includes('cisco') ||
    text.includes('infrastructure') ||
    text.includes('vpn') ||
    text.includes('hardware')
  ) {
    return SAMPLE_IT_COVERS[1].url; // Datacenter & Cloud Infrastructure
  }

  if (
    text.includes('security') ||
    text.includes('cyber') ||
    text.includes('firewall') ||
    text.includes('ssl') ||
    text.includes('cert') ||
    text.includes('alarm') ||
    text.includes('audit')
  ) {
    return SAMPLE_IT_COVERS[5].url; // Cybersecurity & SOC
  }

  if (
    text.includes('cloud') ||
    text.includes('d365') ||
    text.includes('erp') ||
    text.includes('integration') ||
    text.includes('api') ||
    text.includes('subscription')
  ) {
    return SAMPLE_IT_COVERS[6].url; // Cloud & ERP
  }

  if (
    text.includes('operation') ||
    text.includes('ops') ||
    text.includes('urgent') ||
    text.includes('anzer') ||
    text.includes('monitoring')
  ) {
    return SAMPLE_IT_COVERS[3].url; // Operations & Network Monitoring
  }

  if (
    text.includes('board') ||
    text.includes('executive') ||
    text.includes('committee') ||
    text.includes('governance') ||
    text.includes('budget')
  ) {
    return SAMPLE_IT_COVERS[4].url; // Executive Boardroom
  }

  if (
    text.includes('sprint') ||
    text.includes('scrum') ||
    text.includes('agile') ||
    text.includes('backlog') ||
    text.includes('jira')
  ) {
    return SAMPLE_IT_COVERS[7].url; // Agile Sprint
  }

  // Deterministic fallback based on note id or title characters
  const seedString = note?.id || note?.title || 'default-note';
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % SAMPLE_IT_COVERS.length;
  return SAMPLE_IT_COVERS[index].url;
}

/**
 * Returns the badge label for a given cover URL
 */
export function getCoverBadge(coverUrl?: string | null): string {
  if (!coverUrl) return 'IT Notes & Meeting';
  const found = SAMPLE_IT_COVERS.find((c) => c.url === coverUrl);
  return found ? found.badge : 'IT Notes & Meeting';
}
