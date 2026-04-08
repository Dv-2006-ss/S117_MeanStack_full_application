import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../core/services/toast';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'email' | 'newsletter' | 'promo' | 'sms' | 'social';
  thumbnail: string;
  blocks: any[];
  goal?: string;
  offer?: string;
  cta?: string;
}

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './templates.html',
  styleUrls: ['./templates.scss']
})
export class TemplatesComponent {
  
  categories = ['All', 'Email', 'SMS', 'Promo', 'Newsletter'];
  selectedCategory = 'All';
  showCreateModal = false;

  templates: Template[] = [
    {
      id: 't-01',
      name: 'Welcome Series',
      description: 'A calm onboarding launch for small teams bringing new customers into the fold.',
      category: 'email',
      thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=300&q=80',
      goal: 'product-launch',
      offer: 'A warm welcome and first next step',
      cta: 'Get started',
      blocks: [
        { type: 'text', content: 'Welcome to CampaignAI. We are thrilled to have you.' },
        { type: 'button', text: 'Get Started', url: 'https://campaignai.app' }
      ]
    },
    {
      id: 't-02',
      name: 'Neumorphism Promo',
      description: 'A practical offer campaign for time-sensitive promotions.',
      category: 'promo',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80',
      goal: 'promote-an-offer',
      offer: 'Limited-time seasonal offer',
      cta: 'Claim offer',
      blocks: [
        { type: 'text', content: 'Huge Summer Sale!' },
        { type: 'divider' },
        { type: 'button', text: '50% OFF - Claim Now', url: 'https://campaignai.app/sale' }
      ]
    },
    {
      id: 't-03',
      name: 'Skeuomorphic Alert',
      description: 'A trustworthy newsletter layout for regular updates and launches.',
      category: 'newsletter',
      thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=300&q=80',
      goal: 'product-launch',
      offer: 'Monthly launch update',
      cta: 'Read the update',
      blocks: [
        { type: 'text', content: 'Important Account Update' },
        { type: 'button', text: 'View Secure Message', url: '#' },
        { type: 'text', content: 'If you did not request this, please ignore.' }
      ]
    },
    {
      id: 't-04',
      name: 'Quick Flash SMS',
      description: 'A quick reminder for local businesses running flash offers.',
      category: 'sms',
      thumbnail: 'https://images.unsplash.com/photo-1512428559083-a401a3dd7d45?w=300&q=80',
      goal: 'promote-an-offer',
      offer: 'Today-only booking reminder',
      cta: 'Book now',
      blocks: [
        { type: 'text', content: 'CampaignAI: Your offer is live today. Book now before slots fill.' }
      ]
    },
    {
      id: 't-05',
      name: 'OTP Verification',
      description: 'A crisp reminder template for operational alerts and confirmations.',
      category: 'sms',
      thumbnail: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=300&q=80',
      goal: 'event-promotion',
      offer: 'Seat confirmation reminder',
      cta: 'Confirm attendance',
      blocks: [
        { type: 'text', content: 'Your CampaignAI confirmation code is ready. Valid for 5 minutes.' }
      ]
    }
  ];

  get filteredTemplates() {
    if (this.selectedCategory === 'All') return this.templates;
    return this.templates.filter(t => t.category.toLowerCase() === this.selectedCategory.toLowerCase());
  }

  constructor(
    private router: Router,
    private toast: ToastService
  ) {}

  useTemplate(template: Template) {
    const newCampaign = {
      name: `Draft: ${template.name}`,
      goal: template.goal || 'promote-an-offer',
      subject: template.name,
      product: 'General',
      offer: template.offer || 'General offer',
      cta: template.cta || 'Learn more',
      selectedChannels: template.category === 'sms' ? ['sms'] : ['email', 'social', 'ads', 'landing-page'],
      blocks: template.blocks,
      template: { blocks: template.blocks }
    };

    this.router.navigate(['/app/campaigns/new'], {
      state: {
        campaign: newCampaign
      }
    });

    this.toast.show(`Loaded "${template.name}" into the CampaignAI builder`, 'success');
  }

  createBlank(type: 'email' | 'sms') {
    this.showCreateModal = false;
    this.router.navigate(['/app/campaigns/new'], {
      state: {
        campaign: {
          selectedChannels: [type]
        }
      }
    });
  }
}
