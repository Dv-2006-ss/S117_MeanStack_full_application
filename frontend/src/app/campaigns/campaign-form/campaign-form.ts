import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../auth/auth.service';
import { Campaign, CampaignService, GeneratedOutputs } from '../../core/services/campaign';
import { ToastService } from '../../core/services/toast';

interface DatasetOption {
  _id?: string;
  name: string;
  customers: any[];
}

@Component({
  selector: 'app-campaign-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './campaign-form.html',
  styleUrls: ['./campaign-form.scss']
})
export class CampaignFormComponent implements OnInit {
  currentStep = 1;
  isGenerating = false;
  isSaving = false;
  campaignId = '';

  datasets: DatasetOption[] = [];
  selectedDataset: DatasetOption | null = null;
  scheduledAt = '';

  campaign: Campaign = {
    name: '',
    goal: 'promote-an-offer',
    product: '',
    offer: '',
    cta: '',
    sourceSegment: 'All contacts',
    selectedChannels: ['email', 'sms'],
    status: 'draft'
  };

  generatedOutputs: GeneratedOutputs = this.emptyOutputs();

  readonly goals = [
    { value: 'promote-an-offer', label: 'Promote an offer' },
    { value: 'product-launch', label: 'Launch a product' },
    { value: 'event-promotion', label: 'Promote an event' },
    { value: 'win-back-customers', label: 'Re-engage inactive customers' }
  ];

  readonly channels = ['email', 'sms', 'social', 'ads', 'landing-page'];

  constructor(
    private readonly auth: AuthService,
    private readonly campaignService: CampaignService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const navState = history.state;
    const user = this.auth.getCurrentUser();
    const username = user?.name || localStorage.getItem('username') || 'User';
    this.datasets = JSON.parse(localStorage.getItem(`datasets_${username}`) || '[]');

    if (navState?.dataset) {
      this.selectedDataset = navState.dataset;
    }

    if (navState?.campaign) {
      this.campaign = {
        ...this.campaign,
        ...navState.campaign
      };
      this.campaignId = navState.campaign._id || navState.campaign.id || '';
      if (navState.campaign.generatedOutputs) {
        this.generatedOutputs = navState.campaign.generatedOutputs;
      }
    }
  }

  emptyOutputs(): GeneratedOutputs {
    return {
      email: { subject: '', body: '' },
      sms: { message: '' },
      social: { posts: [] },
      ads: { headlines: [], body: '' },
      landingPage: { headline: '', subhead: '', cta: '', sections: [] }
    };
  }

  selectDatasetByName(name: string): void {
    this.selectedDataset = this.datasets.find((dataset) => dataset.name === name) || null;
  }

  toggleChannel(channel: string): void {
    const current = this.campaign.selectedChannels || [];
    if (current.includes(channel)) {
      this.campaign.selectedChannels = current.filter((entry) => entry !== channel);
      return;
    }

    this.campaign.selectedChannels = [...current, channel];
  }

  nextStep(): void {
    this.currentStep = Math.min(this.currentStep + 1, 5);
  }

  previousStep(): void {
    this.currentStep = Math.max(this.currentStep - 1, 1);
  }

  generateOutputs(): void {
    this.isGenerating = true;
    const user = this.auth.getCurrentUser();

    this.campaignService.generateCampaign({
      ...this.campaign,
      name: this.campaign.name || `${this.campaign.goal} campaign`,
      sourceDataset: this.selectedDataset
        ? {
            id: this.selectedDataset._id,
            name: this.selectedDataset.name,
            customerCount: this.selectedDataset.customers?.length || 0
          }
        : undefined,
      audienceDescription: user?.brandProfile?.audienceDescription,
      brandProfile: user?.brandProfile
    } as Campaign).subscribe({
      next: (response) => {
        this.generatedOutputs = response.generatedOutputs || this.emptyOutputs();
        this.currentStep = 5;
        this.isGenerating = false;
      },
      error: () => {
        this.toast.show('Failed to generate campaign outputs.', 'error');
        this.isGenerating = false;
      }
    });
  }

  saveDraft(): void {
    this.persistCampaign('draft');
  }

  sendNow(): void {
    this.persistCampaign('sent');
  }

  scheduleCampaign(): void {
    if (!this.scheduledAt) {
      this.toast.show('Select a schedule time first.', 'error');
      return;
    }

    this.persistCampaign('scheduled');
  }

  persistCampaign(mode: 'draft' | 'sent' | 'scheduled'): void {
    if (!this.campaign.name.trim()) {
      this.toast.show('Add a campaign name before saving.', 'error');
      return;
    }

    if (!this.selectedDataset) {
      this.toast.show('Select an audience dataset before continuing.', 'error');
      return;
    }

    const payload: Campaign = {
      ...this.campaign,
      _id: this.campaignId || undefined,
      status: mode,
      subject: this.generatedOutputs.email.subject,
      htmlContent: this.generatedOutputs.email.body,
      generatedOutputs: this.generatedOutputs,
      sourceDataset: {
        id: this.selectedDataset._id,
        name: this.selectedDataset.name,
        customerCount: this.selectedDataset.customers?.length || 0
      },
      targetAudience: this.selectedDataset.customers || [],
      scheduledAt: mode === 'scheduled' ? this.scheduledAt : undefined
    };

    this.isSaving = true;
    this.campaignService.saveCampaign(payload).subscribe({
      next: (response) => {
        const savedCampaign = response.campaign;
        this.campaignId = savedCampaign?._id || '';

        if (mode === 'draft' || !savedCampaign?._id) {
          this.toast.show('Campaign draft saved.', 'success');
          this.isSaving = false;
          return;
        }

        this.campaignService.sendCampaign(savedCampaign._id, {
          targetAudience: payload.targetAudience,
          scheduledAt: payload.scheduledAt
        }).subscribe({
          next: () => {
            this.toast.show(mode === 'scheduled' ? 'Campaign scheduled.' : 'Campaign launch started.', 'success');
            this.isSaving = false;
            this.router.navigate(['/app/campaigns']);
          },
          error: () => {
            this.toast.show('Campaign was saved, but launch failed.', 'error');
            this.isSaving = false;
          }
        });
      },
      error: () => {
        this.toast.show('Unable to save campaign right now.', 'error');
        this.isSaving = false;
      }
    });
  }

  arrayToText(value: string[]): string {
    return value.join('\n');
  }

  updateArray(target: 'social' | 'ads' | 'landing', value: string): void {
    const lines = value.split('\n').map((entry) => entry.trim()).filter(Boolean);
    if (target === 'social') {
      this.generatedOutputs.social.posts = lines;
      return;
    }
    if (target === 'ads') {
      this.generatedOutputs.ads.headlines = lines;
      return;
    }
    this.generatedOutputs.landingPage.sections = lines;
  }
}
